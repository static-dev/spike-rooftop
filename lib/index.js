const Client = require('rooftop-client')
const Joi = require('joi')
const W = require('when')

class Rooftop {
  constructor (opts) {
    const validatedOptions = validate(opts)
    Object.assign(this, validatedOptions)
    this.client = Client.new({ name: this.name, apiToken: this.apiToken })
  }

  apply (compiler) {
    compiler.plugin('run', this.run.bind(this, compiler))
    compiler.plugin('watch-run', this.run.bind(this, compiler))
    compiler.plugin('emit', (compilation, done) => {
      if (this.json) {
        const src = JSON.stringify(this.addDataTo.rooftop, null, 2)
        compilation.assets[this.json] = {
          source: () => src,
          size: () => src.length
        }
      }
      done()
    })
  }

  run (compiler, compilation, done) {
    return W.reduce(this.contentTypes, (m, ct) => {
      let name
      let options
      let transformFn

      if (typeof ct === 'string') {
        name = ct
        options = {}
        transformFn = true
      } else {
        name = ct.name
        options = ct
        transformFn = ct.transform
      }

      if (transformFn === true) transformFn = transform
      if (transformFn === false) transformFn = (x) => x

      return this.client[name].get(options)
        .then((p) => { return W.map(p, transformFn) })
        .tap((res) => { m[name] = res })
        .yield(m)
    }, {}).done((res) => {
      // now we put the results on the data object
      this.addDataTo = Object.assign(this.addDataTo, { rooftop: res })
      done()
    }, done)
  }
}

/**
 * Validate options
 * @private
 */
function validate (opts = {}) {
  const schema = Joi.object().keys({
    name: Joi.string().required(),
    apiToken: Joi.string().required(),
    addDataTo: Joi.object().required(),
    json: Joi.string(),
    contentTypes: Joi.array().items(
      Joi.string(), Joi.object().keys({
        name: Joi.string(),
        transform: Joi.alternatives().try(Joi.boolean(), Joi.func()).default(true)
      })
    ).default(['posts'])
  })

  const res = Joi.validate(opts, schema, {
    allowUnknown: true,
    language: {
      messages: { wrapArrays: false },
      object: { child: '!![spike-rooftop constructor] option {{reason}}' }
    }
  })
  if (res.error) { throw new Error(res.error) }
  return res.value
}

/**
 * Transform the rooftop response object to make it less messy
 * @private
 */
function transform (post) {
  post.title = post.title.rendered
  delete post.guid
  delete post.link
  delete post._links
  post.content.basic = post.content.basic.content
  post.content.excerpt = post.content.basic.excerpt
  if (!post.content.excerpt) delete post.content.excerpt
  post.content.advanced.map((c) => {
    c.fields.map((f) => { post.content[f.name] = f.value })
  })
  delete post.content.advanced
  return post
}

module.exports = Rooftop
module.exports.transform = transform
