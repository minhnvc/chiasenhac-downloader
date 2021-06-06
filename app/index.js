#!/usr/bin/env node
const args = process.argv.slice(2)
const Album = require('./csn/album')
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
