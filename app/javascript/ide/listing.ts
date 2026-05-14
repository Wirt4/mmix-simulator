import { IListing } from "./listing.interface"

export class Listing implements IListing {
  private _div: HTMLElement
  private _collapsed: string
  private _btn: HTMLButtonElement
  private _panel: HTMLElement

  constructor(div: HTMLElement, btn: HTMLButtonElement, panel: HTMLElement) {
    this._div = div
    this._collapsed = "listing-panel--collapsed"
    this._btn = btn
    this._panel = panel
    this.default()
  }

  get isOpen(): boolean {
    return !this._panel.classList.contains(this._collapsed)
  }

  setContents(contents: string): void {
    this._div.textContent = contents
  }

  get size(): number {
    return this._div.textContent.replace(/\n+$/, "").split("\n").length
  }

  default(): void {
    this._panel.classList.add(this._collapsed)
    this._btn.disabled = true
  }

  toggle(): void {
    this._panel.classList.toggle(this._collapsed)
  }

  unlock(): void {
    this._btn.disabled = false
  }
}
