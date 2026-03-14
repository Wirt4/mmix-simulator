/**
 * A code editor that pairs a textarea with a line number gutter.
 * Supports Tab-key indentation and synchronized scrolling.
 */
export default class Editor {
  /**
   * @param {HTMLTextAreaElement} textarea - The textarea element for code input.
   * @param {HTMLElement} lineNumbers - The element that displays line numbers.
   */
  constructor(textarea, lineNumbers) {
    this.textarea = textarea
    this.lineNumbers = lineNumbers
  }

  /**
   * Recalculates and renders line numbers to match the current textarea content.
   */
  updateLineNumbers() {
    const numLines = this.textarea.value.split("\n").length
    this.lineNumbers.innerHTML = this._generateLineNumbers(numLines)
  }

  /**
   * Synchronizes the line number gutter scroll position with the textarea.
   */
  syncScroll() {
    this.lineNumbers.scrollTop = this.textarea.scrollTop
  }

  /**
   * Handles keydown events on the textarea. Intercepts Tab to insert spaces
   * instead of the default focus change.
   * @param {KeyboardEvent} event - The keydown event.
   */
  handleKeydown(event) {
    if (event.key === "Tab") {
      const numSpaces = 2
      event.preventDefault()
      const selection = { start: this.textarea.selectionStart, end: this.textarea.selectionEnd }
      this._insertChars(selection, numSpaces, " ")
      this._advanceSelection(selection.start, numSpaces)
      this.updateLineNumbers()
    }
  }

  /**
   * Generates HTML span elements for each line number.
   * @param {number} numLines - The total number of lines.
   * @returns {string} HTML string of numbered spans.
   * @private
   */
  _generateLineNumbers(numLines) {
    const numbers = []
    for (let i = 1; i <= numLines; i++) {
      numbers.push(`<span>${i}</span>`)
    }
    return numbers.join("")
  }

  /**
   * Replaces the current selection with repeated characters.
   * @param {Object} selection - The selection range.
   * @param {number} selection.start - Start index of the selection.
   * @param {number} selection.end - End index of the selection.
   * @param {number} delimiterCount - Number of times to repeat the character.
   * @param {string} char - The character to insert.
   * @private
   */
  _insertChars({ start, end }, delimiterCount, char) {
    const { value } = this.textarea
    const space = char.repeat(delimiterCount)
    const newValue = value.substring(0, start) + space + value.substring(end)
    this.textarea.value = newValue
  }

  /**
   * Moves the cursor forward after an insertion.
   * @param {number} start - The original cursor position.
   * @param {number} numChars - Number of characters inserted.
   * @private
   */
  _advanceSelection(start, numChars) {
    this.textarea.selectionStart = this.textarea.selectionEnd = start + numChars
  }
}
