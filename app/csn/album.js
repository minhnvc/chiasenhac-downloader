const puppeteer = require('puppeteer');
const fs = require('fs');
const getSlug = require('speakingurl');
const request = require('request');
const progress = require('request-progress');

module.exports = class Album {
    constructor(url) {
        this.url = url;
        this.currentFolder = '';
        this.queueDownload = [];
        this.processDownload = {};
        this.downloading = 0;
        this.maxDownload = 2;
    }

    downloadFile(flacUrl) {
        this.queueDownload.push(flacUrl);
        var fileName = flacUrl.split('/')
        fileName = decodeURI(fileName[fileName.length - 1])
        this.processDownload[fileName] = 0;
    }

    async getFlac(url) {
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
        let flacUrl = await page.evaluate(resultsSelector => {
            const anchors = Array.from(document.querySelectorAll(resultsSelector + ' a'));
            for (let i = 0; i < anchors.length; i++) {
                if (anchors[i].href.includes('.flac')) {
                    return anchors[i].href;
                }
            }
        }, resultsSelector);
    
        this.downloadFile(flacUrl);
    
        await browser.close();
    }

    updatePercent(filename, progress) {
        this.processDownload[filename] = Math.round(progress.percent * 100)
    }

    runDownloadWorker() {
        setInterval(() => {
            if (this.downloading < this.maxDownload && this.queueDownload.length > 0) {
                let flacUrl = this.queueDownload.pop();
                var fileName = flacUrl.split('/')
                fileName = decodeURI(fileName[fileName.length - 1])
                this.downloading++;
                progress(request(flacUrl), {})
                    .on('progress', (state) => {
                        this.updatePercent(fileName, state);
                    })
                    .on('error', (err) => {
                        this.downloading--;
                        this.updatePercent(fileName, { percent: -1 });
                    })
                    .on('end', () => {
                        this.downloading--;
                        this.updatePercent(fileName, { percent: 1 });
                    })
                    .pipe(fs.createWriteStream('./' + this.currentFolder + '/' + fileName));
            }
        }, 2000)
    }

    async start() {
        this.runDownloadWorker();

        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setRequestInterception(true);

        //turn off all assets
        page.on('request', (request) => {
            if (['image', 'stylesheet', 'font', 'script'].indexOf(request.resourceType()) !== -1) {
                request.abort();
            } else {
                request.continue();
            }
        });

        await page.goto(this.url);

        let resultsSelector = '.playlist_prv';
        this.currentFolder = await page.evaluate(resultsSelector => {
            let title = Array.from(document.querySelectorAll(resultsSelector + ' .cattitle'));
            return title[0].innerHTML;
        }, resultsSelector);
        this.currentFolder = getSlug(this.currentFolder.replace('Nghe playlist: Album:', ''))

        if (!fs.existsSync('./' + this.currentFolder)) {
            fs.mkdirSync('./' + this.currentFolder);
        }

        let arrayDownload = await page.evaluate(resultsSelector => {

            const anchors = Array.from(document.querySelectorAll(resultsSelector + ' a'));
            let temp = []
            anchors.map((anchor, index) => {
                if (index % 3 == 0) {
                    temp.push(anchor.href)
                }
            });
            return temp;
        }, resultsSelector);
        for (let i = 0; i < arrayDownload.length; i++) {
            await this.getFlac(arrayDownload[i]);
        }
        await browser.close();
    }
}