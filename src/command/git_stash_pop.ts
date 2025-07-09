#!/usr/bin/env bun
import { Command } from "commander"
import { stashPop } from "../action/stash-command"
import { errParse } from "../utils/common-utils"

new Command()
  .name("gsp")
  .description("git stash pop")
  .action(async () => {
    await stashPop()
  })
  .parseAsync()
  .catch(errParse)
