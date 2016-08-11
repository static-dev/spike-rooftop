const Rooftop = require('../../..')
const jade = require('posthtml-jade')
const locals = {}

module.exports = {
  matchers: { html: '**/*.jade' },
  posthtml: { plugins: [jade(locals)] },
  plugins: [new Rooftop({
    url: process.env.url,
    apiToken: process.env.token,
    addDataTo: locals
  })]
}
