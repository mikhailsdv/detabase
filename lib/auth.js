const fs = require("fs")
const path = require("path")
const {jsonStringify} = require("./utils")

module.exports = class Auth {
	constructor() {
		this.configFilePath = path.resolve("./detabase-conf.json")
		this.projectKey = null
		this.isAuthorized = false

		if (fs.existsSync(this.configFilePath)) {
			try {
				Object.assign(this, JSON.parse(fs.readFileSync(this.configFilePath).toString()))
				this.isAuthorized = true
			} catch (err) {
				return console.error(
					`Can't parse ${this.configFilePath}. Try to auth again with the command \`detabase auth <project-key>\``,
					err
				)
			}
		} /* else {
			console.warn(
				"You are currently unauthorized. Auth first with the command `detabase auth <project-key>`"
			)
		}*/
	}

	checkAuth() {
		if (!this.isAuthorized) {
			throw new Error(
				"Unauthorized. Auth first with the command `detabase auth <project-key>`."
			)
			return false
		} else {
			return true
		}
	}

	auth(projectKey) {
		if (!projectKey.includes("_")) {
			throw new Error('Wrong project key. The project key must contain an underscore "_"')
		}
		fs.writeFileSync(this.configFilePath, jsonStringify({projectKey}))
		return true
	}
}
