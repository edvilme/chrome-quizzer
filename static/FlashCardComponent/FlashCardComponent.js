/**
 * FlashCardComponent is a custom element that represents a flashcard.
 **/

class FlashCardComponent extends HTMLElement {

    static get observedAttributes() {
        return ['data-title', 'data-content', 'data-text-extract'];
    }
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.render();
        }
    }

    render() {
        this.shadowRoot.innerHTML = '';
        this.addStylesheet();

        const title = this.getAttribute('data-title') || '';
        const content = this.getAttribute('data-content') || '';
        const textExtract = this.getAttribute('data-text-extract') || '';

        const cardContainer = document.createElement('div');
        cardContainer.classList.add('flashcard-container');
        cardContainer.style.setProperty('--random-rotation', (Math.random() * 16 - 8) + 'deg'); // Random rotation between -8 and +8 degrees

        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('delete-btn');
        deleteBtn.innerText = '×';
        deleteBtn.title = 'Delete Flashcard';
        deleteBtn.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('deleted', { bubbles: true, composed: true }));
        });
        cardContainer.appendChild(deleteBtn);

        const titleElem = document.createElement('h3');
        titleElem.textContent = title;
        cardContainer.appendChild(titleElem);

        const contentElem = document.createElement('p');
        contentElem.textContent = content;
        cardContainer.appendChild(contentElem);

        if (textExtract) {
            const extractElem = document.createElement('blockquote');
            extractElem.textContent = textExtract;
            cardContainer.appendChild(extractElem);
        }

        this.shadowRoot.appendChild(cardContainer);
    }

    addStylesheet() {
        const linkElem = document.createElement('link');
        linkElem.setAttribute('rel', 'stylesheet');
        linkElem.setAttribute('href', chrome.runtime.getURL('/static/FlashCardComponent/FlashCardComponent.css'));
        this.shadowRoot.appendChild(linkElem);
    }

}

customElements.define('flashcard-component', FlashCardComponent);