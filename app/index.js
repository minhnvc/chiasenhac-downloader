#!/usr/bin/env node
const args = process.argv.slice(2)
const Album = require('./csn/album')
const Terminal = require('./utils/console')
let terminal = new Terminal();


if (args[0] == 'album') {
    let albumUrl = args[1]
    let album = new Album(albumUrl);
    album.start();
    terminal.addWatcher(album.processDownload);
} else {
    console.error('Invalid type')
}
