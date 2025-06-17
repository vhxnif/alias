#!/usr/bin/env bun
import { Command } from "commander"
import { changedFile, singleFileAction } from "../action/git-common-action"

new Command()
  .name("gfr")
  .description("git checkout HEAD -- <file>")
  .action(async () => {
    await singleFileAction({
      message: "Select Rollback Files:",
      command: "git checkout HEAD --",
      logs: changedFile,
    })
  })
  .parseAsync()
