#!/usr/bin/env node
"use strict"

const {displayError} = require("../lib/utils")

const program = require("../lib/program.js").exitOverride()

try {
	program.parse()
} catch (err) {}
