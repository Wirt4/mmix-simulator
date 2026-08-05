import { EnumRegisterType, IRegisterData } from "../register_types.interface"

/** Controls the MMIX simulator lifecycle: assembling, running, debugging, and inspecting register state. */
export interface ISimulator {
  /** Clears out loaded arguments, breakpoints and assembled code*/
  reset(): void

  /** Assembles the user's MMIXAL program*/
  assemble(mmixal: string): boolean

  /** Arms execution breakpoints at the given source lines. Replaces the prior set; pass [] to clear. */
  setBreakpoints(lines: number[]): void

  /** Loads the argv (command-line arguments before program executes: common to both standard and debug cases)*/
  setArguments(argv: string[]): number

  /** runs the assembled mmix program to either successful completion, error, or a breakpoint*/
  execute(): EnumExecutionResult

  /** returns contents of both stdOut and stdErr*/
  getStdOut(): string

  /** Returns the assembly listing for the most recent successful assembly. */
  getListing(): string

  /** The list of MMIX special register names (rA, rB, etc.). */
  specialRegisters: string[]

  /** The total number of general-purpose registers (0–255). */
  generalRegisterCount: number

  /** The total number of MMIX special registers. */
  specialRegisterCount: number

  /** Returns the current hex value of the given register. */
  getRegisterValue(register: string): string

  /** Returns a brief description of the given register */
  getRegisterDescription(register: string): string

  /** Returns the register information of [type]: either General Registers or Special Registers */
  getRegisters(type: EnumRegisterType): IRegisterData[]
}
