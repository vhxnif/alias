#!/usr/bin/env bun
import { Command } from "commander"
import { branchAction, branchHisDataPath } from "../action/git-common-action"
import { BranchHistoryStore } from "../store/branch-history-store"
import Database from "bun:sqlite"

const path = await branchHisDataPath()
const branchHistory = new BranchHistoryStore(new Database(path))

new Command()
  .name("gbd")
  .description("git branch -D <name>")
  .argument("[name]", "barnch name", "")
  .action(async (name) => {
    await branchAction({
      action: (s) => `git branch -D ${s}`,
      nameFilter: name,
      beforeExec: (s) => branchHistory.delete(s),
    })
  })
  .parseAsync()
  .finally(() => {
    if (branchHistory) {
      branchHistory.close()
    }
  })
