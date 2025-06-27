#!/usr/bin/env bun
import { Command } from "commander"
import { execPrint } from "../action/git-common-action"
import { printErr } from "../utils/common-utils"

new Command()
  .name("gsa")
  .argument("<name>")
  .description("git stash push -m")
  .action(async (name) => {
    await execPrint(`git stash push -m ${name}`)
  })
  .parseAsync()
  .catch((e: unknown) => {
    if (e instanceof Error) {
      printErr(e.message)
      return
    }
  })
