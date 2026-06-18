import type { IOutputPanel } from "./output_panel.interface"
import { CodemirrorAdapter } from "./codemirror_adapter"

export class OutputPanel implements IOutputPanel {
  private _codemirror: CodemirrorAdapter

  constructor(private readonly container: HTMLElement) {
    const body = container.querySelector<HTMLElement>(".output-body")
    if (!body) throw new Error("CodeMirrorOutputPanel: no .output-body found in container")
    this._codemirror = new CodemirrorAdapter(body, "", [])
    this.hide()
  }

  getValue(): string {
    return this._codemirror.contents
  }

  setValue(text: string): void {
    this._codemirror.contents = text
    if (text) {
      this.show()
      return
    }
    this.hide()
  }

  clear(): void {
    this._codemirror.contents = ""
    this.hide()
  }

  hide(): void {
    this.container.hidden = true
  }

  show(): void {
    this.container.hidden = false
  }
}
