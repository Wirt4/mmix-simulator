import { IOutputPanel } from './output_panel.interface'

export default class OutputPanel implements IOutputPanel {
  constructor(private readonly outputEl: HTMLTextAreaElement) {}

  setValue(text: string): void {
    this.outputEl.value = text
  }
}
