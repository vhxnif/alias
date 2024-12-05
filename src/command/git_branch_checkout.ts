#!/usr/bin/env bun
import { Command } from "commander"
import { git } from "../type/context"


new Command()
    .name('gbc')
    .description('git switch <name>')
    .argument('[name]', 'barnch name', '')
    .action(async (name) => await git.branchCheckout(name))
    .parseAsync()

