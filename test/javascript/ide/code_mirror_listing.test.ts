import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { CodeMirrorListing } from "../../../app/javascript/ide/code_mirror_listing"

describe("CodeMirrorListing", () => {
  let container: HTMLElement
  let btn: HTMLButtonElement
  let panel: HTMLElement

  beforeEach(() => {
    container = document.createElement("div")
    btn = document.createElement("button")
    panel = document.createElement("div")
    document.body.appendChild(container)
  })

  afterEach(() => {
    document.body.removeChild(container)
  })

  describe("mounts CodeMirror", () => {
    it("creates a .cm-editor inside the container", () => {
      new CodeMirrorListing(container, btn, panel)

      expect(container.querySelector(".cm-editor")).not.toBeNull()
    })
  })

  describe("setContents()", () => {
    it("sets the editor content", () => {
      const listing = new CodeMirrorListing(container, btn, panel)

      listing.setContents("hello world")

      expect(listing.getContents()).toEqual("hello world")
    })

    it("replaces previous content", () => {
      const listing = new CodeMirrorListing(container, btn, panel)
      listing.setContents("first")

      listing.setContents("second")

      expect(listing.getContents()).toEqual("second")
    })
  })

  describe("size", () => {
    it("returns 1 for empty content", () => {
      const listing = new CodeMirrorListing(container, btn, panel)
      listing.setContents("")

      expect(listing.size).toEqual(1)
    })

    it("returns 2 for two-line content", () => {
      const listing = new CodeMirrorListing(container, btn, panel)
      listing.setContents("one line\nsecond line")

      expect(listing.size).toEqual(2)
    })

    it("returns 22 for an assembled listing with trailing newline", () => {
      const listing = new CodeMirrorListing(container, btn, panel)
      const contents = "                           LOC   #100                   % Set the address of the program\n                                                        % initially to 0x100.\n                   \n ...100: f4ffxxxx  Main    GETA  $255,string            % Put the address of the string\n                                                        % into register 255.\n                   \n ...104: 00000701          TRAP  0,Fputs,StdOut         % Write the string pointed to by\n                                                        % register 255 to the standard\n                                                        % output file.\n                   \n ...108: 00000000          TRAP  0,Halt,0               % End process.\n                   \n ...10c: 48656c6c  string  BYTE  \"Hello, Mary!\",#a,0   % String to be printed.  #a is\n ...110: 6f2c204d\n ...114: 61727921\n ...118: 0a00    \n                                                        % newline, 0 terminates the\n                                                        % string.\n\nSymbol table:\n Main = #0000000000000100 (1)\n string = #000000000000010c (2)\n"

      listing.setContents(contents)

      expect(listing.size).toEqual(22)
    })
  })

  describe("default()", () => {
    it("initializes with the panel collapsed and button disabled", () => {
      new CodeMirrorListing(container, btn, panel)

      expect(panel.classList.contains("listing-panel--collapsed")).toBe(true)
      expect(btn.disabled).toBe(true)
    })

    it("collapses the panel and disables the button when called explicitly", () => {
      const listing = new CodeMirrorListing(container, btn, panel)
      listing.toggle()
      btn.disabled = false

      listing.default()

      expect(panel.classList.contains("listing-panel--collapsed")).toBe(true)
      expect(btn.disabled).toBe(true)
    })
  })

  describe("toggle()", () => {
    it("opens a collapsed panel", () => {
      const listing = new CodeMirrorListing(container, btn, panel)

      listing.toggle()

      expect(listing.isOpen).toBe(true)
    })

    it("collapses an open panel", () => {
      const listing = new CodeMirrorListing(container, btn, panel)
      listing.toggle()

      listing.toggle()

      expect(listing.isOpen).toBe(false)
    })
  })

  describe("unlock()", () => {
    it("enables the toggle button", () => {
      const listing = new CodeMirrorListing(container, btn, panel)

      listing.unlock()

      expect(btn.disabled).toBe(false)
    })
  })

  describe("isOpen", () => {
    it("returns false by default", () => {
      const listing = new CodeMirrorListing(container, btn, panel)

      expect(listing.isOpen).toBe(false)
    })

    it("returns true after toggle", () => {
      const listing = new CodeMirrorListing(container, btn, panel)

      listing.toggle()

      expect(listing.isOpen).toBe(true)
    })
  })
})
