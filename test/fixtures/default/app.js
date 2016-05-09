const Rooftop = require('../../..')

export default {
  plugins: [new Rooftop({
    name: process.env.name,
    apiToken: process.env.token
  })]
}
