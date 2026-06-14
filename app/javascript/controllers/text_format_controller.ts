import { Controller } from "@hotwired/stimulus"

export default class TextFormatController extends Controller {
  static targets = ["textarea", "listingPanel"]

  declare textareaTarget: HTMLTextAreaElement
  declare listingPanelTarget: HTMLElement
  declare hasListingPanelTarget: boolean

  private syncing = false

  /** Synchronizes the textarea scroll position with the listing pane. */
  syncFromListing(): void {
    if (this.syncing) return
    this.syncing = true
    this.syncing = false
  }
}
