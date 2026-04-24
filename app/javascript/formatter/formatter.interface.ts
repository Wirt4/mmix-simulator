//TODO: find out where this is used
export interface SelectionRange {
  start: number
  end: number
}

export interface IFormatter {
  updateLineNumbers(): void
  syncScroll(): void
  handleKeydown(event: KeyboardEvent): void
}
