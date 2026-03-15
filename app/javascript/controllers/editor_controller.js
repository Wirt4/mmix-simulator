import { Controller } from "@hotwired/stimulus"
import Editor from "editor"

/**
 * Stimulus controller that wires a code-editor textarea to an {@link Editor}
 * instance, connecting line-number rendering, scroll sync, and keyboard handling.
 *
 * @target textarea - The textarea element for code input.
 * @target lineNumbers - The element that displays line numbers.
 */
export default class extends Controller {
  static targets = ["textarea", "lineNumbers"]

  /**
   * Initializes the {@link Editor} and renders the initial line numbers.
   */
  connect() {
    this.editor = new Editor(this.textareaTarget, this.lineNumbersTarget)
    this.editor.updateLineNumbers()
  }

  /**
   * Action: recalculates line numbers to match the current textarea content.
   */
  updateLineNumbers() {
    this.editor.updateLineNumbers()
  }

  /**
   * Action: synchronizes the line-number gutter scroll with the textarea.
   */
  syncScroll() {
    this.editor.syncScroll()
  }

  /**
   * Action: delegates keydown events to the editor for Tab handling.
   * @param {KeyboardEvent} event - The keydown event.
   */
  handleKeydown(event) {
    this.editor.handleKeydown(event)
  }
}
