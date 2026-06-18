export interface IOutputPanel {
  getValue(): string
  setValue(text: string): void
  clear(): void
  hide(): void
  show(): void
}
