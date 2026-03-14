export default class Editor {
  constructor(textarea, lineNumbers) {
    this.textarea = textarea
    this.lineNumbers = lineNumbers
  }

  updateLineNumbers() {
    const numLines = this.textarea.value.split("\n").length
    this.lineNumbers.innerHTML = this._generateLineNumbers(numLines)
  }

  syncScroll() {
    this.lineNumbers.scrollTop = this.textarea.scrollTop
  }

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

  _generateLineNumbers(numLines) {
    const numbers = []
    for (let i = 1; i <= numLines; i++) {
      numbers.push(`<span>${i}</span>`)
    }
    return numbers.join("")
  }

  _insertChars({ start, end }, delimiterCount, char) {
    const { value } = this.textarea
    const space = char.repeat(delimiterCount)
    const newValue = value.substring(0, start) + space + value.substring(end)
    this.textarea.value = newValue
  }
  _advanceSelection(start, numChars) {
    this.textarea.selectionStart = this.textarea.selectionEnd = start + numChars
  }
}
