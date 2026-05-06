import { Controller } from "@hotwired/stimulus"
import Formatter from "../formatter/formatter"

export default class TextFormatController extends Controller {
  static targets = ["textarea", "lineNumbers"]

  declare textareaTarget: HTMLTextAreaElement
  declare lineNumbersTarget: HTMLElement

  private formatter!: Formatter

  /** Creates the formatter and renders initial line numbers on connect. */
  connect() {
    this.formatter = new Formatter(this.textareaTarget, this.lineNumbersTarget)
    this.formatter.updateLineNumbers()
  }

  /** Recalculates and renders line numbers to match the current textarea content. */
  updateLineNumbers(): void {
    this.formatter.updateLineNumbers()
  }

  /** Synchronizes the line number gutter scroll position with the textarea. */
  syncScroll(): void {
    this.formatter.syncScroll()
  }

  /** Forwards keydown events to the formatter for editor-specific behavior. */
  handleKeydown(event: KeyboardEvent) {
    this.formatter.handleKeydown(event)
  }
}

