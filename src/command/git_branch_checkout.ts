#!/usr/bin/env bun
import type { ShellError } from "bun"
import { Command } from "commander"
import {
  branchAction,
  branchHistory,
  gitSwitch,
  type Branch,
} from "../action/branch-command"
import { errParse } from "../utils/command-utils"
import { tryExec } from "../utils/platform-utils"
import { rule } from "../store/branch-history-store"
import { logcmd } from "../utils/command-log-format"

const bs = await branchHistory()

new Command()
  .name("gbc")
  .description("git switch <name>")
  .argument("[name]", "barnch name", "")
  .option("-f, --force")
  .action(async (name, { force }) => {
    if (name && !force) {
      const branch = bs.query(name).sort((a, b) => rule(b) - rule(a))[0]
      if (branch) {
        const { name, frequency } = branch
        try {
          await tryExec(`git switch ${name}`)
          bs.update(name, frequency)
          return
        } catch (err: unknown) {
          const msg = (err as ShellError).stderr.toString()
          if (msg.startsWith("fatal: invalid reference:")) {
            bs.delete(name)
          }
        }
      }
    }
    await branchAction({
      name,
      command: async (branch: Branch) => {
        bs.addOrUpdate(branch.name)
        logcmd(await gitSwitch({ branch }), "git-switch")
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
