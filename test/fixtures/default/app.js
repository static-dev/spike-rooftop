const Rooftop = require('../../..')

module.exports = {
  plugins: [new Rooftop({
    name: process.env.name,
    apiToken: process.env.token
  })]
}
