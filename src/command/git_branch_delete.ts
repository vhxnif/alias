#!/usr/bin/env bun
import { Command } from "commander"
import {
  branchAction,
  branchHistory,
  gitBranchDelte,
  type Branch,
} from "../action/branch-command"
import { errParse } from "../utils/common-utils"

const bs = await branchHistory()

new Command()
  .name("gbd")
  .description("git branch -D <name>")
  .argument("[name]", "barnch name", "")
  .action(async (name) => {
    await branchAction({
      name,
      branchFilter: (bs) => bs.filter((it) => !it.isCurrent),
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
