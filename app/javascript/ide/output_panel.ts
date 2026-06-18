import { EditorState } from "@codemirror/state"
import { EditorView } from "@codemirror/view"
import type { IOutputPanel } from "./output_panel.interface"

export class OutputPanel implements IOutputPanel {
  private readonly _view: EditorView

  constructor(private readonly container: HTMLElement) {
    const body = container.querySelector<HTMLElement>(".output-body")
    if (!body) throw new Error("CodeMirrorOutputPanel: no .output-body found in container")
    //opportunity below to reduce duplication
    this._view = new EditorView({
      state: EditorState.create({
        doc: "",
        extensions: [
          EditorView.editable.of(false),
          EditorView.theme({
            "&": { height: "100%" },
            ".cm-scroller": {
              overflow: "auto",
              "line-height": "1.2",
              "font-size": "var(--font-size-sm)"
            },
            ".cm-content": { color: "var(--tan)" },
          }),
        ],
      }),
      parent: body,
    })
    this.hide()
  }

  getValue(): string {
    return this._view.state.doc.toString()
  }

  setValue(text: string): void {
    this._view.dispatch({
      changes: { from: 0, to: this._view.state.doc.length, insert: text },
    })
    if (text) {
      this.show()
      return
    }
    this.hide()
  }

  clear(): void {
    this._view.dispatch({
      changes: { from: 0, to: this._view.state.doc.length, insert: "" },
    })
    this.hide()
  }

  hide(): void {
    this.container.hidden = true
  }

  show(): void {
    this.container.hidden = false
  }
}
