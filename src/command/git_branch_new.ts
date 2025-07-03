#!/usr/bin/env bun
import { Command } from "commander"
import { branchAction, gitSwitch, type Branch } from "../action/branch-command"
import { errParse } from "../utils/command-utils"
import { printCmdLog } from "../utils/common-utils"

new Command()
  .name("gbn")
  .description("git switch -c <name> / git switch -t <name>")
  .argument("<name>", "barnch name")
  .option("-t, --track", "git switch -t", false)
  .action(async (name, { track }) => {
    if (track) {
      await branchAction({
        name,
        all: true,
        command: async (branch: Branch) => {
          await gitSwitch({ branch, args: ["-t"] })
        },
        branchFilter: (branchs: Branch[]) =>
          branchs.filter(
            (it) => it.name.startsWith("remotes") && !it.name.includes("->")
          ),
      })
      return
    }
    printCmdLog(
      await gitSwitch({ branch: { name, isCurrent: true }, args: ["-c"] })
    )
  })
  .parseAsync()
  .catch(errParse)
