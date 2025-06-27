#!/usr/bin/env bun
import { Command } from "commander"
import {
  diffFormat,
  singleFileAction,
  statusShortLog,
} from "../action/git-common-action"
import { printErr } from "../utils/common-utils"

new Command()
  .name("gfc")
  .description("git diff <file>")
  .action(async () => {
    await singleFileAction({
      message: "Select Changed File:",
      command: "git diff",
      logs: statusShortLog,
      isPrint: true,
      format: diffFormat,
    })
  })
  .parseAsync()
  .catch((e: unknown) => {
    if (e instanceof Error) {
      printErr(e.message)
      return
    }
  })
