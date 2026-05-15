import { IRegisterData } from "../register_types.interface"

export interface IRegistersPanel {
  render(specialRegisterData: IRegisterData[], generalRegisterData: IRegisterData[]): void
  openAll(): void
  toggle(event: Event): void
  switchTab(): void
}
