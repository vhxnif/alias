#!/usr/bin/env bun
import { Command } from "commander"
import { execPrint } from "../action/git-common-action"
import { printErr } from "../utils/common-utils"

new Command()
  .name("gsp")
  .description("git stash pop")
  .action(async () => {
    await execPrint(`git stash pop`)
  })
  .parseAsync()
  .catch((e: unknown) => {
    if (e instanceof Error) {
      printErr(e.message)
      return
    }
  })
