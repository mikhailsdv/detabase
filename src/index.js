#!/usr/bin/env node
"use strict"

//update multiple
//insert
//update
//get

const fs = require("fs")
const path = require("path")
const sanitizeFilename = require("sanitize-filename")
const {program} = require("commander")
const {
	printTable,
	arrayChop,
	jsonStringify,
	getFileTimestamp,
	parseQuery,
	benchmark,
	reduceAsync,
} = require("./utils")
const {version} = require("../package.json")
const DetaApi = require("./api")
const Auth = require("./auth")

const auth = new Auth()
const detaApi = new DetaApi({projectKey: auth.projectKey})

program
	.name("detabase")
	.version(version, "-v, --version", "Output the current version.")
	.helpOption("-h, --help", "Read more information.")
	.addHelpCommand("help [command]", "Display help for command.")
	.configureOutput({
		outputError: (str, write) => console.error(str),
	})

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
		auth.checkAuth()
		console.log("Exporting database...")
		const timer = benchmark()
		const data = await detaApi.query({database, ...options})
		if (!data.paging.size) {
			return console.log("Nothing to export. Aborting...")
		}
		console.log("Database info:", data.paging)
		const fileName = filename
			? sanitizeFilename(filename)
			: `./${database}_${getFileTimestamp()}.json`
		fs.writeFileSync(fileName, jsonStringify(data))
		console.log(`Succesfuly exported into ${fileName}.`)
		console.log(`Export took ${timer()} seconds.`)
	})

program
	.command("count")
	.description("Count items of a given database with or without a query.")
	.argument("<database>", "Name of your database.")
	.option("-q, --query <query>", "Specify a query to export.")
	.action(async (database, options) => {
		auth.checkAuth()
		console.log("Counting...")
		const timer = benchmark()
		const data = await detaApi.query({database, ...options})
		console.log(
			`There are ${data.paging.size} items${options.query ? " matching the query" : ""}.`
		)
		console.log(`Query took ${timer()} seconds.`)
	})

program
	.command("clone")
	.description("Clone database.")
	.argument("<database>", "Database to clone.")
	.argument("<new-name>", "Name of the new database.")
	.option("-q, --query <query>", "Specify a query.")
	.option("-f, --forse", "Clone even if a database with the new name already exist.", false)
	.action(async (database, newName, options) => {
		auth.checkAuth()
		const timer = benchmark()
		const data = await detaApi.query({database, ...options})
		console.log(
			`Cloning ${data.paging.size} items${
				options.query ? " matching the query" : ""
			} from "${database} into "${newName}".`
		)

		const partLength = 25
		const parts = arrayChop(data.items, partLength)
		const results = await reduceAsync(
			parts,
			async (part, counter, acc) => {
				console.log(
					"Putting...",
					`${counter * partLength + part.length}/${data.items.length}`
				)
				try {
					const response = await detaApi.put({database: newName, items: part})
					return acc.concat(...response.processed.items)
				} catch (err) {
					console.error(err?.response?.data)
					return acc
				}
			},
			[]
		)

		console.log(`Succesfuly put ${data.items.length} items into "${newName}".`)
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
		auth.checkAuth()
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

		const partLength = 25
		const parts = arrayChop(itemsToPut, partLength)
		const results = await reduceAsync(
			parts,
			async (part, counter, acc) => {
				console.log(
					"Putting...",
					`${counter * partLength + part.length}/${itemsToPut.length}`
				)
				try {
					const response = await detaApi.put({database, items: part})
					return acc.concat(...response.processed.items)
				} catch (err) {
					console.error(err?.response?.data)
					return acc
				}
			},
			[]
		)

		console.log(`Succesfuly put ${results.length} items.`)
		console.log(`Query took ${timer()} seconds.`)
	})

program
	.command("create")
	.description("Creates a database.")
	.argument("<database>", "Give a name to youe database.")
	.action(async database => {
		auth.checkAuth()
		const timer = benchmark()
		try {
			const data = await detaApi.query({database, limit: 1})
			if (data.paging.size !== 0) {
				return console.error(`Database "${database}" already exists. Aborting...`)
			}
			console.log("Creating new database...")
			const response = await detaApi.put({database, items: [{create: 1}]})
			await detaApi.delete({database, key: response.processed.items[0].key})
			console.log(`Succesfuly created the database "${database}".`)
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
		auth.checkAuth()
		const timer = benchmark()
		try {
			const data = await detaApi.query({database})
			if (!data.paging.size) {
				return console.error(`The database is already empty. Aborting...`)
			}
			console.log("Trying to turncate the database...")

			await reduceAsync(
				data.items,
				async (item, counter, acc) => {
					await detaApi.delete({database, key: item.key})
					console.log(`Deleted items ${counter + 1}/${data.items.length}`)
				},
				[]
			)

			console.log(`Succesfuly turncated the database "${database}".`)
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
		auth.checkAuth()
		console.log("Processing the query...")
		const timer = benchmark()
		const data = await detaApi.query({database, ...options})
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
		auth.checkAuth()
		console.log(key, options)
	})

program
	.command("get")
	.description(
		`Get an item with the given key. Use "detabase query <query>" in order to be able to specify a query.`
	)
	.argument("<database>", "Name of your database.")
	.argument("<key>", "The key of a record.")
	.action(async (database, key) => {
		auth.checkAuth()
		try {
			console.log(await detaApi.get({database, key}))
		} catch (err) {
			if (err?.response.status === 404) {
				return console.error("Record with the provided key does not exist.")
			}
			console.error(err)
		}
	})

program
	.command("auth")
	.description("Saves user's project key.")
	.argument("<project-key>", "Your Deta project key.")
	.action(projectKey => {
		auth.auth(projectKey)
		console.log("Succesfuly authorized!")
	})

try {
	program.parse()
} catch (err) {
	console.error(err.name, err.message)
}
