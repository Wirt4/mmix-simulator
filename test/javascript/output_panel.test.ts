import { describe, it, expect } from 'vitest'
import OutputPanel from '../../app/javascript/ide/output_panel'

function makeContainer(initial = ""): { container: HTMLElement; textarea: HTMLTextAreaElement } {
  const container = document.createElement("div")
  const textarea = document.createElement("textarea")
  textarea.value = initial
  container.appendChild(textarea)
  return { container, textarea }
}

describe("OutputPanel", () => {
  it("outputPanel creates with no text content", () => {
    const { container, textarea } = makeContainer("stale output")
    new OutputPanel(container)
    expect(textarea.value).toBe("")
  })
  it("setValue sets the textarea value", () => {
    const { container, textarea } = makeContainer()
    const panel = new OutputPanel(container)
    panel.setValue("hello world")
    expect(textarea.value).toBe("hello world")
  })

  it("setValue overwrites an existing value", () => {
    const { container, textarea } = makeContainer("old text")
    const panel = new OutputPanel(container)
    panel.setValue("new text")
    expect(textarea.value).toBe("new text")
  })

  it("setValue accepts an empty string", () => {
    const { container, textarea } = makeContainer("some text")
    const panel = new OutputPanel(container)
    panel.setValue("")
    expect(textarea.value).toBe("")
  })

  it("setValue with text shows the panel", () => {
    const { container } = makeContainer()
    const panel = new OutputPanel(container)
    panel.setValue("hello world")
    expect(container.hidden).toEqual(false)
  })

  it("setValue with empty string hides the panel", () => {
    const { container } = makeContainer()
    const panel = new OutputPanel(container)
    panel.show()
    panel.setValue("")
    expect(container.hidden).toEqual(true)
  })

  it("clear removes text from element", () => {
    const { container, textarea } = makeContainer()
    const panel = new OutputPanel(container)
    panel.setValue("Some output")
    panel.clear()
    expect(textarea.value).toBe("")
  })

  it("clear hides the panel", () => {
    const { container } = makeContainer()
    const panel = new OutputPanel(container)
    panel.setValue("Some output")
    panel.clear()
    expect(container.hidden).toEqual(true)
  })

  it("constructor hides the output panel", () => {
    const { container } = makeContainer()
    container.hidden = false
    new OutputPanel(container)

    expect(container.hidden).toEqual(true)
  })

  it("hide hides the output panel", () => {
    const { container } = makeContainer()
    container.hidden = false
    const panel = new OutputPanel(container)

    panel.hide()

    expect(container.hidden).toEqual(true)
  })

  it("show reveals a hidden output panel", () => {
    const { container } = makeContainer()
    const panel = new OutputPanel(container)

    panel.show()

    expect(container.hidden).toEqual(false)
  })
})
