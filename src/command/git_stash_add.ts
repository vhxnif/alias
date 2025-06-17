#!/usr/bin/env bun
import { Command } from "commander"
import { execPrint } from "../action/git-common-action"

new Command()
  .name("gsa")
  .argument("<name>")
  .description("git stash push -m")
  .action(async (name) => {
    await execPrint(`git stash push -m ${name}`)
  })
  .parseAsync()
