const https = require('https');
const querystring = require('querystring');
const axios = require('axios');

module.exports = class Network {
    static getWebHTML(url) {
        return new Promise(resolve => {
            https.get(url, (res) => {
                let rawData = '';
                res.on('data', (chunk) => { rawData += chunk; });
                res.on('end', () => {
                    try {
                        resolve(rawData);
                    } catch (e) {
                        console.error(e.message);
                    }
                });
            })
        })
    }

    static getCookie(url, key) {
        return new Promise(resolve => {
            axios.get(url)
                .then((response) => {
                    response.headers['set-cookie'].map(e => {
                        let ck = e.split('; expires')[0].split('=')
                        if (ck[0] == key) {
                            resolve(ck[1])
                        }
                    })

                })
        })
    }

    static post(url, postData) {
        return new Promise(resolve => {
            const headers = {}
            const options = {
                method: 'post',
                url: url,
                data: querystring.stringify(postData),
                transformRequest: [(data, headers) => {
                    resolve(data)
                }]
            };
            axios(options);
        })
    }
}

