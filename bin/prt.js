#!/usr/bin/env node
var main = require("../package.json").main;
require("../" + main)(process.argv.slice(1));
console.log("🐕 Woof!");
