export interface ISimulator {
  runUserProgram(): void
  specialRegisters: Array<string>
  generalRegisterCount: number
  getRegisterValue(register: string): string
}

