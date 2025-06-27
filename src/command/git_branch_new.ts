#!/usr/bin/env bun
import { Command } from "commander"
import { branchAction, execPrint } from "../action/git-common-action"
import { printErr } from "../utils/common-utils"

new Command()
  .name("gbn")
  .description("git switch -c <name> / git switch -t <name>")
  .argument("<name>", "barnch name")
  .option("-t, --track", "git switch -t", false)
  .action(async (name, option) => {
    if (option.track) {
      await branchAction({
        name,
        listAll: true,
        action: (s) => `git switch -t ${s}`,
        branchFilter: (it) => it.startsWith("remotes") && !it.includes("->"),
      })
      return
    }
    await execPrint(`git switch -c ${name}`)
  })
  .parseAsync()
  .catch((e: unknown) => {
    if (e instanceof Error) {
      printErr(e.message)
      return
    }
  })
