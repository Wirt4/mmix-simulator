import { ISimulator } from './simulator.interface'
import { IModuleAdapter } from './../moduleAdapter/module_adapter.interface'

export default class Simulator implements ISimulator {
  private _inText: HTMLTextAreaElement
  private _outText: HTMLTextAreaElement
  private _moduleAdapter: IModuleAdapter

  constructor(inText: HTMLTextAreaElement, outText: HTMLTextAreaElement, moduleAdapter: IModuleAdapter) {
    this._inText = inText
    this._outText = outText
    this._moduleAdapter = moduleAdapter
  }

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
    //stub
    return "0x0000000000000000"
  }

  get specialRegisters(): Array<string> {
    return [
      "rA", "rB", "rC", "rD", "rE", "rF", "rG", "rH",
      "rI", "rJ", "rK", "rL", "rM", "rN", "rO", "rP",
      "rQ", "rR", "rS", "rT", "rTT", "rU", "rV", "rW",
      "rX", "rY", "rZ", "rBB", "rWW", "rXX", "rYY", "rZZ"
    ]
  }

  get generalRegisterCount(): number {
    return 256
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
    this._moduleAdapter.intitializeMMIX()
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
