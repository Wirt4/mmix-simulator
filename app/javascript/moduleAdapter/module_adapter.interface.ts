import type { Id64String } from "@itwin/core-bentley"

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
  getSpecialRegisterValue(index: number): Id64String
  /** returns number of general registers*/
  generalRegisterCount: number
}
