import type { Id64String } from "@itwin/core-bentley"

/** MMIX special registers. */
export enum SpecialRegister {
  rA = 21,
  rB = 0,
  rC = 8,
  rD = 1,
  rE = 2,
  rF = 22,
  rG = 19,
  rH = 3,
  rI = 12,
  rJ = 4,
  rK = 15,
  rL = 20,
  rM = 5,
  rN = 9,
  rO = 10,
  rP = 23,
  rQ = 16,
  rR = 6,
  rS = 11,
  rT = 13,
  rU = 17,
  rV = 18,
  rW = 24,
  rX = 25,
  rY = 26,
  rZ = 27,
  rBB = 7,
  rTT = 14,
  rWW = 28,
  rXX = 29,
  rYY = 30,
  rZZ = 31,
}
/** Adapter for interacting with the MMIX WebAssembly module. */
export interface IModuleAdapter {
  /** Assembles MMIXAL source code via the WASM module. Returns true on success. */
  assembleMMIXAL(sourceCode: string): boolean
  /** Returns the contents of the simulator's stdout buffer. */
  getStdOut(): string
  /** Returns the contents of the simulator's stderr buffer. */
  getStdErr(): string
  /** Initializes the MMIX simulator state. */
  intitializeMMIX(): void
  /** Tears down the MMIX simulator and releases resources. */
  finalizeMMIX(): void
  /** Returns true if the simulator has halted execution. */
  isHalted(): boolean
  /** Executes the given number of MMIX instructions. */
  performInstructions(instructions: number): void
  /** returns the value stored in the general register at index */
  getGeneralRegisterValue(index: number): Id64String
  /** returns the value stored in the special register */
  getSpecialRegisterValue(reg: SpecialRegister): Id64String
}
