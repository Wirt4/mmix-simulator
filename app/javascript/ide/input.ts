import { EditorState, Extension, Compartment } from "@codemirror/state"
import { EditorView, keymap, lineNumbers, ViewUpdate } from "@codemirror/view"
import { defaultKeymap, indentWithTab } from "@codemirror/commands"
import { syntaxHighlighting, HighlightStyle } from "@codemirror/language"

import { mmixal, mmixalHighlightStyle } from "./mmixal_language"
import type { IInput } from "./input.interface"

const editableComp = new Compartment()
export class Input implements IInput {
  private readonly _view: EditorView
  public edited = true

  constructor(
    container: HTMLElement,
    contents: HTMLTextAreaElement,
  ) {
    const extensions = this._initializeConfigExtensions(contents)
    const initialContent = contents?.value ?? ""
    const state = EditorState.create({ doc: initialContent, extensions })
    this._view = new EditorView({ state, parent: container })
  }

  getContents(): string {
    return this._view.state.doc.toString()
  }

  unlock(): void {
    this._view.dispatch({
      effects: editableComp.reconfigure(EditorView.editable.of(true)),
    })
  }
  /**
  * Returns an array of Extentions set with a listener to source
  */
  private _initializeConfigExtensions(source: HTMLTextAreaElement): Extension[] {
    const extensions: Extension[] = []
    //push a locked state to array
    extensions.push(editableComp.of(EditorView.editable.of(false)))
    extensions.push(this._hookUpListener(source))
    extensions.push(this._codeMirrorTheme())
    extensions.push(keymap.of([...defaultKeymap, indentWithTab]))
    // add the mmixal language rules and highlighting to the array 
    extensions.push(mmixal)
    extensions.push(syntaxHighlighting(HighlightStyle.define(mmixalHighlightStyle)))
    extensions.push(lineNumbers())
    return extensions
  }

  private _hookUpListener(source: HTMLTextAreaElement): Extension {
    const callback: (update: ViewUpdate) => void = (update: ViewUpdate) => {
      if (update.docChanged) {
        source.value = update.state.doc.toString()
        source.dispatchEvent(new Event("input", { bubbles: true }))
      }
    }
    return EditorView.updateListener.of(callback)
  }

  private _codeMirrorTheme(): Extension {
    return EditorView.theme({
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
    })
  }
}
