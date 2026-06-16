import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { CodeMirrorOutputPanel } from "../../../app/javascript/ide/code_mirror_output_panel"

describe("CodeMirrorOutputPanel", () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement("div")
    const body = document.createElement("div")
    body.className = "output-body"
    container.appendChild(body)
    document.body.appendChild(container)
  })

  afterEach(() => {
    document.body.removeChild(container)
  })

  describe("mounts CodeMirror", () => {
    it("creates a .cm-editor inside the container", () => {
      new CodeMirrorOutputPanel(container)

      expect(container.querySelector(".cm-editor")).not.toBeNull()
    })
  })

  describe("constructor", () => {
    it("hides the container on construction", () => {
      new CodeMirrorOutputPanel(container)

      expect(container.hidden).toBe(true)
    })
  })

  describe("setValue()", () => {
    it("sets the editor content", () => {
      const panel = new CodeMirrorOutputPanel(container)

      panel.setValue("output text")

      expect(container.querySelector(".cm-content")?.textContent).toContain("output text")
    })

    it("shows the container when text is non-empty", () => {
      const panel = new CodeMirrorOutputPanel(container)

      panel.setValue("some output")

      expect(container.hidden).toBe(false)
    })

    it("hides the container when text is empty", () => {
      const panel = new CodeMirrorOutputPanel(container)
      panel.setValue("some output")

      panel.setValue("")

      expect(container.hidden).toBe(true)
    })

    it("replaces previous content", () => {
      const panel = new CodeMirrorOutputPanel(container)
      panel.setValue("first")

      panel.setValue("second")

      const cmContent = container.querySelector(".cm-content")
      expect(cmContent?.textContent).not.toContain("first")
      expect(cmContent?.textContent).toContain("second")
    })
  })

  describe("clear()", () => {
    it("empties the editor content", () => {
      const panel = new CodeMirrorOutputPanel(container)
      panel.setValue("some output")

      panel.clear()

      expect(container.querySelector(".cm-content").textContent.trim()).toBe("")
    })

    it("hides the container", () => {
      const panel = new CodeMirrorOutputPanel(container)
      panel.setValue("some output")

      panel.clear()

      expect(container.hidden).toBe(true)
    })
  })

  describe("hide()", () => {
    it("sets container.hidden to true", () => {
      const panel = new CodeMirrorOutputPanel(container)
      panel.setValue("text")

      panel.hide()

      expect(container.hidden).toBe(true)
    })
  })

  describe("show()", () => {
    it("sets container.hidden to false", () => {
      const panel = new CodeMirrorOutputPanel(container)

      panel.show()

      expect(container.hidden).toBe(false)
    })
  })
})
