import { Extension, StateEffect, StateField, RangeSet, StateEffectType, Transaction, Text } from "@codemirror/state"
import { EditorView, keymap, lineNumbers, BlockInfo, ViewUpdate, GutterMarker, gutter } from "@codemirror/view"
import { defaultKeymap, indentWithTab } from "@codemirror/commands"
import { syntaxHighlighting, HighlightStyle } from "@codemirror/language"
import { CodemirrorAdapter } from "./codemirror_adapter"

import { mmixal, mmixalHighlightStyle } from "./mmixal_language"
import type { IInput } from "./input.interface"
import type { IDebugSession } from "./debug_session.interface"

export class Input implements IInput {
  private _codemirror: CodemirrorAdapter
  public edited = true

  constructor(
    container: HTMLElement,
    contents: HTMLTextAreaElement,
    debugSession?: IDebugSession,
  ) {
    // Initialize codemirror then
    const extensions = this._initializeConfigExtensions(contents, debugSession)
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
  * Returns an array of Extensions set with a listener to source
  */
  //alternatively... could set this as a public static method and update the constructor to take an extensions array directly
  private _initializeConfigExtensions(
    source: HTMLTextAreaElement,
    debugSession?: IDebugSession,
  ): Extension[] {
    const extensions: Extension[] = []
    //push a locked state to array
    extensions.push(this._hookUpListener(source))
    extensions.push(keymap.of([...defaultKeymap, indentWithTab]))
    // add the mmixal language rules and highlighting to the array
    extensions.push(mmixal)
    extensions.push(syntaxHighlighting(HighlightStyle.define(mmixalHighlightStyle)))
    extensions.push(this._breakpointGutter(debugSession && ((lines) => { debugSession.breakpoints = lines })))
    extensions.push(lineNumbers())
    return extensions
  }

  private _breakpointGutter(callback?: (lines: number[]) => void): Extension {
    const toggle = StateEffect.define<number>()
    const marker = new BreakpointMarker("span", "cm-breakpoint-marker", "●")
    const field = this._createField(marker, toggle, callback)
    const gutter = this._createGutter(field, marker, toggle, "cm-breakpoint-gutter")
    return [field, gutter]
  }

  private _createField(
    marker: GutterMarker,
    toggle: StateEffectType<number>,
    callback?: (lines: number[]) => void,
  ): StateField<RangeSet<GutterMarker>> {
    const update = this._fieldUpdate(marker, toggle, callback)
    const create = () => RangeSet.empty
    return StateField.define<RangeSet<GutterMarker>>({ create, update })
  }

  private _createGutter(
    field: StateField<RangeSet<GutterMarker>>,
    marker: GutterMarker,
    toggle: StateEffectType<number>,
    className: string
  ): Extension {
    const mousedown = (_view: EditorView, _line: BlockInfo) => {
      _view.dispatch({ effects: toggle.of(_line.from) })
      return true
    }

    return gutter({
      class: className,
      markers: (view) => view.state.field(field),
      initialSpacer: () => marker,
      domEventHandlers: { mousedown },
    })
  }

  private _fieldUpdate(
    marker: GutterMarker,
    toggle: StateEffectType<number>,
    callback?: (lines: number[]) => void
  ): (set: RangeSet<GutterMarker>, transaction: Transaction) => RangeSet<GutterMarker> {
    //initialize closure variable lastReported, a comma-delimited string of integers
    let lastBreakpointReport = ""
    //start arrow function definition: args are set and transaction, returnvalue is RangeSet<GutterMarker>
    const func = (_set: RangeSet<GutterMarker>, _transaction: Transaction): RangeSet<GutterMarker> => {
      let _resultRange = _set.map(_transaction.changes)
      for (const _effect of _transaction.effects) {
        // *   if the effect is TOGGLE, update the results with correct position
        if (_effect.is(toggle)) {
          _resultRange = this._updatePosition(_resultRange, marker, _effect.value)
        }
      }
      // get lines from char offsets
      const _lines = this._translateOffsetsToNums(_resultRange, _transaction.newDoc)
      const _report = _lines.join(",")
      // if there's been a change, update the closure var and emit the callback:
      if (lastBreakpointReport != _report) {
        lastBreakpointReport = _report
        callback?.(_lines)
      }
      return _resultRange
    }
    return func
  }

  private _updatePosition(
    range: RangeSet<GutterMarker>,
    marker: GutterMarker,
    position: number
  ): RangeSet<GutterMarker> {
    // *     find the position
    let posFound = false
    range.between(position, position, () => { posFound = true; return false })
    if (posFound) {
      //remove it
      return range.update({ filter: (from) => from !== position })
    }
    //add it
    return range.update({ add: [marker.range(position)] })
  }

  private _translateOffsetsToNums(range: RangeSet<GutterMarker>, newDoc: Text): number[] {
    const result: number[] = []
    range.between(0, newDoc.length, (from) => {
      result.push(newDoc.lineAt(from).number)
    })
    return result
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

class BreakpointMarker extends GutterMarker {
  private _className: string
  private _breakpointChar: string
  private _elementType: string
  constructor(elementType: string, className: string, breakpointChar: string) {
    super()
    this._elementType = elementType
    this._className = className
    this._breakpointChar = breakpointChar
  }
  toDOM(): HTMLElement {
    const el = document.createElement(this._elementType)
    el.className = this._className
    el.textContent = this._breakpointChar
    return el
  }
}
