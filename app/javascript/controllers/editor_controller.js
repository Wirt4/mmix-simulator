import { Controller } from "@hotwired/stimulus"
import Editor from "../editor"

export default class extends Controller {
  static targets = ["textarea", "lineNumbers"]

  connect() {
    this.editor = new Editor(this.textareaTarget, this.lineNumbersTarget)
    this.editor.updateLineNumbers()
  }

  updateLineNumbers() {
    this.editor.updateLineNumbers()
  }

  syncScroll() {
    this.editor.syncScroll()
  }

  handleKeydown(event) {
    this.editor.handleKeydown(event)
  }
}
