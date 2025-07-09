#!/usr/bin/env bun
import { Command } from "commander"
import {
  batchFileAction,
  fileStaged,
  gitFileRestore,
} from "../action/file-command"
import { errParse } from "../utils/common-utils"

new Command()
  .name("gfd")
  .description("git restore --staged")
  .action(async () => {
    await batchFileAction({
      message: "Select Restore Files:",
      fileFilter: fileStaged,
      command: async (it) => {
        await gitFileRestore(it)
      },
    })
  })
  .parseAsync()
  .catch(errParse)
