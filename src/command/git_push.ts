#!/usr/bin/env bun
import { Command } from "commander"
import { execPrint } from "../utils/platform-utils"
import { errParse } from "../utils/common-utils"

new Command()
  .name("gps")
  .description("git push")
  .argument('[remote]', 'remote name')
  .action(async (remote) => {
    await execPrint(`git push ${remote ?? 'origin'}`)
  })
  .parseAsync()
  .catch(errParse)
