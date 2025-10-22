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

        const link = document.createElement('link');
        link.setAttribute('rel', 'stylesheet');
        link.setAttribute('href', chrome.runtime.getURL('static/CrossWordComponent/CrossWordComponent.css'));
        this.shadowRoot.appendChild(link);

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
        // Clear previous content and append the new table
        this.shadowRoot.appendChild(table);

        // Fill in spaces for the words
        crosswordData
            .filter(result => result.startx !== undefined && result.starty !== undefined)
            .forEach(result => {
                const { answer, orientation, startx, starty } = result;
                for (let i = 0; i < answer.length; i++) {
                    const x = orientation === 'across' ? startx + i : startx;
                    const y = orientation === 'across' ? starty : starty + i;
                    this.handleCell(x, y, answer[i]);
                }
            });

        // Build the clues section
        const cluesDiv = document.createElement('div');
        cluesDiv.classList.add('clues');
        
        const acrossClues = crosswordData.filter(c => c.orientation === 'across');
        const downClues = crosswordData.filter(c => c.orientation === 'down');

        const acrossHeader = document.createElement('h3');
        acrossHeader.textContent = 'Across';
        cluesDiv.appendChild(acrossHeader);
        const acrossList = document.createElement('ol');
        acrossClues.forEach(({clue}) => {
            const li = document.createElement('li');
            li.textContent = clue;
            acrossList.appendChild(li);
        });
        cluesDiv.appendChild(acrossList);

        const downHeader = document.createElement('h3');
        downHeader.textContent = 'Down';
        cluesDiv.appendChild(downHeader);
        const downList = document.createElement('ol');
        downClues.forEach(({clue}) => {
            const li = document.createElement('li');
            li.textContent = clue;
            downList.appendChild(li);
        });
        cluesDiv.appendChild(downList);
        this.shadowRoot.appendChild(cluesDiv);
    }

    handleCell(x, y, answerChar) {
        const table = this.shadowRoot.querySelector('table');
        const cell = table.querySelector(`tr:nth-child(${y}) td:nth-child(${x})`);
        if (cell) {
            cell.setAttribute('data-answer', answerChar.toUpperCase());
            cell.contentEditable = 'true';
            cell.addEventListener('input', (event) => {
                if (cell.textContent.length > 1) {
                    cell.textContent = cell.textContent.slice(0, 1);
                }
                const isCorrect = event.target.textContent.toUpperCase() === cell.getAttribute('data-answer').toUpperCase();
                cell.classList.toggle('correct', isCorrect);
            });
        }
    }
}

customElements.define('cross-word-component', CrosswordComponent);