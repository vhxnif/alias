#!/usr/bin/env bun
import { Command } from "commander"
import { stashAction, stashShow } from "../action/stash-command"

new Command()
  .name("gss")
  .description("git stash show")
  .action(async () => {
    await stashAction({
      command: stashShow,
    })
  })
  .parseAsync()
