export interface IModuleAdapter {
  assembleMMIXAL(sourceCode: string): boolean
  getStdOut(): string
  getStdErr(): string
  simulateMMIX(): void
}
