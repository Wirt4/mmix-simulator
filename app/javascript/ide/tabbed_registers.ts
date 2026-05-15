import { ITabbedRegisters } from "./tabbed_registers.interface"
import { IRegisters } from "./registers.interface"
import { IRegisterData } from "../register_types.interface"

export class TabbedRegisters implements ITabbedRegisters {
  private tabCount: number
  private allData: IRegisterData[] = []
  constructor(private registers: IRegisters, private selectEl: HTMLSelectElement, private modulus: number) {
    this.tabCount = 0
  }

  render(registerInfo: IRegisterData[]): void {
    this.allData = registerInfo
    const currentPage = parseInt(this.selectEl.value) || 0
    this.renderRegisterPortion(currentPage)
    const pageCount = Math.ceil(registerInfo.length / this.modulus)
    //only re-render if the quantity should change: which is not anticipated
    if (pageCount !== this.tabCount) {
      this.selectEl.innerHTML = ""
      this.populateDropDown(this.selectEl, pageCount)
      this.tabCount = pageCount
    }
  }

  toggle(): void {
    this.registers.toggle()
  }
  open(): void {
    this.registers.open()
  }
  close(): void {
    this.registers.close()
  }

  switchTab(): void {
    const page = parseInt(this.selectEl.value)
    this.renderRegisterPortion(page)
  }

  private populateDropDown(dropdown: HTMLSelectElement, pages: number): void {
    for (let i = 0; i < pages; i++) {
      const option = document.createElement("option")
      option.value = i.toString()
      const startRange = i * this.modulus
      const endRange = startRange + this.modulus - 1
      option.textContent = `${startRange.toString()} - ${endRange.toString()}`
      dropdown.appendChild(option)
    }
  }

  private renderRegisterPortion(index: number) {
    this.registers.render(this.allData.slice(index * this.modulus, (index + 1) * this.modulus))
  }
}
