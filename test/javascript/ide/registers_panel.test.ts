import { describe, it, vi, expect, beforeEach } from "vitest"
import { IRegisters } from "../../../app/javascript/ide/registers.interface"
import { ITabbedRegisters } from "../../../app/javascript/ide/tabbed_registers.interface"
import { RegistersPanel } from "../../../app/javascript/ide/registers_panel"

function stubSpecial(): IRegisters {
  return {
    render: vi.fn(),
    toggle: vi.fn(),
    open: vi.fn(),
    close: vi.fn()
  }
}

function stubGeneral(): ITabbedRegisters {
  return {
    render: vi.fn(),
    toggle: vi.fn(),
    open: vi.fn(),
    close: vi.fn(),
    switchTab: vi.fn()
  }
}

let specialRegisters: IRegisters
let generalRegisters: ITabbedRegisters

beforeEach(() => {
  specialRegisters = stubSpecial()
  generalRegisters = stubGeneral()
})

describe("registersPanel tests", () => {
  it("correct data is passed to both components", () => {
    const specialRegisterSpy = vi.spyOn(specialRegisters, 'render')
    const generalRegisterSpy = vi.spyOn(generalRegisters, 'render')
    const expectedSpecial = [{ id: "$rA", value: "0x0", description: "stub" }]
    const expectedGeneral = [{ id: "$0", value: "0x0", description: "stub" }]
    const panel = new RegistersPanel(specialRegisters, generalRegisters)

    panel.render(expectedSpecial, expectedGeneral)
    expect(generalRegisterSpy).toHaveBeenCalledWith(expectedGeneral)
    expect(specialRegisterSpy).toHaveBeenCalledWith(expectedSpecial)
  })
  it("openAll() calls open() on both components", () => {
    const specialOpenSpy = vi.spyOn(specialRegisters, 'open')
    const generalOpenSpy = vi.spyOn(generalRegisters, 'open')
    const panel = new RegistersPanel(specialRegisters, generalRegisters)

    panel.openAll()

    expect(specialOpenSpy).toHaveBeenCalled()
    expect(generalOpenSpy).toHaveBeenCalled()
  })
  it("click event on a the special registers subpanel calls the special registers click method", () => {
    const specialToggleSpy = vi.spyOn(specialRegisters, 'toggle')
    const panel = new RegistersPanel(specialRegisters, generalRegisters)

    const parent = document.createElement('div')
    parent.classList.add('register-subpanel-header')
    parent.classList.add('special-registers')
    const target = document.createElement('span')
    parent.appendChild(target)
    const event = new MouseEvent('click', { bubbles: true })
    Object.defineProperty(event, 'target', { value: target })

    panel.toggle(event)

    expect(specialToggleSpy).toHaveBeenCalled()
  })
  it("click event on a the general registers subpanel calls the general registers click method", () => {
    const specialToggleSpy = vi.spyOn(specialRegisters, 'toggle')
    const generalToggleSpy = vi.spyOn(generalRegisters, 'toggle')
    const panel = new RegistersPanel(specialRegisters, generalRegisters)

    const parent = document.createElement('div')
    parent.classList.add('register-subpanel-header')
    parent.classList.add('general-purpose-registers')
    const target = document.createElement('span')
    parent.appendChild(target)
    const event = new MouseEvent('click', { bubbles: true })
    Object.defineProperty(event, 'target', { value: target })

    panel.toggle(event)

    expect(specialToggleSpy).not.toHaveBeenCalled()
    expect(generalToggleSpy).toHaveBeenCalled()
  })
  it("switchTab calls general component's switchTab", () => {
    const switchSpy = vi.spyOn(generalRegisters, 'switchTab')
    const panel = new RegistersPanel(specialRegisters, generalRegisters)

    panel.switchTab()

    expect(switchSpy).toHaveBeenCalled()
  })
})
