import { ISimulator } from './simulator.interface'
import { IModuleAdapter } from './../moduleAdapter/module_adapter.interface'
import { EnumRegisterType, IRegisterData } from "../register_types.interface"
import { EnumExecutionResult } from "../enums/enumExecutionResult"

interface IRegisterInfo {
  code: number,
  description: string
}

interface IArmedBreakpoint {
  line: number,
  high: number,
  low: number
}

export default class Simulator implements ISimulator {
  private _moduleAdapter: IModuleAdapter
  private _specialRegisterMap: Map<string, IRegisterInfo>
  private _successfulAssembly: boolean
  private _out: string
  private _armedBreakpoints: IArmedBreakpoint[]
  private _lastResult: number
  private readonly _timeoutMs = 800
  private readonly _instructionBatch = 1000

  constructor(moduleAdapter: IModuleAdapter) {
    this._successfulAssembly = false
    this._moduleAdapter = moduleAdapter
    this._armedBreakpoints = []
    this._lastResult = 0; // 0 means halted
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

  public reset(): void {
    this._moduleAdapter.finalizeMMIX()
  }

  public getStdOut(): string {
    return this._out
  }

  setArguments(argv: string[]): number {
    this._moduleAdapter.initializeMMIX(argv);
    return 0;
  }
  //executes a single instruction
  public executeInstruction(): EnumExecutionResult {
    this._moduleAdapter.performInstructions(1)
    if (this._moduleAdapter.isHalted()) return EnumExecutionResult.HALTED
    return EnumExecutionResult.CONTINUE
  }

  public setBreakpoints(lines: number[]): void {
    this._armedBreakpoints = lines.map((line) => ({
      line,
      high: this._moduleAdapter.getAddressForLine(line, 0),
      low: this._moduleAdapter.getAddressForLine(line, 1),
    }))
  }

  public runUserProgram(argv: string[]): number {
    if (!this._successfulAssembly) {
      return this._lastResult
    }
    this._out = ""
    this._lastResult = this.simulateWithTimeout(this._timeoutMs, this._instructionBatch, argv)
    return this._lastResult
  }

  public resume(): number {
    //if the status is not paused at a line
    if (this._lastResult <= 0) {
      return this._lastResult
    }
    // the C side keeps the breakpoint set and clears the hit flag on re-entry,
    // so resuming is just running the batch loop again — no re-init, no re-arm
    this._lastResult = this.runBatchLoop(this._timeoutMs, this._instructionBatch)
    return this._lastResult
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

  public getListing(): string {
    return this._moduleAdapter.getListing()
  }

  get specialRegisters(): string[] {
    return Array.from(this._specialRegisterMap.keys()).sort((a, b) => a.length - b.length || a.localeCompare(b))
  }

  get generalRegisterCount(): number {
    return this._moduleAdapter.generalRegisterCount
  }

  get specialRegisterCount(): number {
    return this._moduleAdapter.specialRegisterCount
  }

  getRegisters(type: EnumRegisterType): IRegisterData[] {
    switch (type) {
      case EnumRegisterType.GENERAL:
        return this.allGeneralRegisters()
      case EnumRegisterType.SPECIAL:
        return this.allSpecialRegisters()
    }
  }

  private allGeneralRegisters(): IRegisterData[] {
    const result = new Array<IRegisterData>(this._moduleAdapter.generalRegisterCount)
    for (let i = 0; i < this._moduleAdapter.generalRegisterCount; i++) {
      const id = `$${String(i)}`
      const value = this._moduleAdapter.getGeneralRegisterValue(i)
      result[i] = { id, value }
    }
    return result
  }

  private allSpecialRegisters(): IRegisterData[] {
    const count = this._moduleAdapter.specialRegisterCount
    const regKeys = Array.from(this._specialRegisterMap.keys())
    const result = new Array<IRegisterData>(count)
    for (let i = 0; i < count; i++) {
      const regName = regKeys[i]
      const data = this._specialRegisterMap.get(regName)
      if (!data) continue
      const ndx = data.code
      const description = data.description
      const id = `$${regName}`
      const value = this._moduleAdapter.getSpecialRegisterValue(ndx)
      result[i] = { id, value, description }
    }
    return result
  }

  private simulateWithTimeout(timeout: number, instructionsPerInterval: number, argv: string[]): number {
    if (!this.areActionableInputs(timeout, instructionsPerInterval)) {
      if (!this.areValidInputs(timeout, instructionsPerInterval)) {
        this.logTimeInstructionErrors(timeout, instructionsPerInterval)
      }
      //is this correct? Intuition says timeout here, which would be -1
      return 0;
    }

    try {
      this._moduleAdapter.initializeMMIX(argv)
    } catch (err) {
      console.error(err)
    }

    for (const breakpoint of this._armedBreakpoints) {
      this._moduleAdapter.setExecutionBreakpoint(breakpoint.high, breakpoint.low)
    }

    return this.runBatchLoop(timeout, instructionsPerInterval)
  }

  /**
   * Runs instruction batches until the program halts, pauses at a breakpoint, or
   * exceeds the deadline. Output accumulates in _out; the simulator is finalized
   * unless it pauses (resume() re-enters this loop).
   */
  private runBatchLoop(timeout: number, instructionsPerInterval: number): number {
    const deadline = Date.now() + timeout
    const programOutputs = new Outputs()
    let result = -1 // timeout 

    while (Date.now() < deadline) {
      if (this._moduleAdapter.isHalted()) {
        result = 0
        break
      }
      this._moduleAdapter.performInstructions(instructionsPerInterval)
      programOutputs.append(this._moduleAdapter.getStdErr(), this._moduleAdapter.getStdOut())
      if (this._moduleAdapter.breakpointHit()) {
        result = this.pausedLine()
        break
      }
    }

    this._out += programOutputs.toString()

    //return if result is paused
    if (result > 0) {
      return result
    }

    this._moduleAdapter.finalizeMMIX()

    if (result < 0) {
      this._out += `ERROR: simulator timeout. Programs may not exceed ${timeout.toString()} ms of clock time\n`
    }

    return result
  }

  /**
   * The C side does not expose which address paused execution, so report the
   * most recently armed line — exact whenever a single breakpoint is armed.
   */
  private pausedLine(): number {
    if (this._armedBreakpoints.length === 0) {
      return 0
    }
    return this._armedBreakpoints[this._armedBreakpoints.length - 1].line
  }

  private areActionableInputs(timeout: number, instructionsPerInterval: number): boolean {
    return (timeout > 0 && instructionsPerInterval > 0 && Number.isInteger(timeout) && Number.isInteger(instructionsPerInterval))
  }

  private areValidInputs(timeout: number, instructionsPerInterval: number): boolean {
    return (timeout >= 0 && instructionsPerInterval >= 0 && Number.isInteger(timeout) && Number.isInteger(instructionsPerInterval))
  }

  private logTimeInstructionErrors(timeout: number, instructionsPerInterval: number): void {
    console.error("arguments to simulateWithTimeout must be non-negative integers")
    console.error(`timeout ${timeout.toString()}`)
    console.error(`instructionts per interval ${instructionsPerInterval.toString()}`)

  }
}

class Outputs {
  private log: string[] = []
  public append(stderr: string, stdout: string): void {
    this.log.push(stderr)
    this.log.push(stdout)
  }

  public toString(): string {
    return this.log.join("")
  }
}
