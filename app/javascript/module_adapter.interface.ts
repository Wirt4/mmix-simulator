export interface IModuleWrapper {
  assembleMMIXAL(sourceCode: String): void
  getStdOut(): String
  getStdErr(): String
  simulateMMIXAL(): void
}
