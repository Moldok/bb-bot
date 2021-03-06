const ETCD_URLS = process.env.ETCD_URLS
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN
let LANGUAGE = process.env.LANGUAGE
let BB_BOT_KB_CONFIG = process.env.BB_BOT_KB_CONFIG
const BASIC_AUTH_USERNAME = process.env.BASIC_AUTH_USERNAME
const BASIC_AUTH_PASSWORD = process.env.BASIC_AUTH_PASSWORD

/***
 * Load all envs and structure them correctly
 * @returns {{ETCD_URLS: string[]}}
 */
const loadEnvs = () => {
	if (!ETCD_URLS) {
		throw new Error('ETCD_URLS cannot be null or empty')
	}

	if (!TELEGRAM_TOKEN) {
		throw new Error('TELEGRAM_TOKEN cannot be null or empty')
	}

	if (!LANGUAGE) {
		LANGUAGE = 'en'
	}

	if (!BB_BOT_KB_CONFIG) {
		BB_BOT_KB_CONFIG = ''
	}

	return {
		ETCD_URLS: ETCD_URLS.split(','),
		TELEGRAM_TOKEN: TELEGRAM_TOKEN,
		LANGUAGE: LANGUAGE,
		KB_CONFIG: BB_BOT_KB_CONFIG,
		BASIC_AUTH_USERNAME: BASIC_AUTH_USERNAME,
		BASIC_AUTH_PASSWORD: BASIC_AUTH_PASSWORD
	}
}

module.exports = loadEnvs()
