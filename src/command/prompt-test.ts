#!/usr/bin/env bun
import { Command } from "commander"
import { default as cfm } from "../type/page-prompt"

new Command()
  .name("pg")
  .description("page prompt test")
  .action(
    async () =>
      await cfm({
        data: ["a", "b", "c", "d"],
      }).then((it) => console.log(it)),
  )
  .parseAsync()
