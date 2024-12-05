#!/usr/bin/env bun
import { Command } from "commander"
import { git } from "../type/context"

new Command()
    .name('gps')
    .description('git push')
    .action(async () => await git.push())
    .parseAsync()

