import type { IInput } from "./input.interface"
import { highlight as highlightSyntax } from "./syntax_highlighter"

export class Input implements IInput {

  private _el: HTMLTextAreaElement
  private _highlightEl: HTMLElement | null
  private readonly _trailingNewLines = /\n{2,}$/
  public edited = true

  constructor(textArea: HTMLTextAreaElement) {
    this._el = textArea
    this._el.disabled = true
    this._highlightEl = this._el.parentElement?.querySelector(".editor-highlight") ?? null
    if (this._highlightEl) {
      this._el.classList.add("editor-textarea--highlighted")
    }
  }

  public trim(): void {
    const cursor = this._el.selectionStart
    this._el.value = this._el.value.replace(this._trailingNewLines, "")
    if (cursor < this._el.value.length) {
      this._el.selectionStart = cursor
      this._el.selectionEnd = cursor
    }
    this._dispatchInputEvent()
  }

  public getContents(): string {
    return this._el.value
  }

  public pad(lines: number): void {
    if (lines > 0) {
      const padding = new Array<string>(Math.floor(lines)).fill("\n")
      this._el.value += padding.join("")
      this._dispatchInputEvent()
    }
  }

  get size(): number {
    const lines = this._el.value.split("\n").length
    if (lines < 2) {
      return lines
    }
    return lines - 2
  }

  lock(): void {
    this._el.disabled = true
  }

  unlock(): void {
    this._el.disabled = false
  }

  highlight(): void {
    if (this._highlightEl) {
      this._highlightEl.innerHTML = highlightSyntax(this._el.value) + "\n"
    }
  }

  syncHighlightScroll(): void {
    if (this._highlightEl) {
      this._highlightEl.scrollTop = this._el.scrollTop
      this._highlightEl.scrollLeft = this._el.scrollLeft
    }
  }

  private _dispatchInputEvent(): void {
    this._el.dispatchEvent(new Event("input", { bubbles: true }))
  }
}
