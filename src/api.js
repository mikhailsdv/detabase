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
		try {
			const response = await this.request({
				method: "PUT",
				url: `/${encodeURIComponent(database)}/items`,
				data: {items},
			})
			return response.data
		} catch (err) {
			console.error(err)
			return null
		}
	}

	async insert({database, items}) {
		try {
			const response = await this.request({
				method: "PUT",
				url: `/${encodeURIComponent(database)}/items`,
				data: {items},
			})
			return response.data
		} catch (err) {
			console.error(err)
			return null
		}
	}

	async delete({database, key}) {
		try {
			const response = await this.request({
				method: "DELETE",
				url: `/${encodeURIComponent(database)}/items/${encodeURIComponent(key)}`,
			})
			return response.data
		} catch (err) {
			console.error(err)
			return null
		}
	}

	async get({database, key}) {
		try {
			const response = await this.request({
				method: "GET",
				url: `/${encodeURIComponent(database)}/items/${encodeURIComponent(key)}`,
			})
			return response.data
		} catch (err) {
			console.error(err)
			return null
		}
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
