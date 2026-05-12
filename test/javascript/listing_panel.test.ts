import { describe, it, expect, vi } from 'vitest'
import ListingPanel from '../../app/javascript/ide/listing_panel'

function buildDOM() {
  const panel = document.createElement("div")
  panel.className = "editor-container"

  const listingEl = document.createElement("div")
  listingEl.className = "listing-content"

  const toggle = document.createElement("button")
  toggle.disabled = true

  const textarea = document.createElement("textarea")

  return { panel, listingEl, toggle, textarea }
}

function makePanel(overrides: Partial<ReturnType<typeof buildDOM>> = {}) {
  const dom = { ...buildDOM(), ...overrides }
  const lp = new ListingPanel(dom.panel, dom.listingEl, dom.toggle, dom.textarea)
  return { lp, ...dom }
}

describe("ListingPanel — collapse / expand", () => {
  it("starts not collapsed", () => {
    const { lp } = makePanel()
    expect(lp.isCollapsed).toBe(false)
  })

  it("collapse adds listing-panel--collapsed class", () => {
    const { lp, panel } = makePanel()
    lp.collapse()
    expect(panel.classList.contains("listing-panel--collapsed")).toBe(true)
  })

  it("collapse sets isCollapsed true", () => {
    const { lp } = makePanel()
    lp.collapse()
    expect(lp.isCollapsed).toBe(true)
  })

  it("collapse is idempotent", () => {
    const { lp, panel } = makePanel()
    lp.collapse()
    lp.collapse()
    expect(panel.classList.contains("listing-panel--collapsed")).toBe(true)
    expect(lp.isCollapsed).toBe(true)
  })

  it("expand removes listing-panel--collapsed class", () => {
    const { lp, panel } = makePanel()
    lp.collapse()
    lp.expand()
    expect(panel.classList.contains("listing-panel--collapsed")).toBe(false)
  })

  it("expand sets isCollapsed false", () => {
    const { lp } = makePanel()
    lp.collapse()
    lp.expand()
    expect(lp.isCollapsed).toBe(false)
  })

  it("expand is idempotent", () => {
    const { lp, panel } = makePanel()
    lp.collapse()
    lp.expand()
    lp.expand()
    expect(panel.classList.contains("listing-panel--collapsed")).toBe(false)
  })

  it("expand does nothing when not collapsed", () => {
    const { lp, panel } = makePanel()
    lp.expand()
    expect(panel.classList.contains("listing-panel--collapsed")).toBe(false)
  })
})

describe("ListingPanel — listing content", () => {
  it("setListing sets textContent on the listing element", () => {
    const { lp, listingEl } = makePanel()
    lp.setListing("001: line1\n002: line2\n")
    expect(listingEl.textContent).toBe("001: line1\n002: line2\n")
  })
})

describe("ListingPanel — source tracking", () => {
  it("getSource returns textarea value when no unpadded source set", () => {
    const { lp, textarea } = makePanel()
    textarea.value = "some code"
    expect(lp.getSource()).toBe("some code")
  })

  it("getSource returns unpaddedSource after setUnpaddedSource", () => {
    const { lp, textarea } = makePanel()
    textarea.value = "padded code\n\n"
    lp.setUnpaddedSource("unpadded code")
    expect(lp.getSource()).toBe("unpadded code")
  })
})

describe("ListingPanel — padding", () => {
  it("applyPadding adds newlines when listing has more lines than source", () => {
    const { lp, listingEl, textarea } = makePanel()
    textarea.value = "line1\nline2\n"
    lp.setUnpaddedSource("line1\nline2\n")
    listingEl.textContent = "001: line1\n002: line2\n003: line3\n"
    lp.applyPadding()
    expect(textarea.value).toBe("line1\nline2\n\n")
  })

  it("applyPadding does nothing when listing and source have equal line count", () => {
    const { lp, listingEl, textarea } = makePanel()
    textarea.value = "line1\nline2\n"
    lp.setUnpaddedSource("line1\nline2\n")
    listingEl.textContent = "001: line1\n002: line2\n"
    lp.applyPadding()
    expect(textarea.value).toBe("line1\nline2\n")
  })

  it("applyPadding does nothing when unpaddedSource is null", () => {
    const { lp, textarea } = makePanel()
    textarea.value = "line1\n"
    lp.applyPadding()
    expect(textarea.value).toBe("line1\n")
  })

  it("removePadding strips trailing newlines down to one", () => {
    const { lp, textarea } = makePanel()
    textarea.value = "code\n\n\n"
    lp.removePadding()
    expect(textarea.value).toBe("code\n")
  })

  it("removePadding does not change value with a single trailing newline", () => {
    const { lp, textarea } = makePanel()
    textarea.value = "code\n"
    lp.removePadding()
    expect(textarea.value).toBe("code\n")
  })

  it("removePaddingForSave strips trailing newlines", () => {
    const { lp, textarea } = makePanel()
    textarea.value = "code\n\n\n"
    lp.removePaddingForSave()
    expect(textarea.value).toBe("code\n")
  })
})

describe("ListingPanel — handleSourceEdited", () => {
  it("returns false when unpaddedSource is null", () => {
    const { lp } = makePanel()
    expect(lp.handleSourceEdited()).toBe(false)
  })

  it("returns true and clears unpaddedSource when unpaddedSource is set", () => {
    const { lp, listingEl, textarea } = makePanel()
    textarea.value = "line1\nline2\n"
    lp.setUnpaddedSource("line1\nline2\n")
    listingEl.textContent = "001: line1\n002: line2\n"
    const result = lp.handleSourceEdited()
    expect(result).toBe(true)
    expect(lp.getSource()).toBe(textarea.value)
  })

  it("strips padding newlines from textarea value", () => {
    const { lp, listingEl, textarea } = makePanel()
    lp.setUnpaddedSource("line1\nline2\n")
    listingEl.textContent = "001: line1\n002: line2\n003: extra\n"
    textarea.value = "line1\nline2\n\n"
    lp.handleSourceEdited()
    expect(textarea.value).toBe("line1\nline2\n")
  })

  it("dispatches an input event on the textarea", () => {
    const { lp, listingEl, textarea } = makePanel()
    lp.setUnpaddedSource("line1\n")
    listingEl.textContent = "001: line1\n"
    textarea.value = "line1\n"
    const listener = vi.fn()
    textarea.addEventListener("input", listener)
    lp.handleSourceEdited()
    expect(listener).toHaveBeenCalled()
  })
})

describe("ListingPanel — toggle button", () => {
  it("enableToggle sets disabled to false", () => {
    const { lp, toggle } = makePanel()
    toggle.disabled = true
    lp.enableToggle()
    expect(toggle.disabled).toBe(false)
  })

  it("disableToggle sets disabled to true", () => {
    const { lp, toggle } = makePanel()
    toggle.disabled = false
    lp.disableToggle()
    expect(toggle.disabled).toBe(true)
  })
})
