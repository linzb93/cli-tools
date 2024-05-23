#!/usr/bin/env node

import { Command } from "commander";
import ip from "../commands/ip";
const program = new Command();
program.version("2.0.0");

program.command("ip").action(() => {
  ip();
});
program.parse(process.argv);
