import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["textarea", "lineNumbers"]

  connect() {
    this.updateLineNumbers()
  }

  updateLineNumbers() {
    const lines = this.textareaTarget.value.split("\n").length
    const numbers = []
    for (let i = 1; i <= lines; i++) {
      numbers.push(`<span>${i}</span>`)
    }
    this.lineNumbersTarget.innerHTML = numbers.join("")
  }

  syncScroll() {
    this.lineNumbersTarget.scrollTop = this.textareaTarget.scrollTop
  }

  handleKeydown(event) {
    if (event.key === "Tab") {
      event.preventDefault()
      const textarea = this.textareaTarget
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      textarea.value = textarea.value.substring(0, start) + "  " + textarea.value.substring(end)
      textarea.selectionStart = textarea.selectionEnd = start + 2
      this.updateLineNumbers()
    }
  }
}
