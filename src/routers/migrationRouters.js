import express from 'express'
import App from '../types/App'
import * as db from '../db'
import csv from 'csv-parser'
import fs from 'fs'
import path from 'path'
import multer from 'multer'

const upload = multer({ dest: 'files/' })

const router = express.Router()

const loadSettings = async (req) => {
	if ('namespace' in req.body && req.body.namespace) {
		const settings = await db.loadSettings(req.body.namespace)
		return settings
	}
	return null
}

const getOldApp = (string) => {
	const nameRegex = /\/(\w*)\/(\w*)-([\w-]*)\/(.*)/
	const nameRegexOptions = /\/([\w-]*)\/(\w*)\/(.*)/
	let oldAppRegex = nameRegex.exec(string)
	// app.setName('', settings)
	if (oldAppRegex === null) {
		oldAppRegex = nameRegexOptions.exec(string)
		if (oldAppRegex === null) {
			console.log('first regeex error string', string, 'oldAppReges', oldAppRegex)
		}
	}
	// console.log('oldAppRegex', oldAppRegex)
	return oldAppRegex
}

router.post('/', async (req, res) => {
	try {
		const settings = await loadSettings(req)
		let apps = await db.listOldApps(req.body.etcdUrl)
		apps = apps.filter(app => !app.includes('promster') && app !== '')
		console.log('numero de apps', apps.length)
		const data = {}
		apps.map(async (string) => {
			// console.log('Passou aqui', string)
			const oldAppRegex = getOldApp(string)
			// console.log('string', string, oldAppRegex[oldAppRegex.length - 1])
			// app.setName('', settings)
			let name = ''
			if (oldAppRegex.length === 4) {
				name = `${oldAppRegex[1]}-${oldAppRegex[2]}`
			} else {
				name = `${oldAppRegex[1]}-${oldAppRegex[2]}-${oldAppRegex[3]}`
			}
			if (!(name in data)) {
				data[name] = { ips: [], envs: [] }
			}
			data[name].envs.push({
				name: oldAppRegex[2]
			})
			data[name].ips.push(oldAppRegex[oldAppRegex.length - 1])
		})
		for (const keys in data) {
			console.log('keys', keys)
		}
		for (const keys in data) {
			const app = new App()
			app.setName(keys, settings)
			console.log('name', app.getName())
			try {
				const oldApp = await db.loadApps(app.getName()).catch(e => { throw e })
				// console.log('get name', app.getName())
				oldApp.jsonToArrays(data[keys])
				await db.addObjApp(oldApp, true).catch(e => { throw e })
			} catch (err) {
				// console.log('error on find app', err)
				app.jsonToArrays(data[keys])
				await db.addObjApp(app).catch(e => { throw e })
			}
		}
		res.status(200).json({
			status: 'OK'
		})
	} catch (err) {
		console.log('error register', err)
		res.status(400).json({
			status: 'Err',
			message: err.message
		})
	}
})

router.post('/teste', upload.single('data'), async (req, res) => {
	console.dir(req.file)
	console.log('data', req.body)
	const commands = []
	const data = []
	const fileName = path.join(__dirname, '..', '..', 'files', req.file.filename)
	try {
		const fd = fs.createReadStream(path.resolve(fileName))
		fd.pipe(csv({ separator: ';' }))
		const end = new Promise(function (resolve, reject) {
			fd.on('error', reject) // or something like that. might need to close `hash`
			fd.on('data', (row) => {
				console.log(row)
				data.push(row)
			})
			fd.on('end', () => {
				console.log('CSV file successfully processed')
			})
		})
		const teste = await end
		console.log('teste', teste)
		data.map(t => {
			if (t.Column4.search('cfe')) {
				const context = t.Column4.replace('cfe-', '')
				const command = `etcdctl put /${req.body.platform}/${req.body.environment}/${context}/${t.Column1}.dispositivos.bb.com.br:${t.Column3}`
				commands.push(command)
			}
		})
		res.status(200).json({
			status: 'OK',
			commands: commands
		})
	} catch (err) {
		console.error('error register', err)
		res.status(400).json({
			status: 'Err',
			message: err.message
		})
	}
})

export default router
