import { Controller } from "@hotwired/stimulus"
import type { IEditorController } from "./editor_controller.interface"
import Editor from "../editor"

export default class EditorController extends Controller implements IEditorController {
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
