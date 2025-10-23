/**
 * HangmanComponent is a custom web component that implements a Hangman game.
 */

class HangmanComponent extends HTMLElement {
    static maxAttempts = 6;
    static get observedAttributes() {
        return ['data-word'];
    }

    incorrectAttempts = 0;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'data-word') {
            this.render();
        }
    }

    render() {
        this.shadowRoot.innerHTML = '';
        this.addStylesheet();

        const word = this.getAttribute('data-word');

        const wordContainer = document.createElement('div');
        wordContainer.classList.add('word-container');
        for (let char of word || '') {
            const normalizedChar = char.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const charCell = document.createElement('div');
            charCell.setAttribute('data-answer', normalizedChar.toUpperCase());
            charCell.addEventListener('input', (e) => this.handleCellInput(charCell, e));
            wordContainer.appendChild(charCell);
        }
        this.shadowRoot.appendChild(wordContainer);

        const progressBar = document.createElement('progress');
        progressBar.max = HangmanComponent.maxAttempts;
        progressBar.value = this.incorrectAttempts;
        this.shadowRoot.appendChild(progressBar);

        const alphabetContainer = document.createElement('div');
        alphabetContainer.classList.add('alphabet-container');
        for (let i = 65; i <= 90; i++) {
            const letter = String.fromCharCode(i);
            const letterButton = document.createElement('button');
            letterButton.textContent = letter;
            letterButton.addEventListener('click', () => this.handleLetterGuess(letterButton, letter));
            alphabetContainer.appendChild(letterButton);
        }
        this.shadowRoot.appendChild(alphabetContainer);
    }

    addStylesheet() {
        const linkElem = document.createElement('link');
        linkElem.setAttribute('rel', 'stylesheet');
        linkElem.setAttribute('href', chrome.runtime.getURL('/static/HangmanComponent/HangmanComponent.css'));
        this.shadowRoot.appendChild(linkElem);
    }

    handleLetterGuess(button, letter) {
        button.disabled = true;
        const correctCells = this.shadowRoot.querySelectorAll(`.word-container > div[data-answer='${letter}']`);
        if (correctCells.length > 0) {
            button.classList.add('correct');
            correctCells.forEach(cell => {
                cell.textContent = letter;
            });
        } else {
            // Handle incorrect guess (e.g., decrement attempts, update hangman drawing)
            button.classList.add('incorrect');
            this.incorrectAttempts++;
            const progressBar = this.shadowRoot.querySelector('progress');
            progressBar.value = this.incorrectAttempts;
            if (this.incorrectAttempts >= HangmanComponent.maxAttempts) {
                this.disableAllLetters();
            }
        }
    }

    disableAllLetters() {
        const buttons = this.shadowRoot.querySelectorAll('button');
        buttons.forEach(button => button.disabled = true);
    }
}

customElements.define('hangman-component', HangmanComponent);