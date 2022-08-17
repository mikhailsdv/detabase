const {Table} = require("console-table-printer")

const printTable = arr => {
	const columns = arr.reduce((acc, item) => {
		for (const key in item) {
			acc.indexOf(key) === -1 && acc.push(key)
		}
		return acc
	}, [])
	const table = new Table({
		columns: columns.map(column => ({name: column, alignment: "left", maxLen: 5})),
	})
		.addRows(arr)
		.printTable()
}

const arrayChop = (array, perChunk) => {
	return array.reduce((all, one, i) => {
		const ch = Math.floor(i / perChunk)
		all[ch] = [].concat(all[ch] || [], one)
		return all
	}, [])
}

const jsonStringify = obj => JSON.stringify(obj, null, 2)

const getFileTimestamp = () =>
	new Date()
		.toISOString()
		.replace(/[-:]/g, "")
		.replace("T", "_")
		.replace(/\.\d+Z/g, "")

const parseQuery = query => {
	if (!query) {
		return null
	}
	if (typeof query === "string") {
		try {
			query = eval(`(${query})`)
		} catch (err) {
			return undefined
		}
	}
	if (query?.constructor.name === "Object") {
		return [query]
	} else if (Array.isArray(query)) {
		return query
	} else {
		return undefined
	}
}

const benchmark = () => {
	const start = new Date().valueOf()
	return () => Math.round((new Date().valueOf() - start) * 10) / 10000
}

const reduceAsync = async (arr, f, acc) => {
	let counter = 0
	for (const item of arr) {
		acc = await f(item, counter, acc)
		counter++
	}
	return acc
}

const jsoneval = str => {
	try {
		return JSON.parse(str)
	} catch (err) {
		try {
			return eval(`(${str})`)
		} catch (err) {
			throw new Error(`Can't parse ${str} to js object.`)
		}
	}
}

const displayError = err => {
	if (err?.response) {
		console.error("Request error:", {
			status: err?.response?.status,
			statusText: err?.response?.statusText,
			data: err?.response?.data,
			url: err?.response?.request?.path,
			method: err?.response?.request?.method,
		})
	} else {
		console.error(`${err.name}: ${err.message}`)
	}
}

const handleErrorAsync = async f => {
	try {
		await f()
	} catch (err) {
		displayError(err)
	}
}

module.exports = {
	printTable,
	arrayChop,
	jsonStringify,
	getFileTimestamp,
	parseQuery,
	benchmark,
	reduceAsync,
	jsoneval,
	displayError,
	handleErrorAsync,
}
