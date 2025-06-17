#!/usr/bin/env bun
import { Command } from "commander"
import { branchAction, execPrint } from "../action/git-common-action"

new Command()
  .name("gbn")
  .description("git switch -c <name> / git switch -t <name>")
  .argument("<name>", "barnch name")
  .option("-t, --track", "git switch -t", false)
  .action(async (name, option) => {
    if (option.track) {
      await branchAction({
        action: (s) => `git switch -t ${s}`,
        nameFilter: name,
        listOption: "-a",
        branchFilter: (it) => it.startsWith("remotes") && !it.includes("->"),
      })
      return
    }
    await execPrint(`git switch -c ${name}`)
  })
  .parseAsync()
