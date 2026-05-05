import { Controller } from "@hotwired/stimulus"
import Formatter from "../formatter/formatter"

export default class LineNumbersController extends Controller {
  static targets = ["textarea", "lineNumbers"]

  declare textareaTarget: HTMLTextAreaElement
  declare lineNumbersTarget: HTMLElement

  private formatter!: Formatter

  connect() {
    this.formatter = new Formatter(this.textareaTarget, this.lineNumbersTarget)
    this.formatter.updateLineNumbers()
  }

  updateLineNumbers(): void {
    this.formatter.updateLineNumbers()
  }

  syncScroll(): void {
    this.formatter.syncScroll()
  }
}
