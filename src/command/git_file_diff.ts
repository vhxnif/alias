#!/usr/bin/env bun
import { Command } from "commander"
import { errParse } from "../utils/command-utils"
import {
  fileChanged,
  gitFileDiff,
  singleFileAction,
  type File,
} from "../action/file-command"
import { diffFormat } from "../utils/diff-utils"

new Command()
  .name("gfc")
  .description("git diff <file>")
  .action(async () => {
    await singleFileAction({
      message: "Select Changed File:",
      fileFilter: fileChanged,
      command: async (f: File) => {
        const res = await gitFileDiff(f)
        console.log(diffFormat(res))
      },
    })
  })
  .parseAsync()
  .catch(errParse)
