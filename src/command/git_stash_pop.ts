#!/usr/bin/env bun
import { Command } from "commander"
import { execPrint } from "../action/git-common-action"

new Command()
  .name("gsp")
  .description("git stash pop")
  .action(async () => {
    await execPrint(`git stash pop`)
  })
  .parseAsync()
