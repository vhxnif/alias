#!/usr/bin/env bun
import { Command } from "commander"
import { git } from "../type/context"

new Command()
    .name('gfc')
    .description('git diff <file>')
    .action(async () => await git.fileDiff())
    .parseAsync()

