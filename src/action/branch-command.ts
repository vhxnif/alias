import path from "path"
import { select } from "@inquirer/prompts"
import { configPath, exec } from "../utils/platform-utils"
import type { Choice } from "../utils/inquirer-utils"
import { isEmpty } from "../utils/common-utils"
import Database from "bun:sqlite"
import { BranchHistoryStore } from "../store/branch-history-store"

// ---- branch action history ---- //
async function branchHisDataPath() {
  const dir = (await exec("pwd")).trim()
  return `${configPath()}${path.sep}branch_his_${dir
    .replaceAll(path.sep, "_")
    .replaceAll(":", "")}.sqlite`
}

async function branchHistory(): Promise<BranchHistoryStore> {
  const path = await branchHisDataPath()
  return new BranchHistoryStore(new Database(path))
}

// ---- git branch ---- //
type Branch = {
  name: string
  isCurrent: boolean
}
type BranchListArg = {
  all?: boolean
  name?: string
}

async function branchList({ name, all }: BranchListArg): Promise<Branch[]> {
  const localBranchList = () => `git branch -l ${name ? `'*${name}*'` : ""}`
  let cmd = localBranchList()
  if (all) {
    cmd = `git branch -a`
  }
  const execText = await exec(cmd)
  if (!execText) {
    throw Error("No Branch Matched.")
  }
  const matched = execText
    .split("\n")
    .filter((it) => (name ? it.includes(name) : it))
  if (isEmpty(matched)) {
    throw Error("No Branch Matched.")
  }
  return matched.map((it) => {
    const isCurrent = it.startsWith("*")
    const name = (isCurrent ? it.replace("*", "") : it).trim()
    return {
      isCurrent,
      name,
    } as Branch
  })
}

// ---- git switch ---- //
type GitSwitchArg = {
  branch: Branch
  args?: string[]
}

async function gitSwitch({ branch, args }: GitSwitchArg): Promise<string> {
  return await exec(`git switch ${args ? args.join(" ") : ""} ${branch.name}`)
}

// ---- git branch -D ---- //
async function gitBranchDelte({ name }: Branch): Promise<string> {
  return await exec(`git branch -D ${name}`)
}

// ---- git merge <branch> ---- //
async function gitBranchMerge({ name }: Branch): Promise<string> {
  return await exec(`git merge ${name}`)
}

// ---- git rebase <branch> ---- //
async function gitBranchRebase({ name }: Branch): Promise<string> {
  return await exec(`git rebase ${name}`)
}

// ---- interation ---- //
type BranchActionArg = BranchListArg & {
  command: (branch: Branch) => Promise<void>
  branchSort?: (branch: Branch[]) => Branch[]
  branchFilter?: (branch: Branch[]) => Branch[]
}

function branchChoices(branchs: Branch[]): Choice<Branch>[] {
  if (isEmpty(branchs)) {
    throw Error("Branch Missing.")
  }
  return branchs.map((it) => ({
    name: it.name,
    value: it,
  }))
}

async function branchAction({
  all,
  name,
  command,
  branchFilter,
  branchSort,
}: BranchActionArg): Promise<void> {
  const branchs = await branchList({ all, name })
    .then((it) => (branchSort ? branchSort(it) : it))
    .then((it) => (branchFilter ? branchFilter(it) : it))
  const choices = branchChoices(branchs)
  await select({
    message: "Select Branch:",
    choices,
  }).then(async (it) => await command(it))
}

export {
  type Branch,
  type GitSwitchArg,
  branchHistory,
  branchList,
  branchAction,
  gitSwitch,
  gitBranchDelte,
  gitBranchMerge,
  gitBranchRebase,
}
