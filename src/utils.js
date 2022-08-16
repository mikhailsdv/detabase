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

module.exports = {printTable, arrayChop, jsonStringify, getFileTimestamp, parseQuery, benchmark}
