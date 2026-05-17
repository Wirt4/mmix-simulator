import { describe, it, expect, beforeEach } from 'vitest'
import { Registers } from "../../../app/javascript/ide/registers"
import { EnumRegisterType, IRegisterData } from "../../../app/javascript/ide/registers.interface"

function buildPanel(): HTMLElement {
  const wrapper = document.createElement("div")
  wrapper.className = "register-panel"
  wrapper.innerHTML = `
      <div class="register-subpanel">
        <div class="register-subpanel-header register-subpanel-header--toggle">
          <span class="spin-arrow">&#9656;</span>
        </div>
        <div class="register-subpanel-body register-subpanel-body--collapsed">
          <div class="register-group-container"></div>
        </div>
`
  return wrapper
}

beforeEach(() => {
  document.body.innerHTML = ""
})

describe("register object constructor tests", () => {
  it("if register type is general, then the subpanel-header will be 'General'", () => {
    const expected = 'general-purpose-registers'
    const panel = buildPanel()

    new Registers(panel, EnumRegisterType.GENERAL)

    const header = panel.querySelector<HTMLElement>(".register-subpanel-header")
    expect(header).not.toBeNull()
    expect(header?.classList.contains(expected)).toBe(true)
  })
  it("if register type is special, then the subpanel-header will be 'Special'", () => {
    const expected = "special-registers"
    const panel = buildPanel()

    new Registers(panel, EnumRegisterType.SPECIAL)

    const header = panel.querySelector<HTMLElement>(".register-subpanel-header")
    expect(header).not.toBeNull()
    expect(header?.classList.contains(expected)).toBe(true)
  })
  it("Registers should have a spin arrow element", () => {
    const panel = buildPanel()

    new Registers(panel, EnumRegisterType.GENERAL)

    const header = panel.querySelector<HTMLElement>(".register-subpanel-header")
    expect(header).not.toBeNull()
    const arrowSpan = header?.querySelector<HTMLElement>(".spin-arrow")
    expect(arrowSpan).not.toBeNull()
  })
  it("If register type is general, then the register group container will be a general container", () => {
    const expected = "general-container"
    const panel = buildPanel()

    new Registers(panel, EnumRegisterType.GENERAL)

    const container = panel.querySelector<HTMLElement>(".register-group-container")
    expect(container).not.toBeNull()
    expect(container?.classList.contains(expected)).toBe(true)
  })
  it("If register type is special, then the register group container will be a special container", () => {
    const expected = "special-container"
    const panel = buildPanel()

    new Registers(panel, EnumRegisterType.SPECIAL)

    const container = panel.querySelector<HTMLElement>(".register-group-container")
    expect(container).not.toBeNull()
    expect(container?.classList.contains(expected)).toBe(true)
  })
})

describe("render tests", () => {
  it("each general register entry gets a register row", () => {
    const expectedNumber = 5
    const data: IRegisterData[] = [
      { id: "$1", value: "0x0000000000000000" },
      { id: "$2", value: "0x0000000000000000" },
      { id: "$3", value: "0x0000000000000000" },
      { id: "$4", value: "0x0000000000000000" },
      { id: "$5", value: "0x0000000000000000" }
    ]
    const panel = buildPanel()
    const registers = new Registers(panel, EnumRegisterType.GENERAL)

    registers.render(data)

    expect(panel.querySelector<HTMLElement>(".register-group-container")?.querySelectorAll(".register-row").length).toBe(expectedNumber)
  })
  it("each special regsiter entry gets a register row", () => {
    const expectedNumber = 1
    const data: IRegisterData[] = [{ id: "$rA", value: "0x0000000000000000" }]
    const panel = buildPanel()
    const registers = new Registers(panel, EnumRegisterType.SPECIAL)

    registers.render(data)

    expect(panel.querySelector<HTMLElement>(".register-group-container")?.querySelectorAll(".register-row").length).toBe(expectedNumber)
  })
  it("includes register names in the output", () => {
    const expectedA = "$rA"
    const expectedB = "$rB"
    const data: IRegisterData[] = [{ id: expectedA, value: "0x0000000000000000" }, { id: expectedB, value: "0x0000000000000000" }]
    const panel = buildPanel()
    const registers = new Registers(panel, EnumRegisterType.SPECIAL)

    registers.render(data)

    expect(panel.querySelector<HTMLElement>(".register-group-container")?.innerHTML).toContain(expectedA)
    expect(panel.querySelector<HTMLElement>(".register-group-container")?.innerHTML).toContain(expectedB)
  })
  it("includes register values in the output", () => {
    const expectedA = "0x0000000000000000"
    const expectedB = "0x00020300000000FF"
    const data: IRegisterData[] = [{ id: "$1", value: expectedA }, { id: "$2", value: expectedB }]
    const panel = buildPanel()
    const registers = new Registers(panel, EnumRegisterType.GENERAL)

    registers.render(data)

    expect(panel.querySelector<HTMLElement>(".register-group-container")?.innerHTML).toContain(expectedA)
    expect(panel.querySelector<HTMLElement>(".register-group-container")?.innerHTML).toContain(expectedB)
  })
  it("marks registers with non-zero values as active", () => {
    const panel = buildPanel()
    const registers = new Registers(panel, EnumRegisterType.GENERAL)
    const data = [{ id: "$1", value: "0x00020300000000FF" }]

    registers.render(data)

    expect(panel.querySelector<HTMLElement>(".register-group-container")?.querySelector(".register-row--active")).not.toBeNull()
  })
  it("special registers include tootip text", () => {
    //create a panel
    const panel = buildPanel()
    // initiate a special registers object
    const registers = new Registers(panel, EnumRegisterType.SPECIAL)
    // set the data which includes a description field set to "expected"
    const data = [{ id: "$rA", description: "arithmetic status register", value: "0x00020300000000FF" }]
    registers.render(data)

    // assert that there is an element with data-tooltip="arithmetic status register"
    expect(panel.querySelector<HTMLElement>('[data-tooltip="arithmetic status register"]')).not.toBeNull()
  })
})

describe("tooltip behavior tests", () => {
  it("mouseenter on a row with data-tooltip appends a tooltip div to document.body", () => {
    // create a panel with one special register that has a description
    const panel = buildPanel()
    const registers = new Registers(panel, EnumRegisterType.SPECIAL)
    const data = [{ id: "$rA", description: "arithmetic status register", value: "0x0000000000000000" }]
    registers.render(data)

    // fire mouseenter on the row
    const row = panel.querySelector<HTMLElement>("[data-tooltip]")
    row?.dispatchEvent(new MouseEvent("mouseenter"))

    // a tooltip div should appear in the body with the correct text
    const tooltip = document.body.querySelector(".register-tooltip")
    expect(tooltip).not.toBeNull()
    expect(tooltip?.textContent).toBe("arithmetic status register")
  })

  it("mouseleave removes the tooltip from document.body", () => {
    // create and render a register with a tooltip
    const panel = buildPanel()
    const registers = new Registers(panel, EnumRegisterType.SPECIAL)
    const data = [{ id: "$rA", description: "arithmetic status register", value: "0x0000000000000000" }]
    registers.render(data)

    const row = panel.querySelector<HTMLElement>("[data-tooltip]")
    // trigger enter then leave
    row?.dispatchEvent(new MouseEvent("mouseenter"))
    expect(document.body.querySelector(".register-tooltip")).not.toBeNull()
    row?.dispatchEvent(new MouseEvent("mouseleave"))

    // tooltip should be gone
    expect(document.body.querySelector(".register-tooltip")).toBeNull()
  })

  it("each row shows its own tooltip text, not the last row's text", () => {
    // create two rows with distinct descriptions
    const panel = buildPanel()
    const registers = new Registers(panel, EnumRegisterType.SPECIAL)
    const data = [
      { id: "$rA", description: "first description", value: "0x0000000000000000" },
      { id: "$rB", description: "second description", value: "0x0000000000000000" },
    ]
    registers.render(data)

    const rows = panel.querySelectorAll<HTMLElement>("[data-tooltip]")

    // hover first row - should show first description
    rows[0].dispatchEvent(new MouseEvent("mouseenter"))
    expect(document.body.querySelector(".register-tooltip")?.textContent).toBe("first description")
    rows[0].dispatchEvent(new MouseEvent("mouseleave"))

    // hover second row - should show second description
    rows[1].dispatchEvent(new MouseEvent("mouseenter"))
    expect(document.body.querySelector(".register-tooltip")?.textContent).toBe("second description")
    rows[1].dispatchEvent(new MouseEvent("mouseleave"))
  })

  it("only one tooltip exists in document.body at a time", () => {
    // create two rows with descriptions
    const panel = buildPanel()
    const registers = new Registers(panel, EnumRegisterType.SPECIAL)
    const data = [
      { id: "$rA", description: "first description", value: "0x0000000000000000" },
      { id: "$rB", description: "second description", value: "0x0000000000000000" },
    ]
    registers.render(data)

    const rows = panel.querySelectorAll<HTMLElement>("[data-tooltip]")

    // enter and leave first row, then enter second row
    rows[0].dispatchEvent(new MouseEvent("mouseenter"))
    rows[0].dispatchEvent(new MouseEvent("mouseleave"))
    rows[1].dispatchEvent(new MouseEvent("mouseenter"))

    // only one tooltip should be in the document
    expect(document.body.querySelectorAll(".register-tooltip").length).toBe(1)
  })
})

describe("toggle() tests", () => {
  it("toggle() will switch arrow icon and open/closed class", () => {
    //create registers
    const panel = buildPanel()
    const registers = new Registers(panel, EnumRegisterType.GENERAL)
    //assert is closed
    expect(panel.querySelector<HTMLElement>(".register-subpanel-body")?.classList.contains("register-subpanel-body--collapsed")).toBe(true)
    expect(panel.querySelector<HTMLElement>(".spin-arrow")?.classList.contains("spin-arrow--open")).toBe(false)
    //call toggle
    registers.toggle()
    //assert is open
    expect(panel.querySelector<HTMLElement>(".register-subpanel-body")?.classList.contains("register-subpanel-body--collapsed")).toBe(false)
    expect(panel.querySelector<HTMLElement>(".spin-arrow")?.classList.contains("spin-arrow--open")).toBe(true)
    //call toggle again
    registers.toggle()
    //assert is closed
    expect(panel.querySelector<HTMLElement>(".register-subpanel-body")?.classList.contains("register-subpanel-body--collapsed")).toBe(true)
    expect(panel.querySelector<HTMLElement>(".spin-arrow")?.classList.contains("spin-arrow--open")).toBe(false)
  })
  it("open() just straight-up opens the class", () => {
    //create registers
    const panel = buildPanel()
    const registers = new Registers(panel, EnumRegisterType.SPECIAL)
    // assert is closed
    expect(panel.querySelector<HTMLElement>(".register-subpanel-body")?.classList.contains("register-subpanel-body--collapsed")).toBe(true)
    expect(panel.querySelector<HTMLElement>(".spin-arrow")?.classList.contains("spin-arrow--open")).toBe(false)
    // call open
    registers.open()
    // assert is open
    expect(panel.querySelector<HTMLElement>(".register-subpanel-body")?.classList.contains("register-subpanel-body--collapsed")).toBe(false)
    expect(panel.querySelector<HTMLElement>(".spin-arrow")?.classList.contains("spin-arrow--open")).toBe(true)
    // call open again (to distinguish behavior from toggle)
    registers.open()
    // assert is open
    expect(panel.querySelector<HTMLElement>(".register-subpanel-body")?.classList.contains("register-subpanel-body--collapsed")).toBe(false)
    expect(panel.querySelector<HTMLElement>(".spin-arrow")?.classList.contains("spin-arrow--open")).toBe(true)
  })
  it("close() just straight-up closes the class", () => {
    //create registers
    const panel = buildPanel()
    const registers = new Registers(panel, EnumRegisterType.GENERAL)
    //open the tabs
    registers.open()
    // assert is open
    expect(panel.querySelector<HTMLElement>(".register-subpanel-body")?.classList.contains("register-subpanel-body--collapsed")).toBe(false)
    expect(panel.querySelector<HTMLElement>(".spin-arrow")?.classList.contains("spin-arrow--open")).toBe(true)
    // call close
    registers.close()
    // assert is closed
    expect(panel.querySelector<HTMLElement>(".register-subpanel-body")?.classList.contains("register-subpanel-body--collapsed")).toBe(true)
    expect(panel.querySelector<HTMLElement>(".spin-arrow")?.classList.contains("spin-arrow--open")).toBe(false)
    // call close again
    registers.close()
    // assert is still closed
    expect(panel.querySelector<HTMLElement>(".register-subpanel-body")?.classList.contains("register-subpanel-body--collapsed")).toBe(true)
    expect(panel.querySelector<HTMLElement>(".spin-arrow")?.classList.contains("spin-arrow--open")).toBe(false)
  })
})
