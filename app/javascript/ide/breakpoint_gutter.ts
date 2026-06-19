import { Extension, RangeSet, StateEffect, StateField } from "@codemirror/state"
import { GutterMarker, gutter } from "@codemirror/view"

class BreakpointMarker extends GutterMarker {
  toDOM(): HTMLElement {
    const el = document.createElement("span")
    el.className = "cm-breakpoint-marker"
    el.textContent = "●"
    return el
  }
}

export function breakpointGutter(onChange?: (hasBreakpoints: boolean) => void): Extension {
  const marker = new BreakpointMarker()
  const toggle = StateEffect.define<number>()
  let lastHas = false

  const field = StateField.define<RangeSet<GutterMarker>>({
    create: () => RangeSet.empty,
    update: (set, tr) => {
      let next = set.map(tr.changes)
      for (const effect of tr.effects) {
        if (!effect.is(toggle)) continue
        const pos = effect.value
        let has = false
        next.between(pos, pos, () => { has = true; return false })
        next = has
          ? next.update({ filter: (from) => from !== pos })
          : next.update({ add: [marker.range(pos)] })
      }
      const hasAny = next.size > 0
      if (hasAny !== lastHas) {
        lastHas = hasAny
        onChange?.(hasAny)
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
