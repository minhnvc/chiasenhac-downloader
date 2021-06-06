const querystring = require('querystring')
const axios = require('axios')

module.exports = class Network {
  static getWebHTML (url, loginToken) {
    return new Promise(resolve => {
      const headers = {
        Cookie: 'remember_web_59ba36addc2b2f9401580f014c7f58ea4e30989d=' + loginToken
      }
      const options = {
        method: 'GET',
        url: url,
        headers
      }
      axios(options).then(res => {
        resolve(res.data)
      })
    })
  }

  static getTokenBeforeLogin (url) {
    return new Promise(resolve => {
      axios.get(url)
        .then((response) => {
          // get token
          const html = response.data
          const re = /name="csrf-token" content="(.+)"/g
          const r = html.match(re)
          const csrfToken = r[0].split('"')[3]
          // get session
          response.headers['set-cookie'].map(e => {
            const ck = e.split('; expires')[0].split('=')
            if (ck[0] === 'chia_se_nhac_session') {
              resolve({
                token: csrfToken,
                session: ck[1]
              })
            }
            return e
          })
        })
    })
  }

  static getLoginSession (header, postData) {
    const url = 'https://chiasenhac.vn/login'
    return new Promise(resolve => {
      const headers = header
      const options = {
        method: 'POST',
        url: url,
        headers,
        data: querystring.stringify(postData)
      }
      axios(options).then(res => {
        res.headers['set-cookie'].map(e => {
          const ck = e.split('; expires')[0].split('=')
          if (ck[0] === 'remember_web_59ba36addc2b2f9401580f014c7f58ea4e30989d') {
            resolve(ck[1])
          }
          return e
        })
      })
    })
  }
}
