const fs = require('fs')
const request = require('request')
const progress = require('request-progress')
const Network = require('../utils/network')
const cheerio = require('cheerio')

module.exports = class Album {
  constructor (email, password, url) {
    // remove query string
    this.email = email
    this.password = password
    this.url = url.split('?')[0]
    this.currentFolder = ''
    this.queueDownload = []
    this.processDownload = {}
    this.downloading = 0
    this.maxDownload = 2
  }

  downloadFile (flacUrl) {
    this.queueDownload.push(flacUrl)
    let fileName = flacUrl.split('/')
    fileName = decodeURI(fileName[fileName.length - 1])
    this.processDownload[fileName] = 0
  }

  async getFlac (url) {
    this.downloadFile(url)
  }

  updatePercent (filename, progress) {
    this.processDownload[filename] = Math.round(progress.percent * 100)
  }

  runDownloadWorker () {
    setInterval(() => {
      if (this.downloading < this.maxDownload && this.queueDownload.length > 0) {
        const flacUrl = this.queueDownload.pop()
        let fileName = flacUrl.split('/')
        fileName = decodeURI(fileName[fileName.length - 1])
        this.downloading++
        progress(request(flacUrl), {})
          .on('progress', (state) => {
            this.updatePercent(fileName, state)
          })
          .on('error', () => {
            this.downloading--
            this.updatePercent(fileName, { percent: -1 })
          })
          .on('end', () => {
            this.downloading--
            this.updatePercent(fileName, { percent: 1 })
          })
          .pipe(fs.createWriteStream('./' + this.currentFolder + '/' + fileName))
      }
    }, 2000)
  }

  async start () {
    this.runDownloadWorker()
    const token = await Network.getTokenBeforeLogin(this.url)
    const loginToken = await Network.getLoginSession({
      Cookie: 'chia_se_nhac_session=' + token.session,
      'X-CSRF-TOKEN': token.token,
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Safari/537.36 Edg/91.0.864.41',
      Origin: 'https://chiasenhac.vn',
      Referer: this.url
    }, {
      email: this.email,
      password: this.password,
      remember: 'true'
    })
    const html = await Network.getWebHTML(this.url, loginToken)
    const $ = cheerio.load(html)

    const resultsSelector = '.card-footer'
    const numOfSong = $(resultsSelector).length

    const regex = /nghe-album\/(.*).html/g
    const folder = this.url.match(regex)
    this.currentFolder = (folder[0].split('/')[1].split('.')[0])

    if (!fs.existsSync('./' + this.currentFolder)) {
      fs.mkdirSync('./' + this.currentFolder)
    }

    const arrayDownload = []

    for (let i = 1; i <= numOfSong; i++) {
      const htmlSong = await Network.getWebHTML(this.url + '?playlist=' + i, loginToken)
      const song = cheerio.load(htmlSong)
      const anchors = song('#download_lossless')
      for (let index = 0; index < anchors.length; index++) {
        arrayDownload.push(anchors[index].attribs.href)
      }
    }

    for (let i = 0; i < arrayDownload.length; i++) {
      await this.getFlac(arrayDownload[i])
    }
  }
}
