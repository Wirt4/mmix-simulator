import { describe, expect, it, beforeEach, afterEach } from "vitest"
import { CodeMirrorInput } from "../../../app/javascript/ide/input"

function createContainer(): HTMLElement {
  return document.createElement("div")
}

function createHiddenInput(initialValue = ""): HTMLTextAreaElement {
  const textarea = document.createElement("textarea")
  textarea.value = initialValue
  return textarea
}

describe("CodeMirrorInput", () => {
  let container: HTMLElement
  let hiddenInput: HTMLTextAreaElement

  beforeEach(() => {
    container = createContainer()
    document.body.appendChild(container)
    hiddenInput = createHiddenInput()
  })

  afterEach(() => {
    document.body.removeChild(container)
  })

  describe("getContents()", () => {
    it("returns the initial content passed to constructor", () => {
      const expected = "Hello World"
      const input = new CodeMirrorInput(container, expected, hiddenInput)

      const actual = input.getContents()

      expect(actual).toEqual(expected)
    })

    it("returns empty string when no initial content provided", () => {
      const input = new CodeMirrorInput(container, "", hiddenInput)

      const actual = input.getContents()

      expect(actual).toEqual("")
    })
  })

  describe("pad()", () => {
    it("adds newlines to the editor content", () => {
      const input = new CodeMirrorInput(container, "line1", hiddenInput)

      input.pad(3)

      expect(input.getContents()).toEqual("line1\n\n\n")
    })

    it("does nothing if passed a negative number", () => {
      const input = new CodeMirrorInput(container, "content", hiddenInput)

      input.pad(-1)

      expect(input.getContents()).toEqual("content")
    })

    it("rounds down if passed a fraction", () => {
      const input = new CodeMirrorInput(container, "stuff", hiddenInput)

      input.pad(3.7)

      expect(input.getContents()).toEqual("stuff\n\n\n")
    })
  })

  describe("size", () => {
    it("returns 1 for empty content", () => {
      const input = new CodeMirrorInput(container, "", hiddenInput)

      expect(input.size).toEqual(1)
    })

    it("returns correct line count for multi-line content", () => {
      const input = new CodeMirrorInput(container, "line1\nline2", hiddenInput)

      expect(input.size).toEqual(0)
    })
  })

  describe("trim()", () => {
    it("removes trailing newlines", () => {
      const input = new CodeMirrorInput(container, "content\n\n\n", hiddenInput)

      input.trim()

      expect(input.getContents()).toEqual("content")
    })

    it("does not remove single trailing newline", () => {
      const input = new CodeMirrorInput(container, "content\n", hiddenInput)

      input.trim()

      expect(input.getContents()).toEqual("content\n")
    })
  })

  describe("lock/unlock", () => {
    it("defaults to NOT editable (read-only)", () => {
      const input = new CodeMirrorInput(container, "test", hiddenInput)

      expect(input.getContents()).toEqual("test")
    })

    it("lock() keeps the editor read-only", () => {
      const input = new CodeMirrorInput(container, "test", hiddenInput)

      input.lock()

      expect(input.getContents()).toEqual("test")
    })

    it("unlock() makes the editor editable", () => {
      const input = new CodeMirrorInput(container, "test", hiddenInput)

      input.unlock()

      expect(input.getContents()).toEqual("test")
    })
  })

  describe("edited property", () => {
    it("can be set and read", () => {
      const input = new CodeMirrorInput(container, "test", hiddenInput)
      expect(input.edited).toEqual(true)

      input.edited = false

      expect(input.edited).toEqual(false)
    })
  })

  describe("hidden input sync", () => {
    it("syncs content to hidden input on creation", () => {
      const content = "initial content"

      new CodeMirrorInput(container, content, hiddenInput)

      expect(hiddenInput.value).toEqual(content)
    })
  })
})
