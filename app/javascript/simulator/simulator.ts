import { ISimulator } from './simulator.interface'
import { IModuleAdapter } from './../moduleAdapter/module_adapter.interface'

interface IRegisterInfo {
  code: number,
  description: string
}

export default class Simulator implements ISimulator {
  private _moduleAdapter: IModuleAdapter
  private _specialRegisterMap: Map<string, IRegisterInfo>
  private _successfulAssembly: boolean
  private _out: string
  //maintain a map of special register names to indeces

  constructor(moduleAdapter: IModuleAdapter) {
    this._successfulAssembly = false
    this._moduleAdapter = moduleAdapter
    this._specialRegisterMap = new Map([
      ["rA", { code: 21, description: "arithmetic status register" }],
      ["rB", { code: 0, description: "bootstrap register (trip)" }],
      ["rC", { code: 8, description: "continuation register" }],
      ["rD", { code: 1, description: "dividend register" }],
      ["rE", { code: 2, description: "epsilon register" }],
      ["rF", { code: 22, description: "failure location register" }],
      ["rG", { code: 19, description: "global threshold register" }],
      ["rH", { code: 3, description: "himult register" }],
      ["rI", { code: 12, description: "interval counter" }],
      ["rJ", { code: 4, description: "return-jump register" }],
      ["rK", { code: 15, description: "interrupt mask register" }],
      ["rL", { code: 20, description: "local threshold register" }],
      ["rM", { code: 5, description: "multiplex mask register" }],
      ["rN", { code: 9, description: "serial number" }],
      ["rO", { code: 10, description: "register stack offset" }],
      ["rP", { code: 23, description: "prediction register" }],
      ["rQ", { code: 16, description: "interrupt request register" }],
      ["rR", { code: 6, description: "remainder register" }],
      ["rS", { code: 11, description: "register stack pointer" }],
      ["rT", { code: 13, description: "trap address register" }],
      ["rU", { code: 17, description: "usage counter" }],
      ["rV", { code: 18, description: "virtual translation register" }],
      ["rW", { code: 24, description: "where-interrupted register (trip)" }],
      ["rX", { code: 25, description: "execution register (trip)" }],
      ["rY", { code: 26, description: "Y operand (trip)" }],
      ["rZ", { code: 27, description: "Z operand (trip)" }],
      ["rBB", { code: 7, description: "bootstrap register (trap)" }],
      ["rTT", { code: 14, description: "dynamic trap address register" }],
      ["rWW", { code: 28, description: "where-interrupted register (trap)" }],
      ["rXX", { code: 29, description: "execution register (trap)" }],
      ["rYY", { code: 30, description: "Y operand (trap)" }],
      ["rZZ", { code: 31, description: "Z operand (trap)" }],
    ])
    this._out = ""
  }

  public getStdOut(): string {
    return this._out
  }

  public runUserProgram(): void {
    if (this._successfulAssembly) {
      const timeout = 800;
      const instructionBatch = 1000;
      this._out = this.simulateWithTimeout(timeout, instructionBatch)
    }
  }

  public getRegisterValue(register: string): string {
    const re = new RegExp(/^[0-9]*$/, "i");
    if (re.test(register)) {
      return this._moduleAdapter.getGeneralRegisterValue(+register)
    }
    const specialIndex = this._specialRegisterMap.get(register)?.code
    if (specialIndex == undefined) {
      console.error(`undefined index for register: ${register}`)
      return `ERR`
    }
    return this._moduleAdapter.getSpecialRegisterValue(specialIndex)
  }

  getRegisterDescription(register: string): string {
    const info = this._specialRegisterMap.get(register)
    if (info !== undefined) {
      return info.description
    }
    return "Undefined Register"
  }

  assemble(mmixal: string): boolean {
    this._successfulAssembly = this._moduleAdapter.assembleMMIXAL(mmixal)
    if (!this._successfulAssembly) {
      this._out = this._moduleAdapter.getStdErr()
    }
    return this._successfulAssembly
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
