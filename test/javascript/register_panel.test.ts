/* eslint-disable @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-confusing-void-expression */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import RegisterPanel from '../../app/javascript/ide/register_panel'
import { ISimulator } from '../../app/javascript/simulator/simulator.interface'

function createMockSimulator(overrides: Partial<ISimulator> = {}): ISimulator {
  return {
    assemble: vi.fn().mockReturnValue(true),
    runUserProgram: vi.fn(),
    getStdOut: vi.fn().mockReturnValue(""),
    getListing: vi.fn().mockReturnValue(""),
    specialRegisters: ["rA", "rB"],
    generalRegisterCount: 64,
    getRegisterValue: vi.fn().mockReturnValue("0x0000000000000000"),
    getRegisterDescription: vi.fn().mockReturnValue("test register"),
    ...overrides,
  }
}

beforeEach(() => {
  document.body.innerHTML = ""
})

function buildDOM() {
  const wrapper = document.createElement("div")
  wrapper.className = "register-panel"
  wrapper.innerHTML = `
    <div class="register-panel-scroll">
      <div class="register-subpanel">
        <div class="register-subpanel-header register-subpanel-header--toggle">
          <span class="spin-arrow">&#9656;</span>
          Special
        </div>
        <div class="register-subpanel-body register-subpanel-body--collapsed">
          <div class="register-group-container special-container"></div>
        </div>
      </div>
      <div class="register-subpanel">
        <div class="register-subpanel-header register-subpanel-header--toggle">
          <span class="spin-arrow">&#9656;</span>
          General
        </div>
        <div class="register-subpanel-body register-subpanel-body--collapsed">
          <div class="register-group-controls">
            <select class="group-select"></select>
          </div>
          <div class="register-group-container general-container"></div>
        </div>
      </div>
    </div>
  `
  document.body.appendChild(wrapper)
  const specialContainer = wrapper.querySelector<HTMLElement>(".special-container")!
  const generalContainer = wrapper.querySelector<HTMLElement>(".general-container")!
  const groupSelect = wrapper.querySelector<HTMLSelectElement>(".group-select")!
  return { wrapper, specialContainer, generalContainer, groupSelect }
}

function makePanel(simulatorOverrides: Partial<ISimulator> = {}) {
  const dom = buildDOM()
  const sim = createMockSimulator(simulatorOverrides)
  const panel = new RegisterPanel(dom.specialContainer, dom.generalContainer, dom.groupSelect, sim)
  return { panel, sim, ...dom }
}

describe("RegisterPanel — renderSpecialRegisters", () => {
  it("populates the special container with register rows", () => {
    const { panel, specialContainer } = makePanel()
    panel.renderSpecialRegisters()
    expect(specialContainer.querySelectorAll(".register-row").length).toBe(2)
  })

  it("includes register names in the output", () => {
    const { panel, specialContainer } = makePanel()
    panel.renderSpecialRegisters()
    expect(specialContainer.innerHTML).toContain("$rA")
    expect(specialContainer.innerHTML).toContain("$rB")
  })

  it("marks registers with non-zero values as active", () => {
    const { panel, specialContainer } = makePanel({
      getRegisterValue: vi.fn().mockReturnValue("0x00000000000000FF"),
    })
    panel.renderSpecialRegisters()
    expect(specialContainer.querySelector(".register-row--active")).not.toBeNull()
  })

  it("does not mark zero-value registers as active", () => {
    const { panel, specialContainer } = makePanel()
    panel.renderSpecialRegisters()
    expect(specialContainer.querySelector(".register-row--active")).toBeNull()
  })
})

describe("RegisterPanel — renderGeneralRegisters", () => {
  it("populates the general container with register groups", () => {
    const { panel, generalContainer } = makePanel()
    panel.renderGeneralRegisters()
    expect(generalContainer.querySelectorAll(".register-group").length).toBeGreaterThan(0)
  })

  it("populates the group select dropdown with options", () => {
    const { panel, groupSelect } = makePanel()
    panel.renderGeneralRegisters()
    expect(groupSelect.querySelectorAll("option").length).toBeGreaterThan(0)
  })

  it("renders the correct number of register rows", () => {
    const { panel, generalContainer } = makePanel()
    panel.renderGeneralRegisters()
    expect(generalContainer.querySelectorAll(".register-row").length).toBe(64)
  })
})

describe("RegisterPanel — openAllSubpanels", () => {
  it("removes collapsed class from all subpanel bodies", () => {
    const { panel, wrapper } = makePanel()
    panel.openAllSubpanels()
    const bodies = wrapper.querySelectorAll(".register-subpanel-body")
    bodies.forEach((body) => {
      expect(body.classList.contains("register-subpanel-body--collapsed")).toBe(false)
    })
  })

  it("adds spin-arrow--open to all arrows", () => {
    const { panel, wrapper } = makePanel()
    panel.openAllSubpanels()
    const arrows = wrapper.querySelectorAll(".spin-arrow")
    arrows.forEach((arrow) => {
      expect(arrow.classList.contains("spin-arrow--open")).toBe(true)
    })
  })
})

describe("RegisterPanel — switchTab", () => {
  it("throws if called before renderGeneralRegisters", () => {
    const { panel } = makePanel()
    expect(() => panel.switchTab()).toThrow("general registers not rendered")
  })

  it("hides all groups and shows the selected one", () => {
    const { panel, generalContainer, groupSelect } = makePanel()
    panel.renderGeneralRegisters()
    groupSelect.value = "1"
    panel.switchTab()
    const group0 = generalContainer.querySelector<HTMLElement>("#gp-group-0")
    const group1 = generalContainer.querySelector<HTMLElement>("#gp-group-1")
    expect(group0?.style.display).toBe("none")
    expect(group1?.style.display).toBe("block")
  })
})

describe("RegisterPanel — toggleSubpanel", () => {
  it("toggles the collapsed class on the body", () => {
    const { panel, wrapper } = makePanel()
    const header = wrapper.querySelector<HTMLElement>(".register-subpanel-header")!
    const body = header.nextElementSibling as HTMLElement
    body.classList.add("register-subpanel-body--collapsed")

    const event = new Event("click")
    Object.defineProperty(event, "currentTarget", { value: header })
    panel.toggleSubpanel(event)

    expect(body.classList.contains("register-subpanel-body--collapsed")).toBe(false)
  })

  it("toggles the spin-arrow--open class on the arrow", () => {
    const { panel, wrapper } = makePanel()
    const header = wrapper.querySelector<HTMLElement>(".register-subpanel-header")!
    const arrow = header.querySelector(".spin-arrow")!

    const event = new Event("click")
    Object.defineProperty(event, "currentTarget", { value: header })
    panel.toggleSubpanel(event)

    expect(arrow.classList.contains("spin-arrow--open")).toBe(true)
  })
})
