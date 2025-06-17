#!/usr/bin/env bun
import type { ShellError } from "bun"
import Database from "bun:sqlite"
import { Command } from "commander"
import { branchAction, branchHisDataPath } from "../action/git-common-action"
import { BranchHistoryStore } from "../store/branch-history-store"
import { tryExec } from "../utils/platform-utils"
import { rule } from "../utils/bus-utils"

const path = await branchHisDataPath()
const branchHistory = new BranchHistoryStore(new Database(path))

new Command()
  .name("gbc")
  .description("git switch <name>")
  .argument("[name]", "barnch name", "")
  .option("-f, --force")
  .action(async (name, option) => {
    if (name && !option.force) {
      const branch = branchHistory
        .query(name)
        .sort((a, b) => rule(b) - rule(a))[0]
      if (branch) {
        try {
          await tryExec(`git switch ${branch.name}`)
          branchHistory.update(branch.name, branch.frequency)
          return
        } catch (err: unknown) {
          const msg = (err as ShellError).stderr.toString()
          if (msg.startsWith("fatal: invalid reference:")) {
            branchHistory.delete(branch.name)
          }
        }
      }
    }
    await branchAction({
      action: (s) => `git switch ${s}`,
      nameFilter: name,
      beforeExec: (str) => {
        branchHistory.addOrUpdate(str)
      },
    })
  })
  .parseAsync()
  .finally(() => {
    if (branchHistory) {
      branchHistory.close()
    }
  })
