export interface IModuleAdapter {
  assembleMMIXAL(sourceCode: string): void
  getStdOut(): string
  getStdErr(): string
  simulateMMIX(): void
}
