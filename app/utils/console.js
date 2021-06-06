const blessed = require('blessed')

module.exports = class Terminal {
  constructor () {
    this.screen = blessed.screen({
      smartCSR: true
    })
    this.screen.key(['escape', 'q', 'C-c'], function (ch, key) {
      return process.exit(0)
    })
    this.screen.render()

    this.idGen = 0
    this.mapData = {}
    this.mapWatcher = {}

    setInterval(() => {
      for (let i = 1; i <= this.idGen; i++) {
        const keys = Object.keys(this.mapData[i])
        const items = []
        for (let j = 0; j < keys.length; j++) {
          const percent = this.mapData[i][keys[j]]
          let progressBar = '['
          const numPercent = Math.floor(percent / 5)
          for (let k = 0; k < numPercent; k++) {
            progressBar += '='
          }
          for (let k = 0; k < (20 - numPercent); k++) {
            progressBar += '-'
          }
          progressBar += ']'

          const str = [keys[j], progressBar, percent === 100 ? 'DONE' : (percent + '%')]
          items.push(str)
        }
        this.mapWatcher[i].setRows(items)
      }
      this.screen.render()
    }, 1000)
  }

  addWatcher (data) {
    this.idGen++

    this.mapData[this.idGen] = data
    this.mapWatcher[this.idGen] = blessed.listtable({
      rows: [['Loading ... ', 'Please wait!']]
    })
    this.screen.append(this.mapWatcher[this.idGen])
  }
}
