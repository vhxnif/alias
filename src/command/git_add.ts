#!/usr/bin/env bun
import { Command } from "commander"
import {
  batchFileAction,
  fileChanged,
  gitFileAdd,
} from "../action/file-command"
import { errParse } from "../utils/common-utils"

new Command()
  .name("gfa")
  .description("git add")
  .action(async () => {
    await batchFileAction({
      fileFilter: fileChanged,
      command: async (it) => {
        await gitFileAdd(it)
      },
    })
  })
  .parseAsync()
  .catch(errParse)
