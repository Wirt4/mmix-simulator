import { describe, expect, it, vi } from "vitest"
import { Input } from "../../../app/javascript/ide/input"

function createElement(contents: string): HTMLTextAreaElement {
  const textarea = document.createElement("textarea")
  textarea.value = contents
  return textarea
}

describe("input TS component", () => {
  it("getContents returns the text that has been entered in the text field: data set A", () => {
    const expected = "Hello World"
    const textarea = createElement(expected)
    const input = new Input(textarea)

    const actual = input.getContents()

    expect(actual).toEqual(expected)
  })
  it("getContents returns the text that has been entered in the text field: data set B", () => {
    const expected = "Greetings Program"
    const textarea = createElement(expected)
    const input = new Input(textarea)

    const actual = input.getContents()

    expect(actual).toEqual(expected)
  })
})

describe("pad()", () => {
  it("pad will amend a number of empty lines depending on the input", () => {
    const expected = "Excelsior!\n\n\n"
    const textarea = createElement("Excelsior!")
    const input = new Input(textarea)

    input.pad(3)

    expect(input.getContents()).toEqual(expected)
  })
  it("pad() will do nothing if passed a negative number", () => {
    const expected = "foo"
    const textarea = createElement(expected)
    const input = new Input(textarea)

    input.pad(-1)

    expect(input.getContents()).toEqual(expected)
  })
  it("pad() rounds down if passed a fraction", () => {
    const expected = "stuff\n\n\n\n\n\n\n\n"
    const textarea = createElement("stuff")
    const input = new Input(textarea)

    input.pad(8.5)

    expect(input.getContents()).toEqual(expected)
  })
  it("pad() emits an input event", () => {
    const spy = vi.fn()
    const textarea = createElement("stuff")
    textarea.addEventListener("input", spy)
    const input = new Input(textarea)

    input.pad(2)

    expect(spy).toHaveBeenCalled()
  })
})


describe("size", () => {
  it("an empty string is size 1, since it will next to line number 1", () => {
    const expected = 1
    const textarea = createElement("")
    const input = new Input(textarea)

    const actual = input.size

    expect(actual).toEqual(expected)
  })
  it("size is the number of lines in the content", () => {
    const expected = 0
    const textarea = createElement("this is the first line\nthis is the second line")
    const input = new Input(textarea)

    const actual = input.size

    expect(actual).toEqual(expected)
  })
  it("size is the number of lines in the content with tricky user esecape char", () => {
    const src = "        LOC   #100                   % a newline char: \\n\n                                     % initially to 0x100.\n\nMain    GETA  $255,string            % Put the address of the string\n                                     % into register 255.\n\n        TRAP  0,Fputs,StdOut         % Write the string pointed to by\n                                     % register 255 to the standard\n                                     % output file.\n\n        TRAP  0,Halt,0               % End process.\n\nstring  BYTE  \"Hello, Mary!\",#a,0   % String to be printed.  #a is\n                                     % newline, 0 terminates the\n                                     % string."
    const expected = 13
    const textarea = createElement(src)
    const input = new Input(textarea)

    const actual = input.size

    expect(actual).toEqual(expected)
  })
})

describe("trim()", () => {
  it("trim removes trailing \n chars", () => {
    const expected = "nuff said"
    const textarea = createElement("nuff said\n\n\n\n\n")
    const input = new Input(textarea)

    input.trim()

    expect(input.getContents()).toEqual(expected)
  })
  it("trim emits an input event", () => {
    const spy = vi.fn()
    const textarea = createElement("hello\n\n\n")
    textarea.addEventListener("input", spy)
    const input = new Input(textarea)

    input.trim()

    expect(spy).toHaveBeenCalled()
  })
  it("if cursor is midtext, trim does not change its position", () => {
    const textarea = createElement("hello\n\n")
    textarea.selectionStart = 2
    textarea.selectionEnd = 2
    const input = new Input(textarea)

    input.trim()

    expect(textarea.selectionStart).toBe(2)
    expect(textarea.selectionEnd).toBe(2)
  })
})

describe("lock tests", () => {
  it("input defaults to locked", () => {
    const textarea = createElement("foo")

    new Input(textarea)

    expect(textarea.disabled).toEqual(true)
  })
  it("unlock enables input's div", () => {
    const textarea = createElement("foo")
    const input = new Input(textarea)

    input.unlock()

    expect(textarea.disabled).toEqual(false)
  })
  it("lock disables input's div", () => {
    const textarea = createElement("foo")
    const input = new Input(textarea)
    input.unlock()

    input.lock()

    expect(textarea.disabled).toEqual(true)
  })
})
