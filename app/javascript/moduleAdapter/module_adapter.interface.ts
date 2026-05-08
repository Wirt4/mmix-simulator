import type { Id64String } from "@itwin/core-bentley"

/** MMIX special registers. */
export enum SpecialRegister {
  RA = 21,
  RB = 0,
  RC = 8,
  RD = 1,
  RE = 2,
  RF = 22,
  RG = 19,
  RH = 3,
  RI = 12,
  RJ = 4,
  RK = 15,
  RL = 20,
  RM = 5,
  RN = 9,
  RO = 10,
  RP = 23,
  RQ = 16,
  RR = 6,
  RS = 11,
  RT = 13,
  RU = 17,
  RV = 18,
  RW = 24,
  RX = 25,
  RY = 26,
  RZ = 27,
  RBB = 7,
  RTT = 14,
  RWW = 28,
  RXX = 29,
  RYY = 30,
  RZZ = 31,
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
