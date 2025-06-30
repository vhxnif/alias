#!/usr/bin/env bun
import { Command } from "commander"
import { errParse } from "../utils/command-utils"
import { execPrint } from "../utils/platform-utils"

new Command()
  .name("gps")
  .description("git push")
  .action(async () => {
    await execPrint("git push")
  })
  .parseAsync()
  .catch(errParse)
