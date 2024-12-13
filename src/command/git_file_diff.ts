#!/usr/bin/env bun
import { Command } from "commander"
import { git } from "../type/context"

new Command()
    .name('gfc')
    .description('git add')
    .action(async () => await git.fileDiff())
    .parseAsync()

