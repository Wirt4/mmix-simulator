import { describe, it, expect, beforeEach } from "vitest"
import Editor from "../../app/javascript/editor"

function createTextarea(value = "") {
  const textarea = document.createElement("textarea")
  textarea.value = value
  return textarea
}

function createLineNumbers() {
  return document.createElement("div")
}

describe("Editor", () => {
  let textarea, lineNumbers, editor

  beforeEach(() => {
    textarea = createTextarea()
    lineNumbers = createLineNumbers()
    editor = new Editor(textarea, lineNumbers)
  })

  describe("updateLineNumbers", () => {
    it("renders line numbers for a single line", () => {
      textarea.value = "hello"
      editor.updateLineNumbers()

      expect(lineNumbers.innerHTML).toBe("<span>1</span>")
    })
    it("renders line numbers for multiple lines", () => {
      textarea.value = "line1\n\nline3"
      editor.updateLineNumbers()

      const spans = lineNumbers.querySelectorAll("span")
      expect(spans.length).toBe(3)
      expect(spans[0].textContent).toBe("1")
      expect(spans[1].textContent).toBe("2")
      expect(spans[2].textContent).toBe("3")
    })
  })

  describe("syncScroll", () => {
    it("syncs line numbers scrollTop with textarea scrollTop", () => {
      Object.defineProperty(textarea, "scrollTop", { value: 42, writable: true })
      editor.syncScroll()

      expect(lineNumbers.scrollTop).toBe(42)
    })
    it("syncs line numbers scrollTop with textarea scrollTop, diffeent data", () => {
      Object.defineProperty(textarea, "scrollTop", { value: 77, writable: true })
      editor.syncScroll()

      expect(lineNumbers.scrollTop).toBe(77)
    })

  })

  describe("handleKeydown", () => {
    it("inserts two spaces on Tab press", () => {
      textarea.value = "hello"
      textarea.selectionStart = 2
      textarea.selectionEnd = 2

      const tabEvent = new KeyboardEvent("keydown", { key: "Tab", cancelable: true })
      editor.handleKeydown(tabEvent)

      expect(textarea.value).toBe("he  llo")
    })
    it("inserts two spaces on Tab press", () => {
      textarea.value = "godzilla"
      textarea.selectionStart = 2
      textarea.selectionEnd = 2

      const tabEvent = new KeyboardEvent("keydown", { key: "Tab", cancelable: true })
      editor.handleKeydown(tabEvent)

      expect(textarea.value).toBe("go  dzilla")
    })

    /*
    it("inserts two spaces on Tab press and maintains space selection", () => {
      textarea.value = "hello"
      textarea.selectionStart = 2
      textarea.selectionEnd = 2

      const tabEvent = new KeyboardEvent("keydown", { key: "Tab", cancelable: true })
      editor.handleKeydown(tabEvent)

          expect(textarea.selectionStart).toBe(4)
      expect(textarea.selectionEnd).toBe(4)
    })

    /*
        it("prevents default on Tab press", () => {
          textarea.value = "hello"
          textarea.selectionStart = 0
          textarea.selectionEnd = 0
    
          const tabEvent = new KeyboardEvent("keydown", { key: "Tab", cancelable: true })
          editor.handleKeydown(tabEvent)
    
          expect(tabEvent.defaultPrevented).toBe(true)
        })
    
        it("replaces selected text with two spaces on Tab", () => {
          textarea.value = "hello"
          textarea.selectionStart = 1
          textarea.selectionEnd = 4
    
          const tabEvent = new KeyboardEvent("keydown", { key: "Tab", cancelable: true })
          editor.handleKeydown(tabEvent)
    
          expect(textarea.value).toBe("h  o")
        })
    
        it("updates line numbers after Tab insertion", () => {
          textarea.value = "hello"
          textarea.selectionStart = 5
          textarea.selectionEnd = 5
    
          const tabEvent = new KeyboardEvent("keydown", { key: "Tab", cancelable: true })
          editor.handleKeydown(tabEvent)
    
          expect(lineNumbers.innerHTML).toBe("<span>1</span>")
        })
    
        it("does nothing for non-Tab keys", () => {
          textarea.value = "hello"
    
          const enterEvent = new KeyboardEvent("keydown", { key: "Enter", cancelable: true })
          editor.handleKeydown(enterEvent)
    
          expect(textarea.value).toBe("hello")
          expect(enterEvent.defaultPrevented).toBe(false)
        })
        */
  })
})
