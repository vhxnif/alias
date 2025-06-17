#!/usr/bin/env bun
import { Command } from "commander"
import { execPrint } from "../action/git-common-action"

new Command()
  .name("gpl")
  .description("git pull")
  .action(async () => {
    await execPrint("git pull")
  })
  .parseAsync()
