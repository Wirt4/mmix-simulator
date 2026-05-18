export interface IListing {
  setContents(contents: string): void
  size: number
  default(): void
  toggle(): void
  unlock(): void
  isOpen: boolean
}
