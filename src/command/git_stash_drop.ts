#!/usr/bin/env bun
import { Command } from "commander"
import { stashAction, stashDrop } from "../action/stash-command"
import { errParse } from "../utils/common-utils"

new Command()
  .name("gsd")
  .description("git stash drop")
  .action(async () => {
    await stashAction({
      command: stashDrop,
    })
  })
  .parseAsync()
  .catch(errParse)
