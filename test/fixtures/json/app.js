const Rooftop = require('../../..')
const htmlStandards = require('reshape-standard')
const locals = {}

module.exports = {
  matchers: { html: '*(**/)*.sgr' },
  reshape: htmlStandards({ locals }),
  plugins: [new Rooftop({
    url: process.env.url,
    apiToken: process.env.token,
    addDataTo: locals,
    json: 'data.json'
  })]
}
