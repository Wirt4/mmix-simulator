import { EditorState, Compartment } from "@codemirror/state"
import { EditorView, keymap } from "@codemirror/view"
import { defaultKeymap, indentWithTab } from "@codemirror/commands"
import { syntaxHighlighting, HighlightStyle } from "@codemirror/language"
import { mmixal, mmixalHighlightStyle } from "./mmixal_language"
import type { IInput } from "./input.interface"

const editableComp = new Compartment()
const highlightStyle = HighlightStyle.define(mmixalHighlightStyle)

export class CodeMirrorInput implements IInput {
  private readonly view: EditorView
  private readonly hiddenInput: HTMLInputElement | HTMLTextAreaElement | null
  public edited = true

  constructor(
    container: HTMLElement,
    initialContent = "",
    hiddenInput: HTMLInputElement | HTMLTextAreaElement | null = null,
  ) {
    this.hiddenInput = hiddenInput
    if (this.hiddenInput) {
      this.hiddenInput.value = initialContent
    }

    this.view = new EditorView({
      state: EditorState.create({
        doc: initialContent,
        extensions: [
          keymap.of([...defaultKeymap, indentWithTab]),
          editableComp.of(EditorView.editable.of(false)),
          mmixal,
          syntaxHighlighting(highlightStyle),
          EditorView.updateListener.of((update) => {
            if (update.docChanged && this.hiddenInput) {
              this.hiddenInput.value = this.view.state.doc.toString()
              this.hiddenInput.dispatchEvent(new Event("input", { bubbles: true }))
            }
          }),
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
      parent: container,
    })
  }

  getContents(): string {
    return this.view.state.doc.toString()
  }

  pad(lines: number): void {
    if (lines > 0) {
      const padding = "\n".repeat(Math.floor(lines))
      const end = this.view.state.doc.length
      this.view.dispatch({ changes: { from: end, insert: padding } })
      if (this.hiddenInput) {
        this.hiddenInput.dispatchEvent(new Event("input", { bubbles: true }))
      }
    }
  }

  trim(): void {
    const content = this.view.state.doc.toString()
    const trimmed = content.replace(/\n{2,}$/, "")
    if (trimmed !== content) {
      this.view.dispatch({
        changes: { from: 0, to: this.view.state.doc.length, insert: trimmed },
      })
      if (this.hiddenInput) {
        this.hiddenInput.dispatchEvent(new Event("input", { bubbles: true }))
      }
    }
  }

  get size(): number {
    const lines = this.view.state.doc.toString().split("\n").length
    if (lines < 2) return lines
    return lines - 2
  }

  lock(): void {
    this.view.dispatch({
      effects: editableComp.reconfigure(EditorView.editable.of(false)),
    })
  }

  unlock(): void {
    this.view.dispatch({
      effects: editableComp.reconfigure(EditorView.editable.of(true)),
    })
  }
}
