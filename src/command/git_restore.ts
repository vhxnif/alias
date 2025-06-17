#!/usr/bin/env bun
import { Command } from "commander"
import { batchFileAction, stagedFile } from "../action/git-common-action"

new Command()
  .name("gfd")
  .description("git restore --staged")
  .action(async () => {
    await batchFileAction(
      "Select Restore Files:",
      "git restore --staged",
      stagedFile
    )
  })
  .parseAsync()
