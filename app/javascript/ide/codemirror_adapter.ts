import { EditorView } from "@codemirror/view"
import { Extension, EditorState, Compartment } from "@codemirror/state"

export class CodemirrorAdapter {
  private _view: EditorView
  private _compartment: Compartment
  constructor(parent: HTMLElement, initialContent = "", additionalExtentions: Extension[] = []) {
    //splice additional extensions between a locked state and styling
    this._compartment = new Compartment()
    const extensions = [
      this._compartment.of(EditorView.editable.of(false)),
      ...additionalExtentions,
      EditorView.theme({
        "&": { height: "100%" },
        ".cm-scroller": {
          overflow: "auto",
          "line-height": "1.2",
          "font-size": "var(--font-size-sm)"
        },
        ".cm-content": { color: "var(--tan)" },
        ".cm-gutters": {
          background: "var(--gutter-bg)",
          border: "none",
        },
        ".cm-lineNumbers .cm-gutterElement": {
          color: "var(--syntax-comment)",
        },
        ".cm-breakpoint-gutter": {
          width: "1.2em",
          cursor: "pointer",
        },
        ".cm-breakpoint-marker": {
          color: "var(--red)",
          display: "inline-block",
          width: "100%",
          textAlign: "center",
          lineHeight: "1",
        },
      })
    ]
    //create a state from initial content and extensions
    const state = EditorState.create({ doc: initialContent, extensions })
    //this.view is a new view from state
    this._view = this._view = new EditorView({ state, parent })
  }

  unlock(): void {
    this._view.dispatch({
      effects: this._compartment.reconfigure(EditorView.editable.of(true)),
    })
  }

  get contents(): string {
    return this._view.state.doc.toString()
  }

  set contents(data: string) {
    this._view.dispatch({
      changes: { from: 0, to: this._view.state.doc.length, insert: data },
    })
  }
}
