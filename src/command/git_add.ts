#!/usr/bin/env bun
import { Command } from "commander"
import { batchFileAction, changedFile } from "../action/git-common-action"

new Command()
  .name("gfa")
  .description("git add")
  .action(async () => {
    await batchFileAction("Select Add Files:", `git add -- `, changedFile)
  })
  .parseAsync()
