const Rooftop = require('../../..')
const jade = require('posthtml-jade')
const locals = {}

module.exports = {
  matchers: { html: '**/*.jade' },
  posthtml: { plugins: [jade(locals)] },
  plugins: [new Rooftop({
    name: process.env.name,
    apiToken: process.env.token,
    addDataTo: locals
  })]
}
