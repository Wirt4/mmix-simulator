export interface SelectionRange {
  start: number
  end: number
}

export interface IEditor {
  updateLineNumbers(): void
  syncScroll(): void
  handleKeydown(event: KeyboardEvent): void
}
