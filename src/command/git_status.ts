#!/usr/bin/env bun
import { Command } from "commander"
import { git } from "../type/context"

new Command()
    .name('gs')
    .description('git status')
    .action(async () => await git.status())
    .parseAsync()

