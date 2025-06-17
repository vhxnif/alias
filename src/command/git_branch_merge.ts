#!/usr/bin/env bun
import { Command } from "commander"
import { branchAction, branchHisDataPath } from "../action/git-common-action"
import {
  BranchHistory,
  BranchHistoryStore,
} from "../store/branch-history-store"
import Database from "bun:sqlite"
import { rule } from "../utils/bus-utils"

const path = await branchHisDataPath()
const branchHistory = new BranchHistoryStore(new Database(path))

const sortBranch = (branchNames: string[], name: string) => {
  const his = branchHistory.query(name)
  const res = branchNames
    .map((it) => {
      const h = his.find((i) => i.name === it)
      if (h) {
        return h
      }
      return {
        name: it,
        lastSwitchTime: 0,
        frequency: 0,
      } as BranchHistory
    })
    .sort((a, b) => rule(b) - rule(a))
    .map((it) => it.name)
  return res
}

new Command()
  .name("gbm")
  .description("git merge <name>")
  .argument("[name]", "barnch name", "")
  .action(async (name) => {
    await branchAction({
      action: (s) => `git merge ${s}`,
      nameFilter: name,
      branchSort: (s) => sortBranch(s, name),
    })
  })
  .parseAsync()
  .finally(() => {
    if (branchHistory) {
      branchHistory.close()
    }
  })
