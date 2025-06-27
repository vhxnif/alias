#!/usr/bin/env bun
import { Command } from "commander"
import { execPrint } from "../action/git-common-action"
import { printErr } from "../utils/common-utils"

new Command()
  .name("gps")
  .description("git push")
  .action(async () => {
    await execPrint("git push")
  })
  .parseAsync()
  .catch((e: unknown) => {
    if (e instanceof Error) {
      printErr(e.message)
      return
    }
  })
