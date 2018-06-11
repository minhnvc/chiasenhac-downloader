const fs = require('fs');
const getSlug = require('speakingurl');
const request = require('request');
const progress = require('request-progress');
const Network = require('../utils/network');
const cheerio = require('cheerio');

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
        let html = await Network.getWebHTML(url);
        const $ = cheerio.load(html);
    
        let resultsSelector = '#downloadlink2';
        const anchors = $(resultsSelector + ' a');
        for (let i = 0; i < anchors.length; i++) {
            if (anchors[i].attribs['href'].includes('.flac')) {
                this.downloadFile(anchors[i].attribs['href'])
            }
        }
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

        let html = await Network.getWebHTML(this.url);

        const $ = cheerio.load(html);

        let resultsSelector = '.playlist_prv';
        this.currentFolder = $(resultsSelector + ' .cattitle').html();
        this.currentFolder = getSlug(this.currentFolder.replace('Nghe playlist: Album:', ''))

        if (!fs.existsSync('./' + this.currentFolder)) {
            fs.mkdirSync('./' + this.currentFolder);
        }


        let arrayDownload = [];
        const anchors = $(resultsSelector + ' a')
        for (let index = 0; index < anchors.length; index++) {
            if (index % 3 == 0) {
                arrayDownload.push(anchors[index].attribs['href'])
            }
        }

        for (let i = 0; i < arrayDownload.length; i++) {
            await this.getFlac(arrayDownload[i]);
        }
    }
}