#!/usr/bin/env bun
import { Command } from "commander"
import {
  fileChanged,
  gitFileCheckout,
  singleFileAction,
} from "../action/file-command"
import { errParse } from "../utils/common-utils"

new Command()
  .name("gfr")
  .description("git checkout HEAD -- <file>")
  .action(async () => {
    await singleFileAction({
      message: "Select Rollback Files:",
      command: async (it) => {
        await gitFileCheckout(it)
      },
      fileFilter: fileChanged,
    })
  })
  .parseAsync()
  .catch(errParse)
