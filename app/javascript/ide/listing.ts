import { CodemirrorAdapter } from "./codemirror_adapter"
import type { IListing } from "./listing.interface"

export class Listing implements IListing {
  private readonly _btn: HTMLButtonElement
  private readonly _panel: HTMLElement
  private readonly _collapsed = "listing-panel--collapsed"
  private _codemirror: CodemirrorAdapter

  constructor(container: HTMLElement, btn: HTMLButtonElement, panel: HTMLElement) {
    this._btn = btn
    this._panel = panel
    this._codemirror = new CodemirrorAdapter(container)
    this.default()
  }

  setContents(contents: string): void {
    this._codemirror.contents = contents
  }

  getContents(): string {
    return this._codemirror.contents
  }

  get isOpen(): boolean {
    if (this._panel.classList.contains(this._collapsed)) return false
    return true
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
