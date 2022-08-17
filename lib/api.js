const axios = require("axios")
const {parseQuery} = require("./utils")

module.exports = class DetaApi {
	constructor(options) {
		this.init(options)
	}

	init({projectKey, timeout = 30000}) {
		if (!projectKey) return
		this.projectKey = projectKey
		this.projectId = this.getProjectIdFromKey(projectKey)
		this.request = axios.create({
			baseURL: `https://database.deta.sh/v1/${this.projectId}`,
			timeout,
			headers: {"X-API-Key": this.projectKey},
		})
	}

	getProjectIdFromKey(pk) {
		return pk.split("_")[0]
	}

	async put({database, items}) {
		const response = await this.request({
			method: "PUT",
			url: `/${encodeURIComponent(database)}/items`,
			data: {items},
		})
		return response.data
	}

	async insert({database, items}) {
		const response = await this.request({
			method: "POST",
			url: `/${encodeURIComponent(database)}/items`,
			data: {items},
		})
		return response.data
	}

	async insert({database, items}) {
		const response = await this.request({
			method: "PUT",
			url: `/${encodeURIComponent(database)}/items`,
			data: {items},
		})
		return response.data
	}

	async delete({database, key}) {
		const response = await this.request({
			method: "DELETE",
			url: `/${encodeURIComponent(database)}/items/${encodeURIComponent(key)}`,
		})
		return response.data
	}

	async get({database, key}) {
		const response = await this.request({
			method: "GET",
			url: `/${encodeURIComponent(database)}/items/${encodeURIComponent(key)}`,
		})
		return response.data
	}

	async update({database, key, set, increment, append, prepend, delete: _delete}) {
		const response = await this.request({
			method: "PATCH",
			url: `/${encodeURIComponent(database)}/items/${encodeURIComponent(key)}`,
			data: {set, increment, append, prepend, delete: _delete},
		})
		return response.data
	}

	async query({database, query, limit, last}) {
		query = parseQuery(query)
		query === undefined &&
			console.warn(
				"Invalid query. The query will be skipped. Please, read the docs here https://docs.deta.sh/docs/base/queries/ and here https://docs.deta.sh/docs/base/http#query-items"
			)
		const {data} = await this.request({
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

	setProjetKey(projectKey) {
		this.init({projectKey})
	}
}
