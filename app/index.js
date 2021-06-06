#!/usr/bin/env node
const args = process.argv.slice(2)
const Album = require('./csn/album')
const Terminal = require('./utils/console')
const terminal = new Terminal()

if (args[0] === 'album') {
  const email = args[1]
  const password = args[3]
  const albumUrl = args[4]
  const album = new Album(email, password, albumUrl)
  album.start()
  terminal.addWatcher(album.processDownload)
} else {
  console.error('Invalid type')
}
