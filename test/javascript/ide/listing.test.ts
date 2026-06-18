import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { Listing } from "../../../app/javascript/ide/listing"

describe("Listing", () => {
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
      new Listing(container, btn, panel)

      expect(container.querySelector(".cm-editor")).not.toBeNull()
    })
  })

  describe("setContents()", () => {
    it("sets the editor content", () => {
      const listing = new Listing(container, btn, panel)

      listing.setContents("hello world")

      expect(listing.getContents()).toEqual("hello world")
    })

    it("replaces previous content", () => {
      const listing = new Listing(container, btn, panel)
      listing.setContents("first")

      listing.setContents("second")

      expect(listing.getContents()).toEqual("second")
    })
  })

  describe("default()", () => {
    it("initializes with the panel collapsed and button disabled", () => {
      new Listing(container, btn, panel)

      expect(panel.classList.contains("listing-panel--collapsed")).toBe(true)
      expect(btn.disabled).toBe(true)
    })

    it("collapses the panel and disables the button when called explicitly", () => {
      const listing = new Listing(container, btn, panel)
      listing.toggle()
      btn.disabled = false

      listing.default()

      expect(panel.classList.contains("listing-panel--collapsed")).toBe(true)
      expect(btn.disabled).toBe(true)
    })
  })

  describe("toggle()", () => {
    it("opens a collapsed panel", () => {
      const listing = new Listing(container, btn, panel)

      listing.toggle()

      expect(listing.isOpen).toBe(true)
    })

    it("collapses an open panel", () => {
      const listing = new Listing(container, btn, panel)
      listing.toggle()

      listing.toggle()

      expect(listing.isOpen).toBe(false)
    })
  })

  describe("unlock()", () => {
    it("enables the toggle button", () => {
      const listing = new Listing(container, btn, panel)

      listing.unlock()

      expect(btn.disabled).toBe(false)
    })
  })

  describe("isOpen", () => {
    it("returns false by default", () => {
      const listing = new Listing(container, btn, panel)

      expect(listing.isOpen).toBe(false)
    })

    it("returns true after toggle", () => {
      const listing = new Listing(container, btn, panel)

      listing.toggle()

      expect(listing.isOpen).toBe(true)
    })
  })
})
