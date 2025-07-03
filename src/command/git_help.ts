#!/usr/bin/env bun
import { Command } from "commander"
import { color, tableTitle } from "../utils/color-utils"
import { printTable, tableConfig } from "../utils/table-utils"

const key = color.yellow
const value = color.sky

new Command()
  .name("gh")
  .action(() =>
    printTable(
      [
        tableTitle(["Alias", "Core Command"]),
        ["gpl", "git pull"],
        ["gps", "git push"],
        ["gbl", "git branch list"],
        ["gbc", "git switch <branch>"],
        ["gbn", "git switch -c <branch>"],
        ["gbm", "git merge <branch>"],
        ["gbr", "git rebase <branch>"],
        ["gbd", "git branch -D <branch>"],
        ["gsl", "git stash list"],
        ["gsa", "git stash push -m <message>"],
        ["gsp", "git stash pop"],
        ["gss", "git stash show -p <stash>"],
        ["gsu", "git stash apply <stash>"],
        ["gsd", "git stash drop <stash>"],
        ["gfa", "git add <file>"],
        ["gfd", "git restore --staged <file>"],
        ["gfr", "git checkout HEAD -- <file>"],
        ["gfc", "git diff <file>"],
        ["gl", "git log -n <limit>"],
        ["gs", "git stash"],
        ["gc", "git commit -m <message>"],
        ["gcs", "git commit summary"],
        ["gts", "git show <tag>"],
        tableTitle(["Alias", "Core Command"]),
      ].map((it) => [key(it[0]), value(it[1])]),
      tableConfig({ cols: [1, 3] })
    )
  )
  .parseAsync()
