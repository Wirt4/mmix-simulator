export interface IListing {
  setContents(contents: string): void
  default(): void
  toggle(): void
  unlock(): void
  isOpen: boolean
}
