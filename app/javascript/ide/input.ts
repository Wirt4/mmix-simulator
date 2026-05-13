import type { IInput } from "./input.interface"

export class Input implements IInput {
  private _el: HTMLTextAreaElement

  public readonly size = 0

  constructor(textArea: HTMLTextAreaElement) {
    this._el = textArea
  }
  public getContents(): string {
    return this._el.value
  }
  public pad(lines: number): void {
    if (lines > 0) {
      const padding = new Array<string>(Math.floor(lines)).fill("\n")
      this._el.value += padding.join("")
    }
  }
}
