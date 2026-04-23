/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, vi, expect } from "vitest"
import Simulator from '../../app/javascript/simulator/simulator'
import { IModuleAdapter } from '../../app/javascript/moduleAdapter/module_adapter.interface'

function createMockAdapter(): IModuleAdapter {
  return {
    assembleMMIXAL: vi.fn(),
    getStdOut: vi.fn(),
    getStdErr: vi.fn(),
    simulateMMIX: vi.fn()
  }
}

describe("Simulator tests", () => {
  it("runUserProgram calls assembleMMIXAL", () => {
    const mockAdapter = createMockAdapter()
    const simulator = new Simulator(createTextarea(), createTextarea(), mockAdapter)
    simulator.runUserProgram()

    expect(mockAdapter.assembleMMIXAL).toHaveBeenCalledTimes(1)
  })

  it("runUserProgram calls assembleMMIXAL with the code from the inText field", () => {
    const userCode = "TRAP 0"
    const inText = createTextarea(userCode)
    const mockAdapter = createMockAdapter()
    const simulator = new Simulator(inText, createTextarea(), mockAdapter)

    simulator.runUserProgram()

    expect(mockAdapter.assembleMMIXAL).toHaveBeenCalledWith(userCode)
  })

  it("if assembleMMIXAL returns false, then runUserProgram writes the stdErr to the outtext", () => {
    const expected = "OOPS! an error message!"
    const outText = createTextarea()
    const mockAdapter = createMockAdapter()
    vi.spyOn(mockAdapter, 'assembleMMIXAL').mockReturnValue(false)
    vi.spyOn(mockAdapter, 'getStdErr').mockReturnValue(expected)

    const simulator = new Simulator(createTextarea(), outText, mockAdapter)
    simulator.runUserProgram()

    expect(outText.value).toEqual(expect.stringContaining(expected))
  })

  it("if assembleMMIXAL returns true, then runUserProgram also calls mmixSimulate", () => {
    const outText = createTextarea()
    const mockAdapter = createMockAdapter()
    vi.spyOn(mockAdapter, 'assembleMMIXAL').mockReturnValue(true)

    const simulator = new Simulator(createTextarea(), outText, mockAdapter)
    simulator.runUserProgram()

    expect(mockAdapter.simulateMMIX).toHaveBeenCalledTimes(1)
  })

  it('writes std out to outfile', () => {
    const outText = createTextarea()
    const expected = "Hello world!"
    const mockAdapter = createMockAdapter()
    vi.spyOn(mockAdapter, 'assembleMMIXAL').mockReturnValue(true)
    vi.spyOn(mockAdapter, 'getStdOut').mockReturnValue(expected)

    const simulator = new Simulator(createTextarea(), outText, mockAdapter)
    simulator.runUserProgram()

    expect(outText.value).toEqual(expect.stringContaining(expected))
  })
})

function createTextarea(value = ""): HTMLTextAreaElement {
  const textarea = document.createElement("textarea")
  textarea.value = value
  return textarea
}
