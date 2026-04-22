import { Controller } from "@hotwired/stimulus"
import type { IIDEFacadeController } from "./ide_facade_controller.interface"
import Editor from "../editor/editor"

export default class IDEFacadeController extends Controller implements IIDEFacadeController {
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
