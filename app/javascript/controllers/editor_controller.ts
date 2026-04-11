import { Controller } from "@hotwired/stimulus"
import Editor from "../editor"

export default class EditorController extends Controller {
  static targets = ["textarea", "lineNumbers"]

  declare textareaTarget: HTMLTextAreaElement
  declare lineNumbersTarget: HTMLElement

  private editor!: Editor

  connect(): void {
    this.editor = new Editor(this.textareaTarget, this.lineNumbersTarget)
    this.editor.updateLineNumbers()
  }

  updateLineNumbers(): void {
    this.editor.updateLineNumbers()
  }

  syncScroll(): void {
    this.editor.syncScroll()
  }

  handleKeydown(event: KeyboardEvent): void {
    this.editor.handleKeydown(event)
  }
}
