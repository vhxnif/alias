#!/usr/bin/env bun
import { Command } from "commander"
import { git } from "../type/context"

new Command()
    .name('gfr')
    .description('git checkout HEAD -- <file>')
    .action(async () => await git.rollbackFileChanges())
    .parseAsync()

