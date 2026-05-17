import { IRegistersPanel } from "./registers_panel.interface"
import { IRegisterData } from "../register_types.interface"
import { IRegisters } from "./registers.interface"
import { ITabbedRegisters } from "./tabbed_registers.interface"

export class RegistersPanel implements IRegistersPanel {
  constructor(private specialRegisters: IRegisters, private generalRegisters: ITabbedRegisters) { }

  render(specialRegisterData: IRegisterData[], generalRegisterData: IRegisterData[]): void {
    this.specialRegisters.render(specialRegisterData)
    this.generalRegisters.render(generalRegisterData)
  }

  openAll(): void {
    this.specialRegisters.open()
    this.generalRegisters.open()
  }

  toggle(event: Event): void {
    const target = event.target as HTMLElement
    const header = target.closest('.register-subpanel-header')

    if (!header) return

    if (header.classList.contains('special-registers')) {
      this.specialRegisters.toggle()
      return
    }

    if (header.classList.contains('general-purpose-registers')) this.generalRegisters.toggle()
  }
  switchTab(): void {
    this.generalRegisters.switchTab()
  }
}
