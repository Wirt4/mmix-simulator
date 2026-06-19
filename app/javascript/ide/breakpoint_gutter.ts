import { Extension, RangeSet, StateEffect, StateField } from "@codemirror/state"
import { EditorView, GutterMarker, gutter } from "@codemirror/view"

class BreakpointMarker extends GutterMarker {
  toDOM(): HTMLElement {
    const el = document.createElement("span")
    el.className = "cm-breakpoint-marker"
    el.textContent = "●"
    return el
  }
}

export type BreakpointChangeListener = (count: number) => void

class BreakpointGutter {
  private readonly _marker = new BreakpointMarker()
  private readonly _toggleEffect =
    StateEffect.define<{ pos: number; on: boolean }>()
  private readonly _state: StateField<RangeSet<GutterMarker>>
  private readonly _onChange?: BreakpointChangeListener
  private _lastCount = 0

  constructor(onChange?: BreakpointChangeListener) {
    this._onChange = onChange
    this._state = StateField.define<RangeSet<GutterMarker>>({
      create: () => RangeSet.empty,
      update: (set, transaction) => {
        let next = set.map(transaction.changes)
        for (const effect of transaction.effects) {
          if (effect.is(this._toggleEffect)) {
            next = effect.value.on
              ? next.update({ add: [this._marker.range(effect.value.pos)] })
              : next.update({ filter: (from) => from !== effect.value.pos })
          }
        }
        this._notifyIfChanged(next)
        return next
      },
    })
  }

  get extension(): Extension {
    return [
      this._state,
      gutter({
        class: "cm-breakpoint-gutter",
        markers: (view) => view.state.field(this._state),
        initialSpacer: () => this._marker,
        domEventHandlers: {
          mousedown: (view, line) => {
            view.dispatch({
              effects: this._toggleEffect.of({
                pos: line.from,
                on: !this._hasBreakpointAt(view, line.from),
              }),
            })
            return true
          },
        },
      }),
    ]
  }

  private _hasBreakpointAt(view: EditorView, pos: number): boolean {
    let found = false
    view.state.field(this._state).between(pos, pos, () => {
      found = true
      return false
    })
    return found
  }

  private _notifyIfChanged(set: RangeSet<GutterMarker>): void {
    let count = 0
    set.between(0, Number.MAX_SAFE_INTEGER, () => { count++ })
    if (count === this._lastCount) return
    this._lastCount = count
    this._onChange?.(count)
  }
}

export function breakpointGutter(onChange?: BreakpointChangeListener): Extension {
  return new BreakpointGutter(onChange).extension
}
