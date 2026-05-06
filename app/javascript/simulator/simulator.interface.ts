/** Controls the MMIX simulator lifecycle: assembling, running, and inspecting register state. */
export interface ISimulator {
  /** Assembles and executes the user's MMIXAL program, writing output to the output area. */
  runUserProgram(): void
  /** The list of MMIX special register names (rA, rB, etc.). */
  specialRegisters: string[]
  /** The total number of general-purpose registers (0–255). */
  generalRegisterCount: number
  /** Returns the current hex value of the given register. */
  getRegisterValue(register: string): string
}

