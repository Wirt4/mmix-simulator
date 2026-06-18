import { Extension } from "@codemirror/state"
import { EditorView, keymap, lineNumbers, ViewUpdate } from "@codemirror/view"
import { defaultKeymap, indentWithTab } from "@codemirror/commands"
import { syntaxHighlighting, HighlightStyle } from "@codemirror/language"
import { CodemirrorAdapter } from "./codemirror_adapter"

import { mmixal, mmixalHighlightStyle } from "./mmixal_language"
import type { IInput } from "./input.interface"

export class Input implements IInput {
  private _codemirror: CodemirrorAdapter
  public edited = true

  constructor(
    container: HTMLElement,
    contents: HTMLTextAreaElement,
  ) {
    const extensions = this._initializeConfigExtensions(contents)
    const initialContent = contents.value
    this._codemirror = new CodemirrorAdapter(container, initialContent, extensions)
  }

  getContents(): string {
    return this._codemirror.contents
  }

  unlock(): void {
    this._codemirror.unlock()
  }
  /**
  * Returns an array of Extentions set with a listener to source
  */
  private _initializeConfigExtensions(source: HTMLTextAreaElement): Extension[] {
    const extensions: Extension[] = []
    //push a locked state to array
    extensions.push(this._hookUpListener(source))
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
}
