import { describe, it, vi, expect, beforeAll } from "vitest"
import Simulator from '../../app/javascript/simulator/simulator'
import { IModuleAdapter } from '../../app/javascript/moduleAdapter/module_adapter.interface'

const mockAdapter: IModuleAdapter = vi.hoisted(() => ({
  assembleMMIXAL: vi.fn(),
  getStdOut: vi.fn(),
  getStdErr: vi.fn(),
  simulateMMIX: vi.fn()
}))

vi.mock('../../app/javascript/moduleAdapter/factory', () => ({
  default: vi.fn(async () => { return mockAdapter })
}))

describe("Simulator tests", () => {
  it("runUserProgram calls assembleMMIXAL", async () => {
    const simulator = new Simulator(createTextarea(), createTextarea())
    await simulator.init()
    simulator.runUserProgram()

    expect(mockAdapter.assembleMMIXAL).toHaveBeenCalledTimes(1)
  })

  it("runUserProgram calls assembleMMIXAL with the code from the inText field", async () => {
    const userCode = "TRAP 0"
    const inText = createTextarea(userCode)
    const simulator = new Simulator(inText, createTextarea())
    await simulator.init()

    simulator.runUserProgram()

    expect(mockAdapter.assembleMMIXAL).toHaveBeenCalledWith(userCode)
  })

  it("if assembleMMIXAL returns false, then runUserProgram writes the stdErr to the outtext", async () => {
    const expected = "OOPS! an error message!"
    const outText = createTextarea()
    vi.spyOn(mockAdapter, 'assembleMMIXAL').mockReturnValue(false)
    vi.spyOn(mockAdapter, 'getStdErr').mockReturnValue(expected)

    const simulator = new Simulator(createTextarea(), outText)
    await simulator.init()
    simulator.runUserProgram()

    expect(outText.value).toEqual(expect.stringContaining(expected))
  })

  it("if assembleMMIXAL returns true, then runUserProgram also calls mmixSimulate", async () => {
    const outText = createTextarea()
    vi.spyOn(mockAdapter, 'assembleMMIXAL').mockReturnValue(true)

    const simulator = new Simulator(createTextarea(), outText)
    await simulator.init()
    simulator.runUserProgram()

    expect(mockAdapter.simulateMMIX).toHaveBeenCalledTimes(1)
  })

  it('writes std out to outfile', async () => {
    const outText = createTextarea()
    const expected = "Hello world!"
    vi.spyOn(mockAdapter, 'assembleMMIXAL').mockReturnValue(true)
    vi.spyOn(mockAdapter, 'getStdOut').mockReturnValue(expected)

    const simulator = new Simulator(createTextarea(), outText)
    await simulator.init()
    simulator.runUserProgram()

    expect(outText.value).toEqual(expect.stringContaining(expected))
  })

})

function createTextarea(value = ""): HTMLTextAreaElement {
  const textarea = document.createElement("textarea")
  textarea.value = value
  return textarea
}


