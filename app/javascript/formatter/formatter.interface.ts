export interface IFormatter {
  updateLineNumbers(): void
  syncScroll(): void
  handleKeydown(event: KeyboardEvent): void
}
