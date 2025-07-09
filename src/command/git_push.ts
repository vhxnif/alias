#!/usr/bin/env bun
import { Command } from "commander"
import { execPrint } from "../utils/platform-utils"
import { errParse } from "../utils/common-utils"

new Command()
  .name("gps")
  .description("git push")
  .action(async () => {
    await execPrint("git push")
  })
  .parseAsync()
  .catch(errParse)
