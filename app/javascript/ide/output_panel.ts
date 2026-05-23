import { IOutputPanel } from './output_panel.interface'

export default class OutputPanel implements IOutputPanel {
  constructor(private outputEl: HTMLTextAreaElement) {
    this.outputEl.value = ""
  }
  clear(): void {
    this.outputEl.value = ""
  }
  setValue(text: string): void {
    this.outputEl.value = text
  }

  hide(): void {
    this.outputEl.hidden = true
  }

  show(): void { }
}
