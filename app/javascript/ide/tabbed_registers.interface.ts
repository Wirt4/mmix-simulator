import { IRegisters } from './registers.interface'
export interface ITabbedRegisters extends IRegisters {
  switchTab(): void
}
