const Client = require('rooftop-client')
const Joi = require('joi')
const W = require('when')
const fs = require('fs')
const path = require('path')
const node = require('when/node')
const reshape = require('reshape')
const loader = require('reshape-loader')
const SpikeUtil = require('spike-util')

class Rooftop {
  constructor (opts) {
    const validatedOptions = validate(opts)
    Object.assign(this, validatedOptions)
    this.client = Client.new({ url: this.url, apiToken: this.apiToken })
  }

  apply (compiler) {
    this.util = new SpikeUtil(compiler.options)

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

      const templateContent = this.contentTypes.filter((ct) => {
        return ct.template
      })

      W.map(templateContent, (ct) => {
        return writeTemplate.call(this, compiler, compilation, ct)
      }).done(() => done(), done)
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

      if (typeof transformFn === 'boolean') {
        transformFn = transformFn ? transform : (x) => x
      }

      console.log('in core')
      console.log(this.client.posts)
      return W.resolve(this.client[name].get(options))
        .then((p) => W.map(p, transformFn))
        .tap((v) => { m[name] = v })
        .yield(m)
    }, {}).done((res) => {
      // now we put the results on the data object
      let modData = {}
      if (this.hooks && this.hooks.postTransform) {
        [res, modData] = this.hooks.postTransform(res, this.addDataTo)
        this.addDataTo = Object.assign(this.addDataTo, modData)
      }

      // just add to locals, don't ruin it
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
    url: Joi.string().required(),
    apiToken: Joi.string().required(),
    addDataTo: Joi.object().required(),
    json: Joi.string(),
    hooks: Joi.object().keys({
      postTransform: Joi.func()
    }),
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
  const mapItem = (item) => {
    item.advanced = item.advanced || item.content.advanced
    item.content = item.content || {}
    if (item.advanced) {
      item.advanced.map((c) => {
        c.fields.map((field) => {
          if (field.class === 'repeater') {
            item.content[field.name] = field.fields.map((row) => row[0])
          } else if (field.class === 'relationship' && field.value) {
            item.content[field.name] = field.value
            item.content[field.name].map(mapItem)
          } else {
            item.content[field.name] = field.value
          }
        })
      })
      delete item.advanced
    }
  }
  post.title = post.title.rendered
  delete post.guid
  delete post.link
  delete post._links
  post.content.basic = post.content.basic.content
  post.content.excerpt = post.content.basic.excerpt
  if (!post.content.excerpt) delete post.content.excerpt
  mapItem(post)
  return post
}

function writeTemplate (compiler, compilation, contentType) {
  const data = this.addDataTo.rooftop[contentType.name]
  const filePath = path.join(compiler.options.context, contentType.template.path)

  return node.call(fs.readFile.bind(fs), filePath, 'utf8')
    .then((template) => {
      return W.map(data, (item) => {
        const newLocals = Object.assign({}, this.addDataTo, { item })
        compiler.resourcePath = filePath

        // webpack context is used by default in spike for plugins, so we need
        // to mock it so that plugins dont crash
        const fakeContext = { addDependency: (x) => x, resourcePath: filePath }
        const options = loader.parseOptions.call(fakeContext, this.util.getSpikeOptions().reshape)

        // W.map fires events as quickly as possible, so the locals will be
        // swapped for the last item unless bound to the result function
        return reshape(options)
          .process(template)
          .then((res) => {
            const html = res.output(newLocals)
            compilation.assets[contentType.template.output(item)] = {
              source: () => html,
              size: () => html.length
            }
          })
      })
    })
}

module.exports = Rooftop
module.exports.transform = transform
