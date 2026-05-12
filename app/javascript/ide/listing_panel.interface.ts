export interface IListingPanel {
  readonly isCollapsed: boolean
  collapse(): void
  expand(): void
  setListing(text: string): void
  setUnpaddedSource(source: string): void
  getSource(): string
  applyPadding(): void
  removePadding(): void
  removePaddingForSave(): void
  handleSourceEdited(): boolean
  enableToggle(): void
  disableToggle(): void
}
