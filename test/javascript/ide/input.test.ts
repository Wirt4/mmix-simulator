import { describe, expect, it } from "vitest"
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
})


describe("size", () => {
  it("size is the number of lines in the content", () => {
    const expected = 0
    const textarea = createElement("")
    const input = new Input(textarea)

    const actual = input.size

    expect(actual).toEqual(expected)
  })
  it("size is the number of lines in the content", () => {
    const src = "        LOC   #100                   % a newline char: \\n\n                                     % initially to 0x100.\n\nMain    GETA  $255,string            % Put the address of the string\n                                     % into register 255.\n\n        TRAP  0,Fputs,StdOut         % Write the string pointed to by\n                                     % register 255 to the standard\n                                     % output file.\n\n        TRAP  0,Halt,0               % End process.\n\nstring  BYTE  \"Hello, Mary!\",#a,0   % String to be printed.  #a is\n                                     % newline, 0 terminates the\n                                     % string."
    const expected = 13
    const textarea = createElement(src)
    const input = new Input(textarea)

    const actual = input.size

    expect(actual).toEqual(expected)
  })
})
