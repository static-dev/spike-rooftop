require('dotenv').config({ silent: true })

const test = require('ava')
const Rooftop = require('..')
const Spike = require('spike-core')
const path = require('path')
const fs = require('fs')
const rimraf = require('rimraf')
const htmlStandards = require('spike-html-standards')

const compilerMock = { options: { spike: { locals: {} } } }

test('errors without a "url"', (t) => {
  t.throws(
    () => { new Rooftop() }, // eslint-disable-line
    'ValidationError: [spike-rooftop constructor] option "url" is required'
  )
})

test('errors without an "apiToken"', (t) => {
  t.throws(
    () => { new Rooftop({ url: 'xxx' }) }, // eslint-disable-line
    'ValidationError: [spike-rooftop constructor] option "apiToken" is required'
  )
})

test('errors without "addDataTo"', (t) => {
  t.throws(
    () => { new Rooftop({ url: 'xxx', apiToken: 'xxx' }) }, // eslint-disable-line
    'ValidationError: [spike-rooftop constructor] option "addDataTo" is required'
  )
})

test('initializes with a name, apiToken, and addDataTo', (t) => {
  const rt = new Rooftop({ url: 'xxx', apiToken: 'xxx', addDataTo: {} })
  t.truthy(rt)
})

test.cb('returns valid content', (t) => {
  const locals = {}
  const api = new Rooftop({
    url: process.env.url,
    apiToken: process.env.token,
    addDataTo: locals,
    contentTypes: ['posts']
  })

  api.run(compilerMock, undefined, () => {
    t.is(locals.rooftop.posts.length, 2)
    t.end()
  })
})

test.cb('implements request options', (t) => {
  const locals = {}
  const api = new Rooftop({
    url: process.env.url,
    apiToken: process.env.token,
    addDataTo: locals,
    contentTypes: [{
      name: 'posts',
      params: { search: '2' }
    }]
  })

  api.run(compilerMock, undefined, () => {
    t.is(locals.rooftop.posts.length, 1)
    t.is(locals.rooftop.posts[0].slug, 'post2')
    t.end()
  })
})

test.cb('works with custom transform function', (t) => {
  const locals = {}
  const api = new Rooftop({
    url: process.env.url,
    apiToken: process.env.token,
    addDataTo: locals,
    contentTypes: [{
      name: 'posts',
      transform: (post) => { post.doge = 'wow'; return post }
    }]
  })

  api.run(compilerMock, undefined, () => {
    t.is(locals.rooftop.posts[0].doge, 'wow')
    t.end()
  })
})

test.cb('implements default transform function', (t) => {
  const locals = {}
  const api = new Rooftop({
    url: process.env.url,
    apiToken: process.env.token,
    addDataTo: locals,
    contentTypes: ['posts']
  })

  api.run(compilerMock, undefined, () => {
    t.truthy(typeof locals.rooftop.posts[0].title === 'string')
    t.end()
  })
})

test.cb('implements default when passing an object', (t) => {
  const locals = {}
  const api = new Rooftop({
    url: process.env.url,
    apiToken: process.env.token,
    addDataTo: locals,
    contentTypes: [{ name: 'posts' }]
  })

  api.run(compilerMock, undefined, () => {
    t.truthy(typeof locals.rooftop.posts[0].title === 'string')
    t.end()
  })
})

test.cb('can disable transform function', (t) => {
  const locals = {}
  const api = new Rooftop({
    url: process.env.url,
    apiToken: process.env.token,
    addDataTo: locals,
    contentTypes: [{
      name: 'posts',
      transform: false
    }]
  })

  api.run(compilerMock, undefined, () => {
    t.truthy(typeof locals.rooftop.posts[0].title === 'object')
    t.end()
  })
})

test.cb('works as a plugin to spike', (t) => {
  const projectPath = path.join(__dirname, 'fixtures/default')
  const project = new Spike({
    root: projectPath,
    entry: { main: [path.join(projectPath, 'main.js')] }
  })

  project.on('error', t.end)
  project.on('warning', t.end)
  project.on('compile', () => {
    const src = fs.readFileSync(path.join(projectPath, 'public/index.html'), 'utf8')
    t.truthy(src === '<p>7</p><p>1</p>') // post IDs from rooftop-seeds
    rimraf.sync(path.join(projectPath, 'public'))
    t.end()
  })

  project.compile()
})

test.cb('writes json output', (t) => {
  const projectPath = path.join(__dirname, 'fixtures/json')
  const project = new Spike({
    root: projectPath,
    entry: { main: [path.join(projectPath, 'main.js')] }
  })

  project.on('error', t.end)
  project.on('warning', t.end)
  project.on('compile', () => {
    const file = path.join(projectPath, 'public/data.json')
    t.falsy(fs.accessSync(file))
    const src = JSON.parse(fs.readFileSync(path.join(projectPath, 'public/data.json'), 'utf8'))
    t.truthy(src.posts.length > 1)
    rimraf.sync(path.join(projectPath, 'public'))
    t.end()
  })

  project.compile()
})

test.cb('accepts template object and generates html', (t) => {
  const locals = {}
  const rooftop = new Rooftop({
    url: process.env.url,
    apiToken: process.env.token,
    addDataTo: locals,
    contentTypes: [{
      name: 'posts',
      template: {
        path: '../template/template.sgr',
        output: (item) => `posts/${item.slug}.html`
      }
    }]
  })

  const projectPath = path.join(__dirname, 'fixtures/default')
  const project = new Spike({
    root: projectPath,
    reshape: (ctx) => htmlStandards({ webpack: ctx, locals }),
    entry: { main: [path.join(projectPath, 'main.js')] },
    plugins: [rooftop]
  })

  project.on('error', t.end)
  project.on('warning', t.end)
  project.on('compile', () => {
    const file1 = fs.readFileSync(path.join(projectPath, 'public/posts/post1.html'), 'utf8')
    const file2 = fs.readFileSync(path.join(projectPath, 'public/posts/post2.html'), 'utf8')
    t.is(file1.trim(), '<p>Post 1</p>')
    t.is(file2.trim(), '<p>Post 2</p>')
    rimraf.sync(path.join(projectPath, 'public'))
    t.end()
  })

  project.compile()
})

test.cb('generates error if template has an error', (t) => {
  const locals = {}
  const rooftop = new Rooftop({
    url: process.env.url,
    apiToken: process.env.token,
    addDataTo: locals,
    contentTypes: [{
      name: 'posts',
      template: {
        path: '../template/error.sgr',
        output: (item) => `posts/${item.title}.sgr`
      }
    }]
  })

  const projectPath = path.join(__dirname, 'fixtures/default')
  const project = new Spike({
    root: projectPath,
    reshape: (ctx) => htmlStandards({ webpack: ctx, locals }),
    entry: { main: [path.join(projectPath, 'main.js')] },
    plugins: [rooftop]
  })

  project.on('warning', t.end)
  project.on('error', (error) => {
    t.is(error.toString(), "Error: Cannot read property 'title' of undefined")
    rimraf.sync(path.join(projectPath, 'public'))
    t.end()
  })

  project.compile()
})

test.cb('default transform handles repeater items', (t) => {
  const locals = {}
  const api = new Rooftop({
    url: process.env.url,
    apiToken: process.env.token,
    addDataTo: locals,
    contentTypes: [{
      name: 'seeds'
    }]
  })

  api.run(compilerMock, undefined, () => {
    for (let i = 0; i < 3; i++) {
      t.is(locals.rooftop.seeds[0].content.repeater[i].value, `${i}`)
    }
    t.end()
  })
})

test.cb('default transform works on relationship items', (t) => {
  const locals = {}
  const api = new Rooftop({
    url: process.env.url,
    apiToken: process.env.token,
    addDataTo: locals,
    contentTypes: [{
      name: 'seeds'
    }]
  })

  api.run(compilerMock, undefined, () => {
    let testSeed = locals.rooftop.seeds[0]
    t.truthy(testSeed.content.related_post)
    let relatedPost = testSeed.content.related_post[0]
    t.is(relatedPost.title, 'Post 2')
    t.end()
  })
})

test.cb('hooks - postTransform does not modify locals', (t) => {
  const locals = { foo: 'bar' }
  const api = new Rooftop({
    url: process.env.url,
    apiToken: process.env.token,
    addDataTo: locals,
    hooks: {
      postTransform: function (posts, locals) { return [posts, {}] }
    },
    contentTypes: [{
      name: 'pages'
    }]
  })

  api.run(compilerMock, undefined, () => {
    t.is(locals.foo, 'bar')
    t.end()
  })
})

test.cb('hooks - postTransform adds to locals', (t) => {
  const locals = { foo: 'bar' }
  const api = new Rooftop({
    url: process.env.url,
    apiToken: process.env.token,
    addDataTo: locals,
    hooks: {
      postTransform: function (posts, locals) { return [posts, { doge: 'coin' }] }
    },
    contentTypes: [{
      name: 'pages'
    }]
  })

  api.run(compilerMock, undefined, () => {
    t.is(locals.foo, 'bar')
    t.is(locals.doge, 'coin')
    t.end()
  })
})

test.cb('hooks - postTransform modifies posts', (t) => {
  const locals = {}
  const api = new Rooftop({
    url: process.env.url,
    apiToken: process.env.token,
    addDataTo: locals,
    hooks: {
      postTransform: function (posts, locals) { return [{ posts: 'foo' }, {}] }
    },
    contentTypes: [{
      name: 'pages'
    }]
  })

  api.run(compilerMock, undefined, () => {
    t.is(locals.rooftop.posts, 'foo')
    t.end()
  })
})
