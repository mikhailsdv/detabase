#!/usr/bin/env node
"use strict"

const fs = require("fs")
const path = require("path")
const axios = require("axios")
const sanitizeFilename = require("sanitize-filename")
const {program} = require("commander")
const {
	printTable,
	arrayChop,
	jsonStringify,
	getFileTimestamp,
	parseQuery,
	benchmark,
} = require("./utils")
const {version} = require("../package.json")

const configFilePath = path.resolve("./config.json")
const config = {}
if (process.argv[2] !== "auth") {
	if (!fs.existsSync(configFilePath)) {
		return console.error("Unauthorized. Auth with the command `detabase auth <project-key>`.")
	}
	try {
		Object.assign(config, JSON.parse(fs.readFileSync(configFilePath).toString()))
		config.projectId = config.projectKey.split("_")[0]
	} catch (err) {
		return console.error(
			"Can't parse congif.json. Try to auth again with the command `detabase auth <project-key>`",
			err
		)
	}
}

const request = axios.create({
	baseURL: `https://database.deta.sh/v1/${config.projectId}`,
	timeout: 30000,
	headers: {"X-API-Key": config.projectKey},
})

const Put = async ({database, items}) => {
	try {
		const response = await request({
			method: "PUT",
			url: `/${encodeURIComponent(database)}/items`,
			data: {items},
		})
		return response.data
	} catch (err) {
		console.error(err?.response?.data)
		return null
	}
}

const Delete = async ({database, key}) => {
	try {
		const response = await request({
			method: "DELETE",
			url: `/${encodeURIComponent(database)}/items/${encodeURIComponent(key)}`,
		})
		return response.data
	} catch (err) {
		console.error(err?.response?.data)
		return null
	}
}

const Query = async ({database, query, limit, last}) => {
	query = parseQuery(query)
	query === undefined &&
		console.warn(
			"Invalid query. The query will be skipped. Please, read the docs here https://docs.deta.sh/docs/base/queries/ and here https://docs.deta.sh/docs/base/http#query-items"
		)
	const {data} = await request({
		method: "POST",
		url: `/${encodeURIComponent(database)}/query`,
		data: {
			query,
			limit,
			last,
		},
	})
	return data
}

program.version(version, "-v, --version", "Output the current version.")

program
	.command("export")
	.description(
		"Create a .json dump of a given database. If no query provided, exports the whole database."
	)
	.argument("<database>", "Name of your database.")
	.option("-q, --query <query>", "Specify a query to export.")
	.option("-li, --limit <limit>", "Limit results amount.")
	.option("-la, --last <last>", "Last key seen in a previous paginated response.")
	.option("-fn, --filename <filename>", "Specify own name if a .json file.")
	.action(async (database, {filename, ...options}) => {
		console.log("Exporting database...")
		const timer = benchmark()
		const data = await Query({database, ...options})
		if (!data.paging.size) {
			return console.log("Nothing to export. Aborting...")
		}
		console.log("Database info:", data.paging)
		const fileName = filename
			? sanitizeFilename(filename)
			: `./${database}_${getFileTimestamp()}.json`
		fs.writeFileSync(fileName, jsonStringify(data))
		console.log(`Succesfuly exported into ${fileName}!`)
		console.log(`Export took ${timer()} seconds.`)
	})

program
	.command("count")
	.description("Count items of a given database with or without a query.")
	.argument("<database>", "Name of your database.")
	.option("-q, --query <query>", "Specify a query to export.")
	.action(async (database, options) => {
		console.log("Counting...")
		const timer = benchmark()
		const data = await Query({database, ...options})
		console.log(
			`There are ${data.paging.size} items${options.query ? " matching the query" : ""}.`
		)
		console.log(`Query took ${timer()} seconds.`)
	})

program
	.command("put")
	.description(
		"Put items into existing database. This request overwrites an item if it's key already exists."
	)
	.argument("<database>", "Specify a database.")
	.option("-i, --items <items>", "Set the items in the command line.")
	.option(
		"-ff, --from-file <path>",
		"Provide a path to file containing JSON-encoded array of items instead."
	)
	.action(async (database, {items, fromFile}) => {
		const itemsToPut = []
		if (items) {
			const itemsFromCommandLine = parseQuery(items)
			if (!itemsFromCommandLine) {
				return console.error("Invalid items. Aborting...")
			}
			itemsToPut.push(...itemsFromCommandLine)
		} else if (fromFile) {
			const filePath = path.resolve(fromFile)
			if (!fs.existsSync(filePath)) {
				return console.error("File does not exist. Aborting...")
			}
			try {
				const itemsFromFile = JSON.parse(fs.readFileSync(filePath).toString())
				if (!itemsFromFile instanceof Array) {
					return console.error(
						"File must contain a JSON-serialized array of items. Aborting..."
					)
				}
				itemsToPut.push(...itemsFromFile)
			} catch (err) {
				return console.error("Can't parse the provided file. Invalid JSON.`", err)
			}
		} else {
			return console.error(
				"One of the arguments is required. Please, set items inline (-i <items>) or provide a path to JSON encoded file (-ff <path>)."
			)
		}

		if (!itemsToPut.length) {
			return console.error("Nothing to put. Aborting...")
		}
		console.log(`Staring to put ${itemsToPut.length} items...`)
		const timer = benchmark()

		const parts = arrayChop(itemsToPut, 25)
		let counter = 0
		const results = []
		for (const part of parts) {
			counter += part.length
			console.log("Putting...", `${counter}/${itemsToPut.length}`)
			try {
				const response = await Put({database, items: part})
				results.push(...response.processed.items)
			} catch (err) {
				console.error(response?.response?.data)
			}
		}

		console.log(`Succesfuly put ${results.length} items.`)
		console.log(`Query took ${timer()} seconds.`)
	})

program
	.command("create")
	.description("Creates a database.")
	.argument("<database>", "Give a name to youe database.")
	.action(async database => {
		const timer = benchmark()
		try {
			const data = await Query({database, limit: 1})
			if (data.paging.size !== 0) {
				return console.error(`Database "${database}" already exists. Aborting...`)
			}
			console.log("Creating new database...")
			const response = await Put({database, items: [{create: 1}]})
			await Delete({database, key: response.processed.items[0].key})
			console.log(`Succesfuly created the database "${database}"!`)
			console.log(`Process took ${timer()} seconds.`)
		} catch (err) {
			console.log(err)
		}
	})

program
	.command("turncate")
	.description("Turncates a database.")
	.argument("<database>", "Name of a database to turncate.")
	.action(async database => {
		const timer = benchmark()
		try {
			const data = await Query({database})
			if (!data.paging.size) {
				return console.error(`The database is already empty. Aborting...`)
			}
			console.log("Trying to turncate the database...")
			let counter = 0
			for (const item of data.items) {
				await Delete({database, key: item.key})
				counter++
				console.log(`Deleted items ${counter}/${data.items.length}`)
			}
			console.log(`Succesfuly turncated the database "${database}"!`)
			console.log(`Process took ${timer()} seconds.`)
		} catch (err) {
			console.log(err)
		}
	})

program
	.command("query")
	.description("Show items matching a query.")
	.argument("<database>", "Name of your database.")
	.option("-q, --query <query>", "Specify a query.")
	.option("-j, --json", "Print JSON instead of a table.")
	.action(async (database, options) => {
		console.log("Processing the query...")
		const timer = benchmark()
		const data = await Query({database, ...options})
		data.paging.size && options.json
			? console.log(jsonStringify(data.items))
			: printTable(data.items)
		console.log(`There are ${data.paging.size} items matching the query`)
		console.log(`Query took ${timer()} seconds.`)
	})

program
	.command("delete")
	.description("Deletes an item with the given key or items matching a query.")
	.argument("[key]", "(Optional) The key of an item to be removed.")
	.option("-q, --query <query>", "Specify a query to be deleted.")
	.action((key, options, command) => {
		console.log(key, options)
	})

program
	.command("auth")
	.description("Saves user's project key.")
	.argument("<project-key>", "Your Deta project key.")
	.action(projectKey => {
		if (!projectKey.includes("_")) {
			return console.log(
				'Error: Wrong project key. The project key must include an underscore "_"'
			)
		}
		fs.writeFileSync(configFilePath, jsonStringify({projectKey}))
		console.log("Succesfuly authorized!")
	})

program.parse()
