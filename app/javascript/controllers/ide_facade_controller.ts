import { Controller } from "@hotwired/stimulus"
import type { IIDEFacadeController } from "./ide_facade_controller.interface"
import Formatter from "../formatter/formatter"

export default class IDEFacadeController extends Controller implements IIDEFacadeController {
  static targets = ["textarea", "lineNumbers"]

  declare textareaTarget: HTMLTextAreaElement
  declare lineNumbersTarget: HTMLElement

  private formatter!: Formatter

  connect(): void {
    this.formatter = new Formatter(this.textareaTarget, this.lineNumbersTarget)
    this.formatter.updateLineNumbers()
  }

  updateLineNumbers(): void {
    this.formatter.updateLineNumbers()
  }

  syncScroll(): void {
    this.formatter.syncScroll()
  }

  handleKeydown(event: KeyboardEvent): void {
    this.formatter.handleKeydown(event)
  }
}
