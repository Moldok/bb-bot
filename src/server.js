'use strict'
import * as db from './db'
import kbRouter from './routers/kbRouters'
import appRouter from './routers/appRouters'
import settingsRouter from './routers/settingsRouters'
import migrationRouter from './routers/migrationRouters'
import path from 'path'
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const i18n = require('i18n')
const { messageHandler } = require('./agent')
const { alert } = require('./alert')
const { LANGUAGE } = require('./environment')
const { isValidAuth } = require('./auth')
const { Monitor } = require('@labbsr0x/express-monitor')

const app = express()
Monitor.init(app, true)

i18n.configure({
	directory: path.join(__dirname, '/locales'),
	defaultLocale: LANGUAGE,
	register: global
})

app.use(cors())
app.use(bodyParser.json())
app.use(i18n.init)
app.use('*', isValidAuth)

app.post('/', messageHandler)

app.get('/test', (req, res) => {
	alert('teste', 'ALERT! 1, 2, 3!').then(() => {
		res.status(200).json({ alerts: 'sent' })
	})
})

app.post('/alertmanager', async (req, res) => {
	const alertmanager = req.body
	try {
		if (alertmanager.receiver === 'bot') {
			for (const al of alertmanager.alerts) {
				if ('app' in al.annotations) {
					await alert(al.annotations.app, al.annotations.description)
				}
			}
		}
		res.status(200).json({
			live: true,
			body: req.body
		})
	} catch (error) {
		console.debug('Error on alert manager', error)
	}
})

app.post('/add/app', async (req, res) => {
	try {
		await db.addApp(req.body.name, req.body.address)
		res.status(200).json({
			status: 'OK'
		})
	} catch (error) {
		console.log('Cannot add app', error)
		res.status(400).json({
			status: 'Error'
		})
	}
})

app.post('/remove/app', async (req, res) => {
	try {
		await db.rmApp(req.body.name, false)
		res.status(200).json({
			status: 'OK'
		})
	} catch (error) {
		console.log('Cannot add app', error)
		res.status(400).json({
			status: 'Error'
		})
	}
})

app.get('/list/apps', async (req, res) => {
	const apps = await db.listApps(req.query)
	res.status(200).json({
		status: 'OK',
		result: apps
	})
})

app.post('/test/alert', async (req, res) => {
	try {
		await alert(req.body.app, req.body.description)
		res.status(200).json({
			status: 'OK'
		})
	} catch (error) {
		console.debug('error', error)
		res.status(400).json({
			status: 'Error'
		})
	}
})

app.post('/subscribe', async (req, res) => {
	console.log('list app')
	await db.subscribeToApp(req.body.name, req.body.chatId)
	res.status(200).json({
		status: 'OK'
	})
})

app.get('/list/version/:app', async (req, res) => {
	try {
		const versions = await db.listVersions(req.params.app)
		res.status(200).json({
			status: 'OK',
			result: versions
		})
	} catch (err) {
		console.debug('erro', err)
		res.status(400).json({
			status: 'Err'
		})
	}
})

app.post('/add/version', async (req, res) => {
	try {
		await db.addVersionToApp(req.body.app, req.body.env, req.body.version)
		res.status(200).json({
			status: 'OK'
		})
	} catch (err) {
		console.debug('error', err)
		res.status(400).json({
			status: 'Err'
		})
	}
})

app.use('/kb', kbRouter)
app.use('/app', appRouter)
app.use('/settings', settingsRouter)
app.use('/migration', migrationRouter)

export default app
