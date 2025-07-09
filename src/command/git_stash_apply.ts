#!/usr/bin/env bun
import { Command } from "commander"
import { stashAction, stashApply } from "../action/stash-command"
import { errParse } from "../utils/common-utils"

new Command()
  .name("gsu")
  .description("git stash apply")
  .action(async () => {
    await stashAction({
      command: stashApply,
    })
  })
  .parseAsync()
  .catch(errParse)
