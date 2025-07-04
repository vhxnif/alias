#!/usr/bin/env bun
import { Command } from "commander"
import { color } from "../utils/color-utils"
import { format } from "../utils/command-log-format"
import { errParse } from "../utils/command-utils"
import { exec } from "../utils/platform-utils"

const { green, yellow } = color

function print(log: string): void {
  if ("Already up to date." === log) {
    console.log(green(log))
    return
  }
  const lines = log.split("\n")
  format["git-pull"].forEach((it) => {
    if (it.match(lines)) {
      it.print(lines)
      return
    }
  })
  console.log(yellow(log))
}

new Command()
  .name("gpl")
  .description("git pull")
  .action(async () => {
    print(await exec("git pull"))
  })
  .parseAsync()
  .catch(errParse)
