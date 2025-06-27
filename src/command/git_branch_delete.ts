#!/usr/bin/env bun
import { Command } from "commander"
import { branchAction, branchHisDataPath } from "../action/git-common-action"
import { BranchHistoryStore } from "../store/branch-history-store"
import Database from "bun:sqlite"
import { printErr } from "../utils/common-utils"

const path = await branchHisDataPath()
const branchHistory = new BranchHistoryStore(new Database(path))

new Command()
  .name("gbd")
  .description("git branch -D <name>")
  .argument("[name]", "barnch name", "")
  .action(async (name) => {
    await branchAction({
      name,
      action: (s) => `git branch -D ${s}`,
      beforeExec: (s) => branchHistory.delete(s),
    })
  })
  .parseAsync()
  .catch((e: unknown) => {
    if (e instanceof Error) {
      printErr(e.message)
      return
    }
  })
  .finally(() => {
    if (branchHistory) {
      branchHistory.close()
    }
  })
