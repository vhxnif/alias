#!/usr/bin/env bun
import { Command } from "commander"
import {
  branchAction,
  branchHistory,
  gitBranchMerge,
  type Branch,
} from "../action/branch-command"
import { BranchHistory, rule } from "../store/branch-history-store"
import { errParse } from "../utils/common-utils"

const bs = await branchHistory()

type BranchInfo = Branch & BranchHistory

const sortBranch = (branchs: Branch[], name?: string) => {
  if (!name) {
    return branchs
  }
  const his = bs.query(name)
  const res = branchs
    .map((it) => {
      const h = his.find((i) => i.name === it.name)
      if (h) {
        return h as BranchInfo
      }
      return {
        name: it.name,
        lastSwitchTime: 0,
        frequency: 0,
      } as BranchInfo
    })
    .sort((a, b) => rule(b) - rule(a))
  return res
}

new Command()
  .name("gbm")
  .description("git merge <name>")
  .argument("[name]", "barnch name")
  .action(async (name) => {
    await branchAction({
      name,
      command: async (b: Branch) => {
        console.log(await gitBranchMerge(b))
      },
      branchSort: (branchs: Branch[]) => sortBranch(branchs, name),
    })
  })
  .parseAsync()
  .catch(errParse)
  .finally(() => {
    if (bs) {
      bs.close()
    }
  })
