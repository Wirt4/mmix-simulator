export { IRegisterData, EnumRegisterType } from "../register_types.interface"
import { IRegisterData } from "../register_types.interface"

export interface IRegisters {
  render(registers: IRegisterData[]): void
  toggle(): void
  open(): void
  close(): void
}
