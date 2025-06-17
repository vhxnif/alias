#!/usr/bin/env bun
import { Command } from "commander"
import { branchAction } from "../action/git-common-action"

new Command()
  .name("gbr")
  .description("git merge <name>")
  .argument("[name]", "barnch name", "")
  .action(async (name) => {
    await branchAction({
      action: (s) => `git rebase ${s}`,
      nameFilter: name,
    })
  })
  .parseAsync()
