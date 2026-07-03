import { Extension, RangeSet, StateEffect, StateField } from "@codemirror/state"
import { GutterMarker, gutter } from "@codemirror/view"

function hasMarkerAt(set: RangeSet<GutterMarker>, pos: number): boolean {
  let found = false
  set.between(pos, pos, () => { found = true; return false })
  return found
}

class BreakpointMarker extends GutterMarker {
  toDOM(): HTMLElement {
    const el = document.createElement("span")
    el.className = "cm-breakpoint-marker"
    el.textContent = "●"
    return el
  }
}

export function breakpointGutter(onChange?: (lines: number[]) => void): Extension {
  const marker = new BreakpointMarker()
  const toggle = StateEffect.define<number>()
  let lastReported = ""

  const field = StateField.define<RangeSet<GutterMarker>>({
    create: () => RangeSet.empty,
    update: (set, tr) => {
      let next = set.map(tr.changes)
      for (const effect of tr.effects) {
        if (!effect.is(toggle)) continue
        const pos = effect.value
        next = hasMarkerAt(next, pos)
          ? next.update({ filter: (from) => from !== pos })
          : next.update({ add: [marker.range(pos)] })
      }
      const lines: number[] = []
      next.between(0, tr.newDoc.length, (from) => {
        lines.push(tr.newDoc.lineAt(from).number)
      })
      const reported = lines.join(",")
      if (reported !== lastReported) {
        lastReported = reported
        onChange?.(lines)
      }
      return next
    },
  })

  return [
    field,
    gutter({
      class: "cm-breakpoint-gutter",
      markers: (view) => view.state.field(field),
      initialSpacer: () => marker,
      domEventHandlers: {
        mousedown: (view, line) => {
          view.dispatch({ effects: toggle.of(line.from) })
          return true
        },
      },
    }),
  ]
}
