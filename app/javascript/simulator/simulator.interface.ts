export interface ISimulator {
  init(): Promise<void>
  runUserProgram(): void
}
