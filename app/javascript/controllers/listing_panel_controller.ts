import { Controller } from "@hotwired/stimulus"

export default class ListingPanelController extends Controller {
  static targets = ["panel"]

  declare panelTarget: HTMLElement
  declare hasPanelTarget: boolean

  private collapsed = false

  toggle() {
    this.collapsed = !this.collapsed
    this.panelTarget.classList.toggle("listing-panel--collapsed", this.collapsed)
  }
}
