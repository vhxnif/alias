#!/usr/bin/env bun
import { Command } from "commander"
import { errParse } from "../utils/command-utils"
import { execPrint } from "../utils/platform-utils"

new Command()
  .name("gpl")
  .description("git pull")
  .action(async () => {
    await execPrint("git pull")
  })
  .parseAsync()
  .catch(errParse)
