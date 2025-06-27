#!/usr/bin/env bun
import { Command } from "commander"
import { execPrint } from "../action/git-common-action"
import { printErr } from "../utils/common-utils"

new Command()
  .name("gpl")
  .description("git pull")
  .action(async () => {
    await execPrint("git pull")
  })
  .parseAsync()
  .catch((e: unknown) => {
    if (e instanceof Error) {
      printErr(e.message)
      return
    }
  })
