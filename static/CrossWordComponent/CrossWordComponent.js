/**
 * CrosswordComponent is a custom web component that dynamically renders a crossword puzzle.
 *
 * Attributes:
 * - `data-crossword`: JSON string representing crossword data (array of objects with `answer`, `orientation`, `startx`, `starty`, `clue`).
 * - `data-crossword-rows`: Number of rows in the crossword grid (default: 10).
 * - `data-crossword-cols`: Number of columns in the crossword grid (default: 10).
 *
 * Example Usage:
 * <cross-word-component
 *   data-crossword='[{"answer":"HELLO","orientation":"across","startx":1,"starty":1,"clue":"A greeting"}]'
 *   data-crossword-rows="10"
 *   data-crossword-cols="10">
 * </cross-word-component>
 */
class CrosswordComponent extends HTMLElement {
    /**
     * Specifies the attributes to observe for changes.
     * @returns {string[]} List of observed attribute names.
     */
    static get observedAttributes() {
        return ['data-crossword', 'data-crossword-rows', 'data-crossword-cols'];
    }

    /**
     * Constructor initializes the shadow DOM and renders the component.
     */
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.render();
    }

    /**
     * Callback triggered when observed attributes change.
     * @param {string} name - Name of the changed attribute.
     * @param {string} oldValue - Previous value of the attribute.
     * @param {string} newValue - New value of the attribute.
     */
    attributeChangedCallback(name, oldValue, newValue) {
        if (['data-crossword', 'data-crossword-rows', 'data-crossword-cols'].includes(name)) {
            this.render();
        }
    }

    /**
     * Renders the crossword grid and clues based on the component's attributes.
     */
    render() {
        this.shadowRoot.innerHTML = '';
        this.addStylesheet();

        const crosswordData = this.parseAttribute('data-crossword', []);
        const rows = this.parseAttribute('data-crossword-rows', 10, parseInt);
        const cols = this.parseAttribute('data-crossword-cols', 10, parseInt);

        const table = this.createCrosswordTable(rows, cols);
        this.shadowRoot.appendChild(table);

        this.fillCrosswordData(crosswordData);
        this.shadowRoot.appendChild(this.createCluesSection(crosswordData));
    }

    /**
     * Adds the component's stylesheet to the shadow DOM.
     */
    addStylesheet() {
        const link = document.createElement('link');
        link.setAttribute('rel', 'stylesheet');
        link.setAttribute('href', chrome.runtime.getURL('static/CrossWordComponent/CrossWordComponent.css'));
        this.shadowRoot.appendChild(link);
    }

    /**
     * Parses an attribute value with a fallback to a default value.
     * @param {string} attrName - Name of the attribute to parse.
     * @param {*} defaultValue - Default value if the attribute is missing or invalid.
     * @param {Function} [parser=JSON.parse] - Optional parser function (default: JSON.parse).
     * @returns {*} Parsed attribute value or the default value.
     */
    parseAttribute(attrName, defaultValue, parser = JSON.parse) {
        try {
            return parser(this.getAttribute(attrName) || defaultValue);
        } catch {
            return defaultValue;
        }
    }

    /**
     * Creates the crossword grid as an HTML table.
     * @param {number} rows - Number of rows in the grid.
     * @param {number} cols - Number of columns in the grid.
     * @returns {HTMLTableElement} The generated table element.
     */
    createCrosswordTable(rows, cols) {
        const table = document.createElement('table');
        for (let r = 0; r < rows; r++) {
            const tr = document.createElement('tr');
            for (let c = 0; c < cols; c++) {
                const td = document.createElement('td');
                tr.appendChild(td);
            }
            table.appendChild(tr);
        }
        return table;
    }

    /**
     * Fills the crossword grid with answers and clues.
     * @param {Array} crosswordData - Array of crossword data objects.
     */
    fillCrosswordData(crosswordData) {
        crosswordData
            .filter(({ startx, starty }) => startx !== undefined && starty !== undefined)
            .forEach(({ answer, orientation, startx, starty, clue }) => {
                for (let i = 0; i < answer.length; i++) {
                    const x = orientation === 'across' ? startx + i : startx;
                    const y = orientation === 'across' ? starty : starty + i;
                    this.updateCell(x, y, answer[i], clue);
                }
            });
    }

    /**
     * Updates a specific cell in the crossword grid.
     * @param {number} x - Column index of the cell.
     * @param {number} y - Row index of the cell.
     * @param {string} answerChar - Correct answer character for the cell.
     * @param {string} clue - Clue associated with the cell.
     */
    updateCell(x, y, answerChar, clue) {
        const table = this.shadowRoot.querySelector('table');
        const cell = table?.querySelector(`tr:nth-child(${y}) td:nth-child(${x})`);
        if (cell) {
            cell.setAttribute('data-answer', answerChar.toUpperCase());
            cell.contentEditable = 'true';
            cell.setAttribute('title', clue || '');
            cell.addEventListener('input', this.handleCellInput.bind(this, cell));
        }
    }

    /**
     * Handles user input in a crossword cell.
     * @param {HTMLElement} cell - The cell being edited.
     * @param {Event} event - The input event.
     */
    handleCellInput(cell, event) {
        if (cell.textContent.length > 1) {
            cell.textContent = cell.textContent.slice(0, 1);
        }
        const isCorrect = cell.textContent.toUpperCase() === cell.getAttribute('data-answer');
        cell.classList.toggle('correct', isCorrect);
        if (isCorrect) {
            cell.contentEditable = 'false';
        }
    }

    /**
     * Creates the clues section for the crossword.
     * @param {Array} crosswordData - Array of crossword data objects.
     * @returns {HTMLDivElement} The generated clues section.
     */
    createCluesSection(crosswordData) {
        const cluesDiv = document.createElement('div');
        cluesDiv.classList.add('clues');

        const createClueList = (orientation) => {
            const header = document.createElement('h3');
            header.textContent = orientation.charAt(0).toUpperCase() + orientation.slice(1);
            cluesDiv.appendChild(header);

            const list = document.createElement('ol');
            crosswordData
                .filter(c => c.orientation === orientation)
                .forEach(({ clue }) => {
                    const li = document.createElement('li');
                    li.textContent = clue;
                    list.appendChild(li);
                });
            cluesDiv.appendChild(list);
        };

        createClueList('across');
        createClueList('down');

        return cluesDiv;
    }
}

// Define the custom element
customElements.define('cross-word-component', CrosswordComponent);