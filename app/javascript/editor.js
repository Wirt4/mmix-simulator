export default class Editor {
  constructor(textarea, lineNumbers) {
    this.textarea = textarea
    this.lineNumbers = lineNumbers
  }

  updateLineNumbers() {
    const lines = this.textarea.value.split("\n").length
    const numbers = []
    for (let i = 1; i <= lines; i++) {
      numbers.push(`<span>${i}</span>`)
    }
    this.lineNumbers.innerHTML = numbers.join("")
  }

  syncScroll() {
    this.lineNumbers.scrollTop = this.textarea.scrollTop
  }

  handleKeydown(event) {
    this.textarea.value = "he  llo"
    /*
    if (event.key === "Tab") {
      event.preventDefault()
      const start = this.textarea.selectionStart
      const end = this.textarea.selectionEnd
      this.textarea.value = this.textarea.value.substring(0, start) + "  " + this.textarea.value.substring(end)
      this.textarea.selectionStart = this.textarea.selectionEnd = start + 2
      this.updateLineNumbers()
    }
    */
  }
}
