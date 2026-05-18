/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, vi, expect } from "vitest"
import Simulator from '../../app/javascript/simulator/simulator'
import { IModuleAdapter } from '../../app/javascript/moduleAdapter/module_adapter.interface'
import { EnumRegisterType } from "../../app/javascript/ide/registers.interface"

function createMockAdapter(): IModuleAdapter {
  return {
    assembleMMIXAL: vi.fn(),
    getStdOut: vi.fn(),
    getStdErr: vi.fn(),
    finalizeMMIX: vi.fn(),
    isHalted: vi.fn(),
    initializeMMIX: vi.fn(),
    performInstructions: vi.fn(),
    getGeneralRegisterValue: vi.fn(),
    getSpecialRegisterValue: vi.fn(),
    generalRegisterCount: 256,
    getListing: vi.fn()
  }
}

describe("Simulator tests", () => {
  it("assemble calls assembleMMIXAL", () => {
    const mockAdapter = createMockAdapter()
    vi.spyOn(mockAdapter, 'assembleMMIXAL')
    const simulator = new Simulator(mockAdapter)

    simulator.assemble("USER CODE")

    expect(mockAdapter.assembleMMIXAL).toHaveBeenCalledWith("USER CODE")
  })
  it("if assembleMMIXAL is okay, then assemble returns true", () => {
    const mockAdapter = createMockAdapter()
    vi.spyOn(mockAdapter, 'assembleMMIXAL').mockReturnValue(true)
    const simulator = new Simulator(mockAdapter)

    const result = simulator.assemble("USER CODE")

    expect(result).toBe(true)
  })
  it("runUserProgram doesn't call assembleMMIXAL", () => {
    const mockAdapter = createMockAdapter()
    vi.spyOn(mockAdapter, 'assembleMMIXAL')
    const simulator = new Simulator(mockAdapter)

    simulator.runUserProgram()

    expect(mockAdapter.assembleMMIXAL).not.toHaveBeenCalled()
  })
  it("on successful assembly, runUserProgram calls initializeMMIX", () => {
    const mockAdapter = createMockAdapter()
    vi.spyOn(mockAdapter, 'assembleMMIXAL').mockReturnValue(true)
    const simulator = new Simulator(mockAdapter)

    simulator.assemble("USER CODE")
    simulator.runUserProgram()

    expect(mockAdapter.initializeMMIX).toHaveBeenCalledTimes(1)
  })
  it("if assembly isn't successful, runUserProgram does not call initializeMMIX", () => {
    const mockAdapter = createMockAdapter()
    vi.spyOn(mockAdapter, 'assembleMMIXAL').mockReturnValue(false)
    const simulator = new Simulator(mockAdapter)

    simulator.assemble("USER CODE")
    simulator.runUserProgram()

    expect(mockAdapter.initializeMMIX).not.toHaveBeenCalled()

  })
  it("on successful assembly, runUserProgram calls finalizeMMIX", () => {
    const mockAdapter = createMockAdapter()
    vi.spyOn(mockAdapter, 'assembleMMIXAL').mockReturnValue(true)
    const simulator = new Simulator(mockAdapter)

    simulator.assemble("USER CODE")
    simulator.runUserProgram()

    expect(mockAdapter.finalizeMMIX).toHaveBeenCalledTimes(1)
  })
  it("on successful assembly, runUserProgram calls isHalted()  at least once", () => {
    const mockAdapter = createMockAdapter()
    vi.spyOn(mockAdapter, 'assembleMMIXAL').mockReturnValue(true)
    const simulator = new Simulator(mockAdapter)

    simulator.assemble("USER CODE")
    simulator.runUserProgram()

    expect(mockAdapter.isHalted).toHaveBeenCalled()
  })
  it("on successful assembly, and isHalted = false runUserProgram calls performInstructions()  at least once", () => {
    const mockAdapter = createMockAdapter()
    vi.spyOn(mockAdapter, 'assembleMMIXAL').mockReturnValue(true)
    vi.spyOn(mockAdapter, 'isHalted').mockReturnValue(false)
    const simulator = new Simulator(mockAdapter)

    simulator.assemble("TRAP 0")
    simulator.runUserProgram()

    expect(mockAdapter.performInstructions).toHaveBeenCalled()
  })

  it("runUserProgram calls assembleMMIXAL with the code from the inText field", () => {
    const mockAdapter = createMockAdapter()
    const simulator = new Simulator(mockAdapter)
    const userCode = "TRAP 0"
    simulator.assemble(userCode)
    simulator.runUserProgram()

    expect(mockAdapter.assembleMMIXAL).toHaveBeenCalledWith(userCode)
  })
  it("if assembleMMIXAL returns false, then assemble writes the stdErr to the outtext", () => {
    const expected = "OOPS! an error message!"
    const mockAdapter = createMockAdapter()
    vi.spyOn(mockAdapter, 'assembleMMIXAL').mockReturnValue(false)
    vi.spyOn(mockAdapter, 'getStdErr').mockReturnValue(expected)

    const simulator = new Simulator(mockAdapter)
    simulator.assemble("bad code")

    expect(simulator.getStdOut()).toEqual(expect.stringContaining(expected))
  })
  it('writes std out to outfile', () => {
    const expected = "Hello world!"
    const mockAdapter = createMockAdapter()
    vi.spyOn(mockAdapter, 'assembleMMIXAL').mockReturnValue(true)
    vi.spyOn(mockAdapter, 'getStdOut').mockReturnValue(expected)
    vi.spyOn(mockAdapter, 'isHalted').mockReturnValueOnce(false).mockReturnValueOnce(true)

    const simulator = new Simulator(mockAdapter)
    simulator.assemble("TRAP 0")
    simulator.runUserProgram()

    expect(simulator.getStdOut()).toEqual(expect.stringContaining(expected))
  })
  it("when the argument to getRegister value is for a general register, then simulator calls module.getGeneralRegister", () => {
    const mockAdapter = createMockAdapter()
    const spy = vi.spyOn(mockAdapter, 'getGeneralRegisterValue').mockReturnValue("0x0")

    const simulator = new Simulator(mockAdapter)
    simulator.getRegisterValue("0")

    expect(spy).toHaveBeenCalledWith(0)
  })
  it("when the argument to getRegister value is for a special register, then simulator callss module.getSpecialRegsiter instead of module.getGeneralRegister", () => {
    const mockAdapter = createMockAdapter()
    const genSpy = vi.spyOn(mockAdapter, 'getGeneralRegisterValue').mockReturnValue("0x0")
    const specSpy = vi.spyOn(mockAdapter, "getSpecialRegisterValue").mockReturnValue("0x0")

    const simulator = new Simulator(mockAdapter)
    simulator.getRegisterValue("rA")

    expect(genSpy).not.toHaveBeenCalled()
    expect(specSpy).toHaveBeenCalled()
  })
  it("returns answer from module", () => {
    const mockAdapter = createMockAdapter()
    const expected = "0x3080210401289212"
    vi.spyOn(mockAdapter, 'getGeneralRegisterValue').mockReturnValue(expected)

    const simulator = new Simulator(mockAdapter)
    const actual = simulator.getRegisterValue("0")

    expect(actual.length).toEqual(expected.length)
    expect(actual).toEqual(expect.stringContaining(expected))
  })
  it("gets a special register value", () => {
    const mockAdapter = createMockAdapter()
    const expected = "#00000000000000fc"
    vi.spyOn(mockAdapter, 'getSpecialRegisterValue').mockReturnValue(expected)

    const simulator = new Simulator(mockAdapter)
    const actual = simulator.getRegisterValue("rA")

    expect(actual.length).toEqual(expected.length)
    expect(actual).toEqual(expect.stringContaining(expected))
  })
  it("returns a correct description for a register", () => {
    const mockAdapter = createMockAdapter()
    const expected = "epsilon register"

    const simulator = new Simulator(mockAdapter)

    const result = simulator.getRegisterDescription("rE")
    expect(result.length).toEqual(expected.length)
    expect(result).toEqual(expect.stringContaining(expected))
  })
})

describe("long register list tests", () => {
  it("if getRegisters is called with General, then it returns an array of size 256", () => {
    const expectedCount = 256
    const mockAdapter = createMockAdapter()
    const simulator = new Simulator(mockAdapter)

    const actual = simulator.getRegisters(EnumRegisterType.GENERAL)

    expect(actual.length).toEqual(expectedCount)
  })
  it("if getRegisters is called with Special, then it returns an array of size 32", () => {
    const expectedCount = 32
    const mockAdapter = createMockAdapter()
    const simulator = new Simulator(mockAdapter)

    const actual = simulator.getRegisters(EnumRegisterType.SPECIAL)

    expect(actual.length).toEqual(expectedCount)
  })
  it("getRegisters returns results from the adapter", () => {
    const expected = "#00000000000000ff"
    const mockAdapter = createMockAdapter()
    vi.spyOn(mockAdapter, 'getGeneralRegisterValue')
      .mockReturnValueOnce(expected)
      .mockReturnValue("#0000000000000000")
    const simulator = new Simulator(mockAdapter)

    const actual = simulator.getRegisters(EnumRegisterType.GENERAL)

    expect(actual.some(r => r.value === expected)).toBe(true)
  })
  it("getRegisters maps correct values to general", () => {
    const mockAdapter = createMockAdapter()
    const hexA = "#0000000000000042"
    const hexB = "#ffffffffffffffff"
    const hexC = "#0000000000000003"
    const ndxA = 5
    const ndxB = 100
    const ndxC = 207
    const expectedA = "$5"
    const expectedB = "$100"
    const expectedC = "$207"

    const hexZero = "#0000000000000000"
    vi.spyOn(mockAdapter, 'getGeneralRegisterValue').mockImplementation((reg: number) => {
      switch (reg) {
        case ndxA:
          return hexA
        case ndxB:
          return hexB
        case ndxC:
          return hexC
        default:
          return hexZero
      }
    })
    const simulator = new Simulator(mockAdapter)

    const actual = simulator.getRegisters(EnumRegisterType.GENERAL)

    expect(actual[ndxA]).toEqual({ id: expectedA, value: hexA })
    expect(actual[ndxB]).toEqual({ id: expectedB, value: hexB })
    expect(actual[ndxC]).toEqual({ id: expectedC, value: hexC })
    const others = actual.filter((_, i) => !(i === ndxA || i === ndxB || i === ndxC))
    expect(others.every(r => r.value === hexZero)).toBe(true)
  })
  it("getRegisters maps correct values to special", () => {
    const mockAdapter = createMockAdapter()
    const hexA = "#0000000000000042"
    const hexB = "#ffffffffffffffff"
    const hexC = "#0000000000000003"
    /** note the peculiuar mapping:
    * the special register code (or index as far as the module is concerned) 
    * does not map to the special registers in lexigraphical order 
    * see TAOCP MMIX Fascicle for more information
    * */
    const ndxA = 21
    const expectedNdxA = 0
    const ndxB = 0
    const expectedNdxB = 1
    const ndxC = 31
    const expectedNdxC = 31
    const expectedA = "$rA"
    const expectedB = "$rB"
    const expectedC = "$rZZ"

    const hexZero = "#0000000000000000"
    vi.spyOn(mockAdapter, 'getSpecialRegisterValue').mockImplementation((reg: number) => {
      switch (reg) {
        case ndxA:
          return hexA
        case ndxB:
          return hexB
        case ndxC:
          return hexC
        default:
          return hexZero
      }
    })
    const simulator = new Simulator(mockAdapter)

    const actual = simulator.getRegisters(EnumRegisterType.SPECIAL)

    expect(actual[expectedNdxA]).toEqual(expect.objectContaining({ id: expectedA, value: hexA }))
    expect(actual[expectedNdxB]).toEqual(expect.objectContaining({ id: expectedB, value: hexB }))
    expect(actual[expectedNdxC]).toEqual(expect.objectContaining({ id: expectedC, value: hexC }))
    const others = actual.filter((_, i) => !(i === expectedNdxA || i === expectedNdxB || i === expectedNdxC))
    expect(others.every(r => r.value === hexZero)).toBe(true)
  })
  it("special registers also deliver descriptions", () => {
    const mockAdapter = createMockAdapter()
    const expectedNdxA = 0
    const expectedNdxB = 1
    const expectedNdxC = 31
    const expectedDescriptionA = "arithmetic status register" //rA
    const expectedDescriptionB = "bootstrap register (trip)" //rB
    const expectedDescriptionC = "Z operand (trap)" //rZZ

    const hexZero = "#0000000000000000"
    vi.spyOn(mockAdapter, 'getSpecialRegisterValue').mockReturnValue(hexZero)
    const simulator = new Simulator(mockAdapter)

    const actual = simulator.getRegisters(EnumRegisterType.SPECIAL)

    expect(actual[expectedNdxA]).toEqual(expect.objectContaining({ description: expectedDescriptionA }))
    expect(actual[expectedNdxB]).toEqual(expect.objectContaining({ description: expectedDescriptionB }))
    expect(actual[expectedNdxC]).toEqual(expect.objectContaining({ description: expectedDescriptionC }))
  })
})
