#!/usr/bin/env bun
import { Command } from "commander"
import { errParse } from "../utils/command-utils"
import {
  fileChanged,
  gitFileCheckout,
  singleFileAction,
} from "../action/file-command"

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
