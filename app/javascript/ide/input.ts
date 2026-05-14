import type { IInput } from "./input.interface"

export class Input implements IInput {

  private _el: HTMLTextAreaElement
  private readonly _trailingNewLines = /\n{2,}$/
  public edited = true

  constructor(textArea: HTMLTextAreaElement) {
    this._el = textArea
    this._el.disabled = true
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

  private _dispatchInputEvent(): void {
    this._el.dispatchEvent(new Event("input", { bubbles: true }))
  }
}
