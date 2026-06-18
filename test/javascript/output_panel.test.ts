import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { OutputPanel } from '../../app/javascript/ide/output_panel'

function makeContainer(): HTMLElement {
  const container = document.createElement("div")
  const body = document.createElement("div")
  body.classList.add("output-body")
  container.appendChild(body)
  document.body.appendChild(container)
  return container
}

describe("OutputPanel", () => {
  let container: HTMLElement

  beforeEach(() => {
    container = makeContainer()
  })

  afterEach(() => {
    document.body.removeChild(container)
  })

  it("outputPanel creates with no text content", () => {
    const panel = new OutputPanel(container)
    expect(panel.getValue()).toBe("")
  })

  it("setValue sets the value", () => {
    const panel = new OutputPanel(container)
    panel.setValue("hello world")
    expect(panel.getValue()).toBe("hello world")
  })

  it("setValue overwrites an existing value", () => {
    const panel = new OutputPanel(container)
    panel.setValue("old text")
    panel.setValue("new text")
    expect(panel.getValue()).toBe("new text")
  })

  it("setValue accepts an empty string", () => {
    const panel = new OutputPanel(container)
    panel.setValue("some text")
    panel.setValue("")
    expect(panel.getValue()).toBe("")
  })

  it("setValue with text shows the panel", () => {
    const panel = new OutputPanel(container)
    panel.setValue("hello world")
    expect(container.hidden).toEqual(false)
  })

  it("setValue with empty string hides the panel", () => {
    const panel = new OutputPanel(container)
    panel.show()
    panel.setValue("")
    expect(container.hidden).toEqual(true)
  })

  it("clear removes text", () => {
    const panel = new OutputPanel(container)
    panel.setValue("Some output")
    panel.clear()
    expect(panel.getValue()).toBe("")
  })

  it("clear hides the panel", () => {
    const panel = new OutputPanel(container)
    panel.setValue("Some output")
    panel.clear()
    expect(container.hidden).toEqual(true)
  })

  it("constructor hides the output panel", () => {
    container.hidden = false
    new OutputPanel(container)
    expect(container.hidden).toEqual(true)
  })

  it("hide hides the output panel", () => {
    container.hidden = false
    const panel = new OutputPanel(container)
    panel.hide()
    expect(container.hidden).toEqual(true)
  })

  it("show reveals a hidden output panel", () => {
    const panel = new OutputPanel(container)
    panel.show()
    expect(container.hidden).toEqual(false)
  })
})
