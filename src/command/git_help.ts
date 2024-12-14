#!/usr/bin/env bun
import { Command } from "commander"
import { printTable, tableConfig, title } from "../utils/common-utils"
import { color } from "../utils/color-utils"

const key = color.yellow
const value = color.sky

new Command()
    .name('gh')
    .action(() => printTable([
        ['gpl', 'git pull'],
        ['gps', 'git push'],
        ['gbl', 'git branch list'],
        ['gbc', 'git switch <branch>'],
        ['gbn', 'git switch -c <branch>'],
        ['gbm', 'git merge <branch>'],
        ['gbr', 'git rebase <branch>'],
        ['gbd', 'git branch -D <branch>'],
        ['gsl', 'git stash list'],
        ['gsa', 'git stash push -m <message>'],
        ['gsp', 'git stash pop'],
        ['gss', 'git stash show -p <stash>'],
        ['gsu', 'git stash apply <stash>'],
        ['gsd', 'git stash drop <stash>'],
        ['gfa', 'git add <file>'],
        ['gfd', 'git restore --staged <file>'],
        ['gfr', 'git checkout HEAD -- <file>'],
        ['gl', 'git log -n <limit>'],
        ['gs', 'git status'],
        ['gc', 'git commit -m <message>'],
        title(['Alias', 'Core Command'])
    ].map(it => [key(it[0]), value(it[1])]), tableConfig([1, 3])))
    .parseAsync()

