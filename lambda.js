const https = require('https')
const querystring = require('querystring')

exports.handler = (event, context, callback) => {
    const path = event.pathParameters.path
    const query = querystring.stringify(event.queryStringParameters)

    https.get(`https://api.met.no/weatherapi/${path}?${query}`, (resp) => {
        let data = ''

        resp.on('data', (chunk) => {
            data += chunk
        })

        resp.on('end', () => {
            callback(null, {
                statusCode: 200,
                headers: {
                    'Content-Type': 'text/xml',
                    'Access-Control-Allow-Origin': '*'
                },
                body: data,
                isBase64Encoded: false
            })
        })
    }).on('error', (err) => {
        callback(err)
    })
}
