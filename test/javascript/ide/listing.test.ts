import { describe, it, expect, beforeEach } from "vitest"
import { Listing } from "../../../app/javascript/ide/listing"

describe("Listing SetContents()", () => {
  it("setContents overwrites the div's content", () => {
    const div = document.createElement("div")
    const listing = new Listing(div, document.createElement("button"), document.createElement("div"))
    const expected = "hello world"

    listing.setContents(expected)

    expect(div.textContent).toEqual(expected)
  })
})

describe("Lisitng size", () => {
  let listing: Listing
  beforeEach(() => {
    const div = document.createElement("div")
    const btn = document.createElement("button")
    const panel = document.createElement("div")
    listing = new Listing(div, btn, panel)
  })
  it("if string is empty, then has size one", () => {
    listing.setContents("")

    expect(listing.size).toEqual(1)
  })
  it("if string is empty, then has size one", () => {
    listing.setContents("one line\nsecond line")

    expect(listing.size).toEqual(2)
  })
  it("assembled code example: has size 22", () => {
    const contents = "                           LOC   #100                   % Set the address of the program\n                                                        % initially to 0x100.\n                   \n ...100: f4ffxxxx  Main    GETA  $255,string            % Put the address of the string\n                                                        % into register 255.\n                   \n ...104: 00000701          TRAP  0,Fputs,StdOut         % Write the string pointed to by\n                                                        % register 255 to the standard\n                                                        % output file.\n                   \n ...108: 00000000          TRAP  0,Halt,0               % End process.\n                   \n ...10c: 48656c6c  string  BYTE  \"Hello, Mary!\",#a,0   % String to be printed.  #a is\n ...110: 6f2c204d\n ...114: 61727921\n ...118: 0a00    \n                                                        % newline, 0 terminates the\n                                                        % string.\n\nSymbol table:\n Main = #0000000000000100 (1)\n string = #000000000000010c (2)\n"
    const expected = 22
    listing.setContents(contents)

    expect(listing.size).toEqual(expected)
  })
})

describe("default() tests", () => {
  let content: HTMLElement
  let btn: HTMLButtonElement
  let panel: HTMLElement
  beforeEach(() => {
    content = document.createElement("div")
    btn = document.createElement("button")
    panel = document.createElement("div")
  })
  it("the default setting of the div is to be closed", () => {
    const listing = new Listing(content, btn, panel)

    listing.default()

    expect(panel.classList.contains("listing-panel--collapsed")).toBe(true)
  })
  it("listing intiates with default state set", () => {
    new Listing(content, btn, panel)

    expect(panel.classList.contains("listing-panel--collapsed")).toBe(true)
  })
  it("the default setting has the toggle affordance disabled", () => {
    new Listing(content, btn, panel)

    expect(btn.disabled).toEqual(true)
  })
  it("toggle removes listing-panel--collapsed if present", () => {
    const listing = new Listing(content, btn, panel)
    expect(listing.isOpen).toBe(false)
    expect(panel.classList.contains("listing-panel--collapsed")).toBe(true)
    listing.toggle()
    expect(listing.isOpen).toBe(true)
    expect(panel.classList.contains("listing-panel--collapsed")).toBe(false)
    listing.toggle()
    expect(panel.classList.contains("listing-panel--collapsed")).toBe(true)
  })
})

describe("unlock", () => {
  it("unlock enables the button", () => {
    const btn = document.createElement("button")
    const listing = new Listing(document.createElement("div"), btn, document.createElement("panel"))

    listing.unlock()

    expect(btn.disabled).toEqual(false)
  })
})
