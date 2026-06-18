import { EditorState } from "@codemirror/state"
import { EditorView } from "@codemirror/view"
import type { IListing } from "./listing.interface"

export class Listing implements IListing {
  private readonly _view: EditorView
  private readonly _btn: HTMLButtonElement
  private readonly _panel: HTMLElement
  private readonly _collapsed = "listing-panel--collapsed"

  constructor(container: HTMLElement, btn: HTMLButtonElement, panel: HTMLElement) {
    this._btn = btn
    this._panel = panel

    this._view = new EditorView({
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
    this._view.dispatch({
      changes: { from: 0, to: this._view.state.doc.length, insert: contents },
    })
  }

  getContents(): string {
    return this._view.state.doc.toString()
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
