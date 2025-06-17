#!/usr/bin/env bun
import { Command } from "commander"
import { execPrint } from "../action/git-common-action"

new Command()
  .name("gps")
  .description("git push")
  .action(async () => {
    await execPrint("git push")
  })
  .parseAsync()
