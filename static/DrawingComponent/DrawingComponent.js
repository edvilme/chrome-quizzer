/**
 * DrawingComponent.js
 * Component for drawing functionality in Pictionary game.
 */

class DrawingComponent extends HTMLElement {
    static get observedAttributes() {
        return ["data-prompt"];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.render();
        this.isDrawing = false;
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "data-prompt" && oldValue !== newValue) {
            this.render();
        }
    }

    addStylesheet() {
        const linkElem = document.createElement('link');
        linkElem.setAttribute('rel', 'stylesheet');
        linkElem.setAttribute('href', chrome.runtime.getURL('/static/DrawingComponent/DrawingComponent.css'));
        this.shadowRoot.appendChild(linkElem);
    }

    optimizeCanvas() {
        // Set canvas dimensions only if they differ to avoid unnecessary reflows
        const width = this.canvas.offsetWidth;
        const height = this.canvas.offsetHeight;
        if (this.canvas.width !== width || this.canvas.height !== height) {
            this.canvas.width = width;
            this.canvas.height = height;
        }
    }

    render() {
        // Clear the shadow DOM
        this.shadowRoot.innerHTML = '';
        this.addStylesheet();

        // Create controls container
        const controls = document.createElement('div');
        controls.classList.add('controls');

        const clearButton = document.createElement('button');
        clearButton.textContent = '⟳';
        clearButton.addEventListener('click', () => this.clearCanvas());
        controls.appendChild(clearButton);
        
        const submitButton = document.createElement('button');
        submitButton.textContent = 'Submit';
        submitButton.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('validate', { 
                detail: { drawingData: this.getDrawingData() },
                bubbles: true, 
                composed: true 
            }));
        });
        controls.appendChild(submitButton);

        const prompt = document.createElement('h2');
        prompt.textContent = this.getAttribute('data-prompt');
        controls.appendChild(prompt);

        this.shadowRoot.appendChild(controls);

        // Create and append the canvas element
        this.canvas = document.createElement('canvas');
        this.shadowRoot.appendChild(this.canvas);

        // Optimize canvas dimensions
        this.optimizeCanvas();

        // Reinitialize the drawing context
        this.ctx = this.canvas.getContext('2d');

        // Add event listeners for drawing
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseout', () => this.stopDrawing());
    }

    startDrawing(event) {
        this.isDrawing = true;
        this.ctx.beginPath();
        this.ctx.moveTo(event.offsetX, event.offsetY);
    }

    draw(event) {
        if (!this.isDrawing) return;
        this.ctx.lineTo(event.offsetX, event.offsetY);
        this.ctx.stroke();
        this.dispatchEvent(new CustomEvent('draw', { bubbles: true, composed: true }));
    }

    stopDrawing() {
        this.isDrawing = false;
        this.ctx.closePath();
    }

    clearCanvas() {
        this.dispatchEvent(new CustomEvent('clear', { bubbles: true, composed: true }));
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    getDrawingData() {
        return this.canvas.toDataURL('image/png');
    }
}

customElements.define('drawing-component', DrawingComponent);