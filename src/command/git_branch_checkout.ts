#!/usr/bin/env bun
import type { ShellError } from "bun"
import { Command } from "commander"
import {
  branchAction,
  branchHistory,
  gitSwitch,
  type Branch,
} from "../action/branch-command"
import { tryExec } from "../utils/platform-utils"
import { rule } from "../store/branch-history-store"
import { logcmd } from "../utils/command-log-format"
import { errParse } from "../utils/common-utils"
import { Spinner } from "../utils/ora-utils"
import { color } from "../utils/color-utils"

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
        const spinner = new Spinner("Switching branch...").start()
        const { name, frequency } = branch
        try {
          const result = await tryExec(`git switch ${name}`)
          spinner.succeed(`Switched to branch: ${color.mauve.bold(name)}`)
          logcmd(result, "git-switch")
          bs.update(name, frequency)
          return
        } catch (err: unknown) {
          const msg = (err as ShellError).stderr.toString()
          if (msg.startsWith("fatal: invalid reference:")) {
            bs.delete(name)
          }
        } finally {
          spinner.stop()
        }
      }
    }
    await branchAction({
      name,
      command: async (branch: Branch) => {
        const spinner = new Spinner(
          `Switching to ${color.mauve.bold(branch.name)}...`
        ).start()
        try {
          bs.addOrUpdate(branch.name)
          const result = await gitSwitch({ branch })
          spinner.succeed(
            `Switched to branch: ${color.mauve.bold(branch.name)}`
          )
          logcmd(result, "git-switch")
        } finally {
          spinner.stop()
        }
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
