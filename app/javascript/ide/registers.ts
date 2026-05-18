import { EnumRegisterType, IRegisters, IRegisterData } from "./registers.interface"

const TYPE_CONFIG: Record<EnumRegisterType, { label: string; containerClass: string }> = {
  [EnumRegisterType.GENERAL]: { containerClass: "general-container", label: "general-purpose-registers" },
  [EnumRegisterType.SPECIAL]: { containerClass: "special-container", label: "special-registers" },
}

export class Registers implements IRegisters {
  private container: HTMLElement
  private wrapper: HTMLElement
  private arrow: HTMLElement
  private isOpen: boolean

  constructor(div: HTMLElement, type: EnumRegisterType) {
    this.isOpen = false
    const { label, containerClass } = TYPE_CONFIG[type]
    this.container = this.elementSelect(div, "register-group-container")
    this.container.classList.add(containerClass)
    const header = this.elementSelect(div, "register-subpanel-header")
    header.classList.add(label)
    this.wrapper = this.elementSelect(div, "register-subpanel-body")
    this.arrow = this.elementSelect(div, "spin-arrow")
  }

  render(registers: IRegisterData[]): void {
    const divs: string[] = new Array<string>(registers.length)
    for (let i = 0; i < registers.length; i++) {
      const zeroRegister = "#0000000000000000"
      const { id, value, description } = registers[i]
      const activeClass = value !== zeroRegister ? " register-row--active" : ""
      const tooltip = description ? ` data-tooltip="${description}"` : ""

      const openDiv = `<div class="register-row${activeClass}"${tooltip}>`
      const identifier = `<span class="register-name">${id}</span>`
      const displayValue = `<span class="register-hex">${value}</span>`

      divs[i] = [openDiv, identifier, displayValue, "</div>"].join("")
    }
    this.container.innerHTML = divs.join("")
    this.attachTooltipListeners(this.container.querySelectorAll<HTMLElement>(".register-row[data-tooltip]"))
  }

  toggle(): void {
    this.wrapper.classList.toggle("register-subpanel-body--collapsed")
    this.arrow.classList.toggle("spin-arrow--open")
    this.isOpen = !this.isOpen
  }

  open(): void {
    this.toggleToState(this.isOpen)
  }

  close(): void {
    this.toggleToState(!this.isOpen)
  }

  private toggleToState(targetState: boolean) {
    if (targetState) return
    this.toggle()
  }

  private elementSelect(parent: HTMLElement, childName: string): HTMLElement {
    const child = parent.querySelector<HTMLElement>(`.${childName}`)
    if (!child) throw new Error(`Missing ${childName} element`)
    return child
  }

  private attachTooltipListeners(registerRows: NodeList): void {
    const toolTip = new ToolTip()

    registerRows.forEach(row => {
      if (!(row instanceof HTMLElement)) return
      const txt = row.dataset.tooltip
      if (!txt) return
      row.addEventListener("mouseenter", () => { toolTip.addDiv(row, txt) })
      row.addEventListener("mouseleave", () => { toolTip.removeDiv() })
    })
  }
}

class ToolTip {
  private tempDiv: HTMLElement | null = null

  addDiv(row: HTMLElement, txt: string): void {
    const div = document.createElement("div")
    div.textContent = txt
    // set class before appending so styles apply before measuring
    div.className = "register-tooltip"
    document.body.appendChild(div)
    const { top, left } = this.size(div, row)
    div.style.top = `${top.toString()}px`
    div.style.left = `${left.toString()}px`
    this.tempDiv = div
  }
  removeDiv(): void {
    this.tempDiv?.remove()
    this.tempDiv = null
  }

  private size(div: HTMLElement, row: HTMLElement, leftMargin = 8): { top: number, left: number } {
    const result = { top: 0, left: 0 }
    if (!document.contains(div)) return result
    const rect = row.getBoundingClientRect()
    result.top = this.calculateTopCoord(div, rect)
    // calculate the left coordinate (with a margin to avoid butt edges)
    result.left = rect.left - div.offsetWidth - leftMargin
    return result
  }

  private calculateTopCoord(div: HTMLElement, rect: DOMRect): number {
    let result = rect.top
    // shift result down to vertical midpoint
    result += rect.height / 2
    // back it up by half the div's height
    result -= div.offsetHeight / 2
    return result
  }
}
