/**
 * QuestionComponent.js
 * Renders individual quiz questions and handles answer validation.
 */

class QuestionComponent extends HTMLElement {
    static get observedAttributes() {
        return ['data-question', 'data-options', 'data-answer', 'data-explanation'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name){
            case 'data-question':
                this.question = newValue;
                break;
            case 'data-options':
                this.options = JSON.parse(newValue || '[]');
                break;
            case 'data-answer':
                this.answer = newValue;
                break;
            case 'data-explanation':
                this.explanation = newValue;
                break;
            default:
                break;
        }
        this.render();
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.question = this.getAttribute('data-question') || '';
        this.options = JSON.parse(this.getAttribute('data-options') || '[]');
        this.answer = this.getAttribute('data-answer') || '';
        this.explanation = this.getAttribute('data-explanation') || '';
        this.render();
    }

    render() {
        // Clear shadow root
        this.shadowRoot.innerHTML = '';

        // Add style
        const style = document.createElement('link');
        Object.assign(style, {
            href: './QuestionComponent/QuestionComponent.css',
            rel: 'stylesheet'
        });
        this.shadowRoot.appendChild(style);

        // Question text
        const questionText = document.createElement('h3');
        Object.assign(questionText, {
            className: 'question',
            textContent: this.question
        });
        this.shadowRoot.appendChild(questionText);

        // Options
        const optionsList = document.createElement('ul');
        optionsList.className = 'options';

        this.options.forEach((option) => {
            const optionItem = document.createElement('li');
            Object.assign(optionItem, {
                className: 'option',
                textContent: option
            });
            optionItem.addEventListener('click', () => {
                this.validateAnswer(optionItem, option)
            });
            optionsList.appendChild(optionItem);
        });
        this.shadowRoot.appendChild(optionsList);

        // Explanation (hidden by default, shown after answer selection)
        if (this.explanation) {
            const explanationDiv = document.createElement('div');
            explanationDiv.className = 'explanation';
            explanationDiv.textContent = this.explanation;
            this.shadowRoot.appendChild(explanationDiv);
        }
    }

    validateAnswer(optionItem, selectedAnswer) {
        const isCorrectAnswer = selectedAnswer === this.answer;
        this.dispatchEvent(new CustomEvent('answerSelected', {
            detail: { isCorrectAnswer, selectedAnswer }
        }));
        // Show explanation if available
        const explanationDiv = this.shadowRoot.querySelector('.explanation');
        if (explanationDiv) {
            explanationDiv.style.display = 'block';
        }
        // Add feedback
        optionItem.classList.add(isCorrectAnswer ? 'correct' : 'incorrect');
        // Disable all options after selection
        const options = this.shadowRoot.querySelectorAll('.option');
        options.forEach(opt => {
            opt.style.pointerEvents = 'none';
            opt.removeEventListener('click', this.validateAnswer);
            opt.classList.add('disabled');
            // Highlight the correct answer
            if (opt.textContent === this.answer) {
                opt.classList.add('correct');
            }
        });
    }
}

customElements.define('question-component', QuestionComponent);
