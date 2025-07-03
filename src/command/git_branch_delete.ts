#!/usr/bin/env bun
import { Command } from "commander"
import { errParse } from "../utils/command-utils"
import {
  branchAction,
  branchHistory,
  gitBranchDelte,
  type Branch,
} from "../action/branch-command"

const bs = await branchHistory()

new Command()
  .name("gbd")
  .description("git branch -D <name>")
  .argument("[name]", "barnch name", "")
  .action(async (name) => {
    await branchAction({
      name,
      command: async (branch: Branch) => {
        bs.delete(branch.name)
        await gitBranchDelte(branch)
      },
    })
  })
  .parseAsync()
  .catch(errParse)
  .finally(() => {
    if (bs) {
      bs.close()
    }
  })
