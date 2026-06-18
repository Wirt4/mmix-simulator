import { describe, expect, it, beforeEach, afterEach } from "vitest"
import { Input } from "../../../app/javascript/ide/input"

function createContainer(): HTMLElement {
  return document.createElement("div")
}

function createHiddenInput(initialValue = ""): HTMLTextAreaElement {
  const textarea = document.createElement("textarea")
  textarea.value = initialValue
  return textarea
}

describe("Input", () => {
  let container: HTMLElement
  let contents: HTMLTextAreaElement

  beforeEach(() => {
    container = createContainer()
    document.body.appendChild(container)
    contents = createHiddenInput()
  })

  afterEach(() => {
    document.body.removeChild(container)
  })

  describe("getContents()", () => {
    it("returns the initial content passed to constructor", () => {
      const expected = "Hello World"
      contents.value = expected

      const input = new Input(container, contents)

      const actual = input.getContents()

      expect(actual).toEqual(expected)
    })

    it("returns empty string when no initial content provided", () => {
      contents.value = ""
      const input = new Input(container, contents)

      const actual = input.getContents()

      expect(actual).toEqual("")
    })
  })
})
