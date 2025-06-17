#!/usr/bin/env bun
import { Command } from "commander"
import {
  diffFormat,
  singleFileAction,
  statusShortLog,
} from "../action/git-common-action"

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
