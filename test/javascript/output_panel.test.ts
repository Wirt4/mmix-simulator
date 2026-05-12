import { describe, it, expect } from 'vitest'
import OutputPanel from '../../app/javascript/ide/output_panel'

function makeTextarea(initial = ""): HTMLTextAreaElement {
  const el = document.createElement("textarea")
  el.value = initial
  return el
}

describe("OutputPanel", () => {
  it("setValue sets the textarea value", () => {
    const el = makeTextarea()
    const panel = new OutputPanel(el)
    panel.setValue("hello world")
    expect(el.value).toBe("hello world")
  })

  it("setValue overwrites an existing value", () => {
    const el = makeTextarea("old text")
    const panel = new OutputPanel(el)
    panel.setValue("new text")
    expect(el.value).toBe("new text")
  })

  it("setValue accepts an empty string", () => {
    const el = makeTextarea("some text")
    const panel = new OutputPanel(el)
    panel.setValue("")
    expect(el.value).toBe("")
  })
})
