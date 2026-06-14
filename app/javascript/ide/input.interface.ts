export interface IInput {
  getContents(): string
  pad(lines: number): void
  trim(): void
  readonly size: number
  lock(): void
  unlock(): void
  edited: boolean
}
