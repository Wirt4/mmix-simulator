/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, vi, expect } from "vitest"
import Simulator from '../../app/javascript/simulator/simulator'
import { IModuleAdapter } from '../../app/javascript/moduleAdapter/module_adapter.interface'

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
    generalRegisterCount: 100,
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
    const expected = "0x00000000000000FC"
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
