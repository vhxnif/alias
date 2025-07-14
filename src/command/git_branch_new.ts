#!/usr/bin/env bun
import { Command } from "commander"
import { branchAction, gitSwitch, type Branch } from "../action/branch-command"
import { errParse, printCmdLog } from "../utils/common-utils"
import { logcmd } from "../utils/command-log-format"

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
          logcmd(await gitSwitch({ branch, args: ["-t"] }), 'git-switch') 
        },
        branchFilter: (branchs: Branch[]) =>
          branchs.filter(
            (it) => it.name.startsWith("remotes") && !it.name.includes("->")
          ),
      })
      return
    }
    logcmd(await gitSwitch({ branch: { name, isCurrent: true }, args: ["-c"] }), 'git-switch')
  })
  .parseAsync()
  .catch(errParse)
