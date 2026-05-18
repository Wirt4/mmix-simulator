import { beforeEach, describe, it, expect, vi } from "vitest"
import { IRegisters, IRegisterData } from "../../../app/javascript/ide/registers.interface"
import { TabbedRegisters } from "../../../app/javascript/ide/tabbed_registers"

describe("passthrough methods", () => {
  let registerMock: IRegisters
  let selectEl: HTMLSelectElement
  let frontData: IRegisterData[]
  let rearData: IRegisterData[]
  let mockData: IRegisterData[]
  beforeEach(() => {
    registerMock = {
      render: vi.fn(),
      toggle: vi.fn(),
      open: vi.fn(),
      close: vi.fn()
    }
    selectEl = document.createElement("select")
    frontData = [{ id: "$0", value: "0x0" }, { id: "$1", value: "0x0" }, { id: "$2", value: "0x0" }, { id: "$3", value: "0x0" }, { id: "$4", value: "0x0" }]

    rearData = [{ id: "$5", value: "0x0" }, { id: "$6", value: "0x0" }, { id: "$7", value: "0x0" }, { id: "$8", value: "0x0" }, { id: "$9", value: "0x0" }]

    mockData = [...frontData, ...rearData]
  })
  it("calls render on registers.render with same argument", () => {
    const renderSpy = vi.spyOn(registerMock, 'render')
    const tabbedRegisters = new TabbedRegisters(registerMock, selectEl, 10)
    tabbedRegisters.render(mockData)
    expect(renderSpy).toHaveBeenCalledWith(mockData)
  })
  it("when tabbed registers has more data than space, it only renders the first data chunk", () => {
    const renderSpy = vi.spyOn(registerMock, 'render')
    const tabbedRegisters = new TabbedRegisters(registerMock, selectEl, 5)
    tabbedRegisters.render(mockData)
    expect(renderSpy).toHaveBeenCalledWith(frontData)
  })
  it("rendering with more data than modulus should paginate", () => {
    const tabbedRegisters = new TabbedRegisters(registerMock, selectEl, 5)

    tabbedRegisters.render(mockData)

    expect(selectEl.querySelectorAll("option").length).toEqual(2)
  })
  it("options should display register ranges", () => {
    const tabbedRegisters = new TabbedRegisters(registerMock, selectEl, 5)
    tabbedRegisters.render(mockData)
    const options = selectEl.querySelectorAll("option")
    expect(options[0].textContent).toEqual("0 - 4")
    expect(options[1].textContent).toEqual("5 - 9")
  })
  it("switching tabs should call render registers with the rest of the data", () => {
    const spy = vi.spyOn(registerMock, 'render')
    // mocking the initial render
    const tabbedRegisters = new TabbedRegisters(registerMock, selectEl, 5)
    tabbedRegisters.render(mockData)
    selectEl.value = "1"

    tabbedRegisters.switchTab()

    expect(spy).toHaveBeenCalledWith(rearData)
  })
  it("the dropdown maintains it state between renders", () => {
    const spy = vi.spyOn(registerMock, 'render')
    const tabbedRegisters = new TabbedRegisters(registerMock, selectEl, 5)
    tabbedRegisters.render(mockData)
    selectEl.value = "1"
    tabbedRegisters.switchTab()
    const newFrontData = [{ id: "$0", value: "0x1" }, { id: "$1", value: "0x1" }, { id: "$2", value: "0x1" }, { id: "$3", value: "0x1" }, { id: "$4", value: "0x1" }]
    const newRearData = [{ id: "$5", value: "0x1" }, { id: "$6", value: "0x1" }, { id: "$7", value: "0x1" }, { id: "$8", value: "0x1" }, { id: "$9", value: "0x1" }]
    const newMockData = [...newFrontData, ...newRearData]
    spy.mockClear()

    tabbedRegisters.render(newMockData)

    expect(spy).not.toHaveBeenCalledWith(newFrontData)
    expect(spy).toHaveBeenCalledWith(newRearData)
  })
})
