import { Controller } from "@hotwired/stimulus"
import Formatter from "../formatter/formatter"

export default class TextFormatController extends Controller {
  static targets = ["textarea", "lineNumbers", "listingPanel"]

  declare textareaTarget: HTMLTextAreaElement
  declare lineNumbersTarget: HTMLElement
  declare listingPanelTarget: HTMLElement
  declare hasListingPanelTarget: boolean

  private formatter!: Formatter
  private syncing = false

  /** Creates the formatter and renders initial line numbers on connect. */
  connect() {
    this.formatter = new Formatter(this.textareaTarget, this.lineNumbersTarget)
    this.formatter.updateLineNumbers()
  }

  /** Recalculates and renders line numbers to match the current textarea content. */
  updateLineNumbers(): void {
    this.formatter.updateLineNumbers()
  }

  /** Synchronizes the line number gutter and listing pane scroll with the textarea. */
  syncScroll(): void {
    if (this.syncing) return
    this.syncing = true
    this.formatter.syncScroll()
    if (this.hasListingPaneTarget) {
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
}

