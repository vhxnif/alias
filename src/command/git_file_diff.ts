#!/usr/bin/env bun
import { Command } from "commander"
import {
  fileChanged,
  gitFileDiff,
  singleFileAction,
  type File,
} from "../action/file-command"
import { errParse, isEmpty } from "../utils/common-utils"
import { gitDiffParse } from "../utils/git-diff-format"

new Command()
  .name("gfc")
  .description("git diff <file>")
  .action(async () => {
    await singleFileAction({
      message: "Select Changed File:",
      fileFilter: fileChanged,
      command: async (f: File) => {
        const res = await gitFileDiff(f)
        if (isEmpty(res.trim())) {
          throw Error(`File [${f.filePath}] Not Trace.`)
        }
        gitDiffParse(res).forEach((it) => console.log(it))
      },
    })
  })
  .parseAsync()
  .catch(errParse)
