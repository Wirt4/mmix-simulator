import { EditorState } from "@codemirror/state"
import { EditorView } from "@codemirror/view"
import type { IOutputPanel } from "./output_panel.interface"

export class CodeMirrorOutputPanel implements IOutputPanel {
  private readonly view: EditorView

  constructor(private readonly container: HTMLElement) {
    const body = container.querySelector<HTMLElement>(".output-body")
    if (!body) throw new Error("CodeMirrorOutputPanel: no .output-body found in container")
    this.view = new EditorView({
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

  setValue(text: string): void {
    this.view.dispatch({
      changes: { from: 0, to: this.view.state.doc.length, insert: text },
    })
    if (text) {
      this.show()
    } else {
      this.hide()
    }
  }

  clear(): void {
    this.view.dispatch({
      changes: { from: 0, to: this.view.state.doc.length, insert: "" },
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
