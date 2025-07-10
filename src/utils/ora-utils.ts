import type { Ora } from "ora"
import ora from "ora"

export class Spinner {
  private readonly spinner: Ora
  private isStop: boolean = false
  constructor(init: string) {
    this.spinner = ora(init)
  }

  start(): Spinner {
    this.spinner.start()
    return this
  }

  stop(): void {
    if (this.isStop) {
      return
    }
    this.spinner.stop()
    this.toStop()
  }

  private toStop(): void {
    this.isStop = true
  }

  succeed(message: string): void {
    if (this.isStop) {
      return
    }
    this.spinner.succeed(message)
    this.toStop()
  }

  changeText(message: string): void {
    this.spinner.text = message
  }
}
