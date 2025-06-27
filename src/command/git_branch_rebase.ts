#!/usr/bin/env bun
import { Command } from "commander"
import { branchAction } from "../action/git-common-action"
import { printErr } from "../utils/common-utils"

new Command()
  .name("gbr")
  .description("git merge <name>")
  .argument("[name]", "barnch name", "")
  .action(async (name) => {
    await branchAction({
      name,
      action: (s) => `git rebase ${s}`,
    })
  })
  .parseAsync()
  .catch((e: unknown) => {
    if (e instanceof Error) {
      printErr(e.message)
      return
    }
  })
