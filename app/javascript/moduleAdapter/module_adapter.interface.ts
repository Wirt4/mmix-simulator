/** Adapter for interacting with the MMIX WebAssembly module. */
export interface IModuleAdapter {
  /** Assembles MMIXAL source code via the WASM module. Returns true on success. */
  assembleMMIXAL(sourceCode: string): boolean
  /** Returns the contents of the simulator's stdout buffer. */
  getStdOut(): string
  /** Returns the contents of the simulator's stderr buffer. */
  getStdErr(): string
  /** Initializes the MMIX simulator state. */
  initializeMMIX(argv: string[]): void
  /** Tears down the MMIX simulator and releases resources. */
  finalizeMMIX(): void
  /** Returns true if the simulator has halted execution. */
  isHalted(): boolean
  /** Executes the given number of MMIX instructions. */
  performInstructions(instructions: number): void
  /** returns the value stored in the general register at index */
  getGeneralRegisterValue(index: number): string
  /** returns the value stored in the special register */
  getSpecialRegisterValue(index: number): string
  /** returns number of general registers*/
  generalRegisterCount: number
  /** returns number of special registers */
  specialRegisterCount: number
  /** returns string representation of assembled code */
  getListing(): string
  /** Arms an execution breakpoint at address (high:low). Call after initializeMMIX. */
  setExecutionBreakpoint(high: number, low: number): void
  /** Returns true if an execution breakpoint was hit during the last performInstructions call. */
  breakpointHit(): boolean
  /** Returns true if the given source line emitted code during the last successful assembly. */
  addressMapHasLine(line: number): boolean
  /** Returns one tetra of the address a source line assembled to; partition 0 = high, 1 = low. Returns 0 for unmapped lines — probe with addressMapHasLine first. */
  getAddressForLine(line: number, partition: 0 | 1): number
}
