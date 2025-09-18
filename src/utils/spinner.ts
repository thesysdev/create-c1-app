import ora, { Ora } from 'ora';
import chalk from 'chalk';

type SpinnerColor = 'cyan' | 'green' | 'red' | 'yellow' | 'blue' | 'magenta' | 'white' | 'gray';

class SpinnerManager {
  private spinner: Ora | null = null;

  start(text: string, color: SpinnerColor = 'cyan'): Ora {
    this.spinner = ora({
      text: chalk[color](text),
      spinner: 'dots'
    }).start();
    return this.spinner;
  }

  succeed(text: string): void {
    if (this.spinner) {
      this.spinner.succeed(chalk.green(text));
      this.spinner = null;
    }
  }

  fail(text: string): void {
    if (this.spinner) {
      this.spinner.fail(chalk.red(text));
      this.spinner = null;
    }
  }

  warn(text: string): void {
    if (this.spinner) {
      this.spinner.warn(chalk.yellow(text));
      this.spinner = null;
    }
  }

  info(text: string): void {
    if (this.spinner) {
      this.spinner.info(chalk.blue(text));
      this.spinner = null;
    }
  }

  updateText(text: string, color: SpinnerColor = 'cyan'): void {
    if (this.spinner) {
      this.spinner.text = chalk[color](text);
    }
  }

  stop(): void {
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }
  }
}

export default SpinnerManager;
