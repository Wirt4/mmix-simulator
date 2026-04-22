export interface IEditorController {
  connect(): void
  updateLineNumbers(): void
  syncScroll(): void
  handleKeydown(event: KeyboardEvent): void
}
