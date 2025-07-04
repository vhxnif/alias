#!/usr/bin/env bun
import { Command } from "commander"
import { color } from "../utils/color-utils"
import { format } from "../utils/command-log-format"
import { errParse } from "../utils/command-utils"
import { exec } from "../utils/platform-utils"

function print(log: string): void {
  const lines = log.split("\n")
  let foramtMatched = false
  format["git-pull"].forEach((it) => {
    if (it.match(lines)) {
      it.print(lines)
      foramtMatched = true
      return
    }
  })
  if (!foramtMatched) {
    console.log(color.yellow(log))
  }
}

new Command()
  .name("gpl")
  .description("git pull")
  .action(async () => {
    print(await exec("git pull"))
  })
  .parseAsync()
  .catch(errParse)
