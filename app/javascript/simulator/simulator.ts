import { ISimulator } from './simulator.interface'
import { IModuleAdapter } from './../moduleAdapter/module_adapter.interface'

export default class Simulator implements ISimulator {
  private _inText: HTMLTextAreaElement
  private _outText: HTMLTextAreaElement
  private _moduleAdapter: IModuleAdapter
  private _specialRegisterMap: Map<string, number>
  //maintain a map of special register names to indeces

  constructor(inText: HTMLTextAreaElement, outText: HTMLTextAreaElement, moduleAdapter: IModuleAdapter) {
    this._inText = inText
    this._outText = outText
    this._moduleAdapter = moduleAdapter
    this._specialRegisterMap = new Map([
      ["rA", 21],
      ["rB", 0],
      ["rC", 8],
      ["rD", 1],
      ["rE", 2],
      ["rF", 22],
      ["rG", 19],
      ["rH", 3],
      ["rI", 12],
      ["rJ", 4],
      ["rK", 15],
      ["rL", 20],
      ["rM", 5],
      ["rN", 9],
      ["rO", 10],
      ["rP", 23],
      ["rQ", 16],
      ["rR", 6],
      ["rS", 11],
      ["rT", 13],
      ["rU", 17],
      ["rV", 18],
      ["rW", 24],
      ["rX", 25],
      ["rY", 26],
      ["rZ", 27],
      ["rBB", 7],
      ["rTT", 14],
      ["rWW", 28],
      ["rXX", 29],
      ["rYY", 30],
      ["rZZ", 31],
    ])
  }

  /** Assembles and executes the user's MMIXAL program, writing output to the output textarea. */
  public runUserProgram(): void {
    const successfullyAssembled = this._moduleAdapter.assembleMMIXAL(this._inText.value)
    if (!successfullyAssembled) {
      this._outText.value = this._moduleAdapter.getStdErr()
      return
    }

    const timeout = 800;
    const instructionBatch = 1000;
    this._outText.value = this.simulateWithTimeout(timeout, instructionBatch)
  }

  public getRegisterValue(register: string): string {
    const re = new RegExp(/^[0-9]*$/, "i");
    if (re.test(register)) {
      return this._moduleAdapter.getGeneralRegisterValue(+register)
    }
    const specialIndex = this._specialRegisterMap.get(register)
    if (specialIndex == undefined) {
      console.error(`undefined index for register: ${register}`)
      return `ERR`
    }
    return this._moduleAdapter.getSpecialRegisterValue(specialIndex)
  }

  get specialRegisters(): string[] {
    return Array.from(this._specialRegisterMap.keys()).sort((a, b) => a.length - b.length || a.localeCompare(b))
  }

  get generalRegisterCount(): number {
    return this._moduleAdapter.generalRegisterCount
  }

  private simulateWithTimeout(timeout: number, instructionsPerInterval: number): string {
    let programOutputs = "";

    if (!this.areActionableInputs(timeout, instructionsPerInterval)) {

      if (!this.areValidInputs(timeout, instructionsPerInterval)) {
        console.error("arguments to simulateWithTimeout must be non-negative integers")
        console.error(`timeout ${timeout.toString()}`)
        console.error(`instructionts per interval ${instructionsPerInterval.toString()}`)
      }

      return programOutputs
    }

    let cur: number = Date.now()
    const deadline = cur + timeout
    this._moduleAdapter.initializeMMIX()
    let hasTimedOut = false

    while (cur < deadline && !this._moduleAdapter.isHalted()) {
      cur = Date.now()
      this._moduleAdapter.performInstructions(instructionsPerInterval)
      programOutputs += this._moduleAdapter.getStdErr()
      programOutputs += this._moduleAdapter.getStdOut();
      hasTimedOut = cur >= deadline
    }

    this._moduleAdapter.finalizeMMIX()

    if (hasTimedOut) {
      return `ERROR: simulator timeout. Programs may not exceed ${timeout.toString()} ms of clock time\n`
    }

    return programOutputs;
  }

  private areActionableInputs(timeout: number, instructionsPerInterval: number): boolean {
    return (timeout > 0 && instructionsPerInterval > 0 && Number.isInteger(timeout) && Number.isInteger(instructionsPerInterval))
  }

  private areValidInputs(timeout: number, instructionsPerInterval: number): boolean {
    return (timeout >= 0 && instructionsPerInterval >= 0 && Number.isInteger(timeout) && Number.isInteger(instructionsPerInterval))
  }
}
