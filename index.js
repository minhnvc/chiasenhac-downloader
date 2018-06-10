#!/usr/bin/env node
const puppeteer = require('puppeteer');
const fs = require('fs');
const getSlug = require('speakingurl');
const request = require('request');
const progress = require('request-progress');
var blessed = require('blessed');
const args = process.argv.slice(2)


let currentFolder = 'v-limited-deluxe-edititon';
let processDownload = {};
let queueDownload = [];
let downloading = 0;
let maxDownload = 2;

function downloadFile(flacUrl) {
    queueDownload.push(flacUrl);
    var fileName = flacUrl.split('/')
    fileName = decodeURI(fileName[fileName.length - 1])
    processDownload[fileName] = 0;
}

setInterval(() => {
    if (downloading < maxDownload && queueDownload.length > 0) {
        let flacUrl = queueDownload.pop();
        var fileName = flacUrl.split('/')
        fileName = decodeURI(fileName[fileName.length - 1])
        downloading++;
        progress(request(flacUrl), {})
        .on('progress', function (state) {
            statusBar(fileName, state);
        })
        .on('error', function (err) {
            downloading --;
            statusBar(fileName, {percent: -1});
        })
        .on('end', function () {
            downloading --;
            statusBar(fileName, {percent: 1});
        })
        .pipe(fs.createWriteStream('./' + currentFolder + '/' + fileName));
    }
}, 2000)


async function getFlac(url) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', (request) => {
        if (['image', 'stylesheet', 'font', 'script'].indexOf(request.resourceType()) !== -1) {
            request.abort();
        } else {
            request.continue();
        }
    });
    await page.goto(url);

    let resultsSelector = '#downloadlink2';
    // Extract the results from the page.
    let flacUrl = await page.evaluate(resultsSelector => {
        const anchors = Array.from(document.querySelectorAll(resultsSelector + ' a'));
        for (let i = 0; i < anchors.length; i++) {
            if (anchors[i].href.includes('.flac')) {
                return anchors[i].href;
            }
        }
    }, resultsSelector);

    downloadFile(flacUrl);

    await browser.close();
}

function statusBar(filename, progress) {
    processDownload[filename] = Math.round(progress.percent*100)
}
  




// Create a screen object.
var screen = blessed.screen({
  smartCSR: true
});

var box = blessed.listtable({
    rows: [['aaa','bbb']]
});

setInterval(() => {
    let keys = Object.keys(processDownload);
    let items = [];
    for (let i = 0; i < keys.length; i++) {
        let str = [keys[i],processDownload[keys[i]] + '%']
        items.push(str);
    }
    box.setRows(items);
    screen.render();
}, 2000)

screen.append(box);

screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});
screen.render();

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', (request) => {
        if (['image', 'stylesheet', 'font', 'script'].indexOf(request.resourceType()) !== -1) {
            request.abort();
        } else {
            request.continue();
        }
    });
    await page.goto(args[0]);

    let resultsSelector = '.playlist_prv';
    // Extract the results from the page.
    currentFolder = await page.evaluate(resultsSelector => {
        let title = Array.from(document.querySelectorAll(resultsSelector + ' .cattitle'));
        return title[0].innerHTML;
    }, resultsSelector);
    currentFolder = currentFolder.replace('Nghe playlist: Album:' , '')
    currentFolder = getSlug(currentFolder)

    if (!fs.existsSync('./' + currentFolder)){
        fs.mkdirSync('./' + currentFolder);
    }

    let arrayDownload = await page.evaluate(resultsSelector => {

        const anchors = Array.from(document.querySelectorAll(resultsSelector + ' a'));
        let temp = []
        anchors.map((anchor, index)=> {
            if (index%3 == 0) {
                temp.push(anchor.href)
            }
        });

        return temp;
    }, resultsSelector);
    for (let i = 0; i < arrayDownload.length; i++) {
        await getFlac(arrayDownload[i]);
    }
    await browser.close();
})();