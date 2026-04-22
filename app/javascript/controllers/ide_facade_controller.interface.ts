export interface IIDEFacadeController {
  connect(): void
  updateLineNumbers(): void
  syncScroll(): void
  handleKeydown(event: KeyboardEvent): void
}
