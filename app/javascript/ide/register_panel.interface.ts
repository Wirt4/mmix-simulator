export interface IRegisterPanel {
  renderSpecialRegisters(): void
  renderGeneralRegisters(): void
  openAllSubpanels(): void
  switchTab(): void
  toggleSubpanel(event: Event): void
}
