const http = require('http');

module.exports = class Network {
    static getWebHTML(url) {
        return new Promise(resolve => {
            http.get(url, (res) => {
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
}

