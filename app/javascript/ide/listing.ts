import { EditorState } from "@codemirror/state"
import { EditorView } from "@codemirror/view"
import type { IListing } from "./listing.interface"

export class Listing implements IListing {
  private readonly view: EditorView
  private readonly _btn: HTMLButtonElement
  private readonly _panel: HTMLElement
  private readonly _collapsed = "listing-panel--collapsed"

  constructor(container: HTMLElement, btn: HTMLButtonElement, panel: HTMLElement) {
    this._btn = btn
    this._panel = panel

    this.view = new EditorView({
      state: EditorState.create({
        doc: "",
        extensions: [
          EditorView.editable.of(false),
          EditorView.theme({
            "&": { height: "100%" },
            ".cm-scroller": { overflow: "auto" },
          }),
        ],
      }),
      parent: container,
    })

    this.default()
  }

  setContents(contents: string): void {
    this.view.dispatch({
      changes: { from: 0, to: this.view.state.doc.length, insert: contents },
    })
  }

  getContents(): string {
    return this.view.state.doc.toString()
  }

  get size(): number {
    return this.view.state.doc.toString().replace(/\n+$/, "").split("\n").length
  }

  get isOpen(): boolean {
    return !this._panel.classList.contains(this._collapsed)
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
