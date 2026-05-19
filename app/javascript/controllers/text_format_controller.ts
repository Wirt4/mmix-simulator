import { Controller } from "@hotwired/stimulus"
import Formatter from "../formatter/formatter"
import { highlight } from "../ide/syntax_highlighter"

export default class TextFormatController extends Controller {
  static targets = ["textarea", "lineNumbers", "listingPanel", "highlight"]

  declare textareaTarget: HTMLTextAreaElement
  declare lineNumbersTarget: HTMLElement
  declare listingPanelTarget: HTMLElement
  declare hasListingPanelTarget: boolean
  declare highlightTarget: HTMLElement
  declare hasHighlightTarget: boolean

  private formatter!: Formatter
  private syncing = false

  /** Creates the formatter and renders initial line numbers on connect. */
  connect() {
    this.formatter = new Formatter(this.textareaTarget, this.lineNumbersTarget)
    this.formatter.updateLineNumbers()
    if (this.hasHighlightTarget) {
      this.textareaTarget.classList.add("editor-textarea--highlighted")
      this._updateHighlight()
    }
  }

  /** Recalculates and renders line numbers to match the current textarea content. */
  updateLineNumbers(): void {
    this.formatter.updateLineNumbers()
  }

  /** Updates the syntax highlight overlay to reflect current textarea content. */
  updateHighlight(): void {
    this._updateHighlight()
  }

  /** Synchronizes the line number gutter and listing pane scroll with the textarea. */
  syncScroll(): void {
    if (this.syncing) return
    this.syncing = true
    this.formatter.syncScroll()
    if (this.hasHighlightTarget) {
      this.highlightTarget.scrollTop = this.textareaTarget.scrollTop
      this.highlightTarget.scrollLeft = this.textareaTarget.scrollLeft
    }
    if (this.hasListingPanelTarget) {
      this.listingPanelTarget.scrollTop = this.textareaTarget.scrollTop
    }
    this.syncing = false
  }

  /** Synchronizes the textarea scroll position with the listing pane. */
  syncFromListing(): void {
    if (this.syncing) return
    this.syncing = true
    this.textareaTarget.scrollTop = this.listingPanelTarget.scrollTop
    this.formatter.syncScroll()
    this.syncing = false
  }

  /** Forwards keydown events to the formatter for editor-specific behavior. */
  handleKeydown(event: KeyboardEvent) {
    this.formatter.handleKeydown(event)
  }

  private _updateHighlight(): void {
    if (this.hasHighlightTarget) {
      this.highlightTarget.innerHTML = highlight(this.textareaTarget.value) + "\n"
    }
  }
}

