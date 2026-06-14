import { EditorState } from "@codemirror/state"
import { EditorView } from "@codemirror/view"
import type { IOutputPanel } from "./output_panel.interface"

export class CodeMirrorOutputPanel implements IOutputPanel {
  private readonly view: EditorView

  constructor(private readonly container: HTMLElement) {
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
