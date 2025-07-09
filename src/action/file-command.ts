import { checkbox, select } from "@inquirer/prompts"
import { cleanFilePath, isEmpty } from "../utils/common-utils"
import type { Choice } from "../utils/inquirer-utils"
import { exec, terminal } from "../utils/platform-utils"

async function pwd(): Promise<string> {
  return await exec("pwd")
}

// ---- git status ---- //
type File = {
  stageStatus: string
  workStatus: string
  filePath: string
}

/**
 X          Y     Meaning
-------------------------------------------------
	     [AMD]   not updated
M        [ MTD]  updated in index
T        [ MTD]  type changed in index
A        [ MTD]  added to index
D                deleted from index
R        [ MTD]  renamed in index
C        [ MTD]  copied in index
[MTARC]          index and work tree matches
[ MTARC]    M    work tree changed since index
[ MTARC]    T    type changed in work tree since index
[ MTARC]    D    deleted in work tree
	        R    renamed in work tree
	        C    copied in work tree
-------------------------------------------------
D           D    unmerged, both deleted
A           U    unmerged, added by us
U           D    unmerged, deleted by them
U           A    unmerged, added by them
D           U    unmerged, deleted by us
A           A    unmerged, both added
U           U    unmerged, both modified
-------------------------------------------------
?           ?    untracked
!           !    ignored
-------------------------------------------------
*/
async function fileStatus(): Promise<File[]> {
  const cmd = "git status -sunormal"
  const res = await exec(cmd)
  if (!res) {
    throw Error(`No Changes`)
  }
  const lines = res.split("\n").filter((l) => !isEmpty(l))
  if (isEmpty(lines)) {
    return []
  }
  return lines.map((it) => ({
    stageStatus: it.substring(0, 1),
    workStatus: it.substring(1, 2),
    filePath: it.substring(3),
  }))
}

function fileIgnore({ stageStatus, workStatus }: File): boolean {
  return stageStatus === "!" && workStatus === "!"
}

function fileUntracked({ stageStatus, workStatus }: File): boolean {
  return stageStatus === "?" && workStatus === "?"
}

function fileChanged({ workStatus }: File): boolean {
  return ![" ", "!"].includes(workStatus)
}

function fileStaged({ stageStatus }: File): boolean {
  return ![" ", "!", "?"].includes(stageStatus)
}

// ---- git add ---- //
async function gitFileAdd(files: File[]): Promise<string> {
  const filePaths = files
    .filter(fileChanged)
    .map((it) => it.filePath)
    .join(" ")
  return await exec(`git add -- ${filePaths}`)
}

// ---- git checkout HEAD -- <file> ---- //
async function gitFileCheckout({ filePath }: File): Promise<string> {
  return await exec(`git checkout HEAD -- ${filePath}`)
}

// ---- git diff <fill> ---- //
async function gitFileDiff({ filePath }: File): Promise<string> {
  return await exec(`git diff ${filePath}`)
}

// --- git restore --staged <file> ---- //

async function gitFileRestore(files: File[]): Promise<string> {
  return await exec(
    `git restore --staged ${files.map((it) => it.filePath).join(" ")}`,
  )
}

// ---- interation ---- //
type FileActionArg = {
  message?: string
  fileFilter: (file: File) => boolean
}
type BatchFileActionArg = FileActionArg & {
  command: (file: File[]) => Promise<void>
}

type SingleFielActionArg = FileActionArg & {
  command: (file: File) => Promise<void>
}

function fileChoices(files: File[]): Choice<File>[] {
  if (isEmpty(files)) {
    throw Error(`File Missing.`)
  }
  return files.map((it) => ({
    name: cleanFilePath(it.filePath, terminal.column, false),
    value: it,
  }))
}

async function batchFileAction({
  message,
  command,
  fileFilter,
}: BatchFileActionArg): Promise<void> {
  const choices = await fileStatus().then((it) =>
    fileChoices(it.filter(fileFilter)),
  )
  await checkbox({
    message: message ? message : "Select File:",
    choices,
  }).then(async (answer) => {
    if (isEmpty(answer)) {
      return
    }
    await command(answer)
  })
}

async function singleFileAction({
  message,
  command,
  fileFilter,
}: SingleFielActionArg): Promise<void> {
  const choices = await fileStatus().then((it) =>
    fileChoices(it.filter(fileFilter)),
  )
  await select({
    message: message ? message : "Select File:",
    choices,
  }).then(async (answer) => {
    if (!answer) {
      return
    }
    await command(answer)
  })
}

export {
  type File,
  pwd,
  fileStatus,
  fileIgnore,
  fileUntracked,
  fileChanged,
  fileStaged,
  batchFileAction,
  singleFileAction,
  gitFileAdd,
  gitFileCheckout,
  gitFileDiff,
  gitFileRestore,
}
