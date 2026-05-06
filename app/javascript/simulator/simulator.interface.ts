export interface ISimulator {
  runUserProgram(): void
  specialRegisters: string[]
  generalRegisterCount: number
  getRegisterValue(register: string): string
}

