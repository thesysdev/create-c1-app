import chalk from 'chalk'

class Logger {
  private _debugMode: boolean

  constructor (debug = false) {
    this._debugMode = debug || process.env.CREATE_C1_APP_DEBUG === 'true'
  }

  info (message: string): void {
    console.log(chalk.blue('ℹ'), message)
  }

  success (message: string): void {
    console.log(chalk.green('✓'), message)
  }

  warning (message: string): void {
    console.log(chalk.yellow('⚠'), message)
  }

  error (message: string): void {
    console.log(chalk.red('✗'), message)
  }

  debug (message: string): void {
    if (this._debugMode) {
      console.log(chalk.gray('🐛'), chalk.gray(message))
    }
  }

  step (stepNumber: number, totalSteps: number, message: string): void {
    const stepIndicator = chalk.cyan(`[${stepNumber}/${totalSteps}]`)
    console.log(stepIndicator, message)
  }

  newLine (): void {
    console.log()
  }

  get debugMode (): boolean {
    return this._debugMode
  }

  set debugMode (debug: boolean) {
    this._debugMode = debug
  }
}

export default new Logger()
