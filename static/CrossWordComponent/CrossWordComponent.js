/**
 * CrosswordComponent is a custom element that displays a crossword puzzle.
 * It receives crossword data via the `data-crossword` attribute.
 */
class CrosswordComponent extends HTMLElement {
    static get observedAttributes() {
        return ['data-crossword', 'data-crossword-rows', 'data-crossword-cols'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'data-crossword' || name === 'data-crossword-rows' || name === 'data-crossword-cols') {
            this.render();
        }
    }

    render() {
        this.shadowRoot.innerHTML = '';

        const crosswordData = JSON.parse(this.getAttribute('data-crossword') || '[]');
        const rows = parseInt(this.getAttribute('data-crossword-rows')) || 10;
        const cols = parseInt(this.getAttribute('data-crossword-cols')) || 10;
        
        // Build the crossword table
        const table = document.createElement('table');
        for (let r = 0; r < rows; r++) {
            const tr = document.createElement('tr');
            for (let c = 0; c < cols; c++) {
                const td = document.createElement('td');
                tr.appendChild(td);
            }
            table.appendChild(tr);
        }

        // Fill in spaces for the words
        crosswordData.forEach(result => {
            const { answer, orientation, startx, starty } = result;
            for (let i = 0; i < answer.length; i++) {
                const x = orientation === 'across' ? startx + i : startx;
                const y = orientation === 'across' ? starty : starty + i;
                const cell = table.querySelector(`tr:nth-child(${y}) td:nth-child(${x})`);
                if (cell) cell.textContent = answer[i].toUpperCase();
            }
        });

        // Clear previous content and append the new table
        this.shadowRoot.appendChild(table);
    }
}

customElements.define('cross-word-component', CrosswordComponent);