import { select } from "@inquirer/prompts"
import { isEmpty, lines, printErr } from "../utils/common-utils"
import { exec, execPrint } from "../utils/platform-utils"

type GitStash = {
  reflog: string
  reflogSubject: string
  anthor: string
  createTime: string
}

async function stashList(): Promise<GitStash[]> {
  const command = `git stash list --pretty=format:'%gd│%gs│%an│%cr'`
  const logs = await exec(command)
  if (isEmpty(logs)) {
    return []
  }
  return lines(logs)
    .map((it) => it.split("│"))
    .map((it) => ({
      reflog: it[0],
      reflogSubject: it[1],
      anthor: it[2],
      createTime: it[3],
    }))
}

type StashActionArg = {
  message?: string
  command: (stash: GitStash) => Promise<void>
}

async function stashAction({
  message,
  command,
}: StashActionArg): Promise<void> {
  const stashInfos = await stashList()
  if (isEmpty(stashInfos)) {
    printErr("Stash Is Empty.")
    return
  }
  const choices = stashInfos.map((it) => ({
    name: `${it.reflog} ${it.reflogSubject}`,
    value: it,
  }))
  const v = await select({
    message: message ? message : "Select Stassh:",
    choices,
  })
  await command(v)
}

async function stashAdd(name: string): Promise<void> {
  return await execPrint(`git stash push -m ${name}`)
}

async function stashApply({ reflog }: GitStash): Promise<void> {
  return await execPrint(`git stash apply ${reflog}`)
}

async function stashDrop({ reflog }: GitStash): Promise<void> {
  return await execPrint(`git stash drop ${reflog}`)
}

async function stashPop(): Promise<void> {
  return await execPrint(`git stash pop`)
}

async function stashShow({ reflog }: GitStash): Promise<void> {
  return await execPrint(`git stash show -p ${reflog}`)
}

export {
  stashList,
  stashAdd,
  stashAction,
  stashApply,
  stashDrop,
  stashPop,
  stashShow,
}
