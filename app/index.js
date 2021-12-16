#!/usr/bin/env node
const args = process.argv.slice(2)
const Album = require('./csn/album')
const Playlist = require('./csn/playlist')
const Terminal = require('./utils/console')

if (args[0] === 'album') {
	const email = args[1]
	const password = args[2]
	const albumUrl = args[3]
	if (!email || !password || !albumUrl) {
		console.log('Please try again: chiasenhac album {email} {password} {album-link}')
	} else {
		const album = new Album(email, password, albumUrl)
		album.start()
		const terminal = new Terminal()
		terminal.addWatcher(album.processDownload)
	}
} else {
	console.error('Invalid type')
}

if (args[0] === 'playlist') {
	const email = args[1]
	const password = args[2]
	const playlistUrl = args[3]
	if (!email || !password || !playlistUrl) {
		console.log('Please try again: chiasenhac playlist {email} {password} {playlist-link}')
	} else {
		const playlist = new Playlist(email, password, playlistUrl)
		playlist.start()
		const terminal = new Terminal()
		terminal.addWatcher(playlist.processDownload)
	}
} else {
	console.error('Invalid type')
}
