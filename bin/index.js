#!/usr/bin/env node
"use strict"

const {displayError} = require("../lib/utils")

const program = require("../lib/program.js")

try {
	program.parse()
} catch (err) {
	displayError(err)
}
