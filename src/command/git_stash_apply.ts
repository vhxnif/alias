#!/usr/bin/env bun
import { Command } from "commander"
import { stashAction } from "../action/git-common-action"

new Command()
  .name("gsu")
  .description("git stash apply")
  .action(async () => {
    await stashAction({
      action: (s: string) => `git stash apply ${s}`,
      isPrint: true,
    })
  })
  .parseAsync()
  .catch((e: unknown) => {
    if (e instanceof Error) {
      printErr(e.message)
      return
    }
  })
