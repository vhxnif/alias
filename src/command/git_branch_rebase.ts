#!/usr/bin/env bun
import { Command } from "commander"
import { errParse } from "../utils/command-utils"
import { branchAction, gitBranchRebase } from "../action/branch-command"

new Command()
  .name("gbr")
  .description("git merge <name>")
  .argument("[name]", "barnch name", "")
  .action(async (name) => {
    await branchAction({
      name,
      command: async (it) => {
        await gitBranchRebase(it)
      },
    })
  })
  .parseAsync()
  .catch(errParse)
