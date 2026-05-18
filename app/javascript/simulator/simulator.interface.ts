import { EnumRegisterType, IRegisterData } from "../register_types.interface"
/** Controls the MMIX simulator lifecycle: assembling, running, and inspecting register state. */
export interface ISimulator {
  /** Assembles the user's MMIXAL program*/
  assemble(mmixal: string): boolean
  /** Executes the user's MMIXAL program, writing output to the output area. */
  runUserProgram(): void
  /** returns contents of both stdOut and stdErr*/
  getStdOut(): string
  /** Returns the assembly listing for the most recent successful assembly. */
  getListing(): string
  /** The list of MMIX special register names (rA, rB, etc.). */
  specialRegisters: string[]
  /** The total number of general-purpose registers (0–255). */
  generalRegisterCount: number
  /** Returns the current hex value of the given register. */
  getRegisterValue(register: string): string
  /** Returns a brief description of the given register */
  getRegisterDescription(register: string): string

  getRegisters(type: EnumRegisterType): IRegisterData[]
}

