require('dotenv').config({ silent: true })

const test = require('ava')
const Rooftop = require('..')
const Spike = require('spike-core')
const path = require('path')
const fs = require('fs')
const rimraf = require('rimraf')
const exp = require('posthtml-exp')

const compilerMock = { options: { spike: { locals: {} } } }

test('errors without a "name"', (t) => {
  t.throws(
    () => { new Rooftop() }, // eslint-disable-line
    'ValidationError: [spike-rooftop constructor] option "name" is required'
  )
})

test('errors without an "apiToken"', (t) => {
  t.throws(
    () => { new Rooftop({ name: 'xxx' }) }, // eslint-disable-line
    'ValidationError: [spike-rooftop constructor] option "apiToken" is required'
  )
})

test('errors without "addDataTo"', (t) => {
  t.throws(
    () => { new Rooftop({ name: 'xxx', apiToken: 'xxx' }) }, // eslint-disable-line
    'ValidationError: [spike-rooftop constructor] option "addDataTo" is required'
  )
})

test('initializes with a name, apiToken, and addDataTo', (t) => {
  const rt = new Rooftop({ name: 'xxx', apiToken: 'xxx', addDataTo: {} })
  t.truthy(rt)
})

test.cb('returns valid content', (t) => {
  const locals = {}
  const api = new Rooftop({
    name: process.env.name,
    apiToken: process.env.token,
    addDataTo: locals,
    contentTypes: ['posts', 'case_studies']
  })

  api.run(compilerMock, undefined, () => {
    t.is(locals.rooftop.posts.length, 6)
    t.is(locals.rooftop.case_studies.length, 1)
    t.end()
  })
})

test.cb('implements request options', (t) => {
  const locals = {}
  const api = new Rooftop({
    name: process.env.name,
    apiToken: process.env.token,
    addDataTo: locals,
    contentTypes: [{
      name: 'posts',
      search: 'hello'
    }]
  })

  api.run(compilerMock, undefined, () => {
    t.is(locals.rooftop.posts.length, 1)
    t.is(locals.rooftop.posts[0].slug, 'testing-123')
    t.end()
  })
})

test.cb('works with custom transform function', (t) => {
  const locals = {}
  const api = new Rooftop({
    name: process.env.name,
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
    name: process.env.name,
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
    name: process.env.name,
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
    name: process.env.name,
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
    t.truthy(src === '111101969391') // post IDs from carrotcreativedemo
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
    name: process.env.name,
    apiToken: process.env.token,
    addDataTo: locals,
    contentTypes: [{
      name: 'posts',
      template: {
        path: '../template/template.html',
        output: (item) => `posts/${item.title}.html`
      }
    }]
  })

  const projectPath = path.join(__dirname, 'fixtures/default')
  const project = new Spike({
    root: projectPath,
    posthtml: { plugins: [exp({ locals })] },
    entry: { main: [path.join(projectPath, 'main.js')] },
    plugins: [rooftop]
  })

  project.on('error', t.end)
  project.on('warning', t.end)
  project.on('compile', () => {
    const file1 = fs.readFileSync(path.join(projectPath, 'public/posts/Testing 123.html'), 'utf8')
    const file2 = fs.readFileSync(path.join(projectPath, 'public/posts/Welcome to Rooftop.html'), 'utf8')
    t.is(file1.trim(), '<p>Testing 123</p>')
    t.is(file2.trim(), '<p>Welcome to Rooftop</p>')
    rimraf.sync(path.join(projectPath, 'public'))
    t.end()
  })

  project.compile()
})

test.cb('generates error if template has an error', (t) => {
  const locals = {}
  const rooftop = new Rooftop({
    name: process.env.name,
    apiToken: process.env.token,
    addDataTo: locals,
    contentTypes: [{
      name: 'case_studies',
      template: {
        path: '../template/error.html',
        output: (item) => `posts/${item.title}.html`
      }
    }]
  })

  const projectPath = path.join(__dirname, 'fixtures/default')
  const project = new Spike({
    root: projectPath,
    posthtml: { plugins: [exp({ locals })] },
    entry: { main: [path.join(projectPath, 'main.js')] },
    plugins: [rooftop]
  })

  project.on('warning', t.end)
  project.on('error', (error) => {
    t.is(error.message.message, 'notItem is not defined')
    rimraf.sync(path.join(projectPath, 'public'))
    t.end()
  })

  project.compile()
})

test.cb('default transform handles repeater items', (t) => {
  const locals = {}
  const api = new Rooftop({
    name: process.env.name,
    apiToken: process.env.token,
    addDataTo: locals,
    contentTypes: [{
      name: 'articles'
    }]
  })

  api.run(compilerMock, undefined, () => {
    for (let i = 0; i < 3; i++) {
      t.is(locals.rooftop.articles[3].content.repeater_test[i].value, `${i}`)
    }
    t.end()
  })
})

test.cb('default transform works on relationship items', (t) => {
  const locals = {}
  const api = new Rooftop({
    name: process.env.name,
    apiToken: process.env.token,
    addDataTo: locals,
    contentTypes: [{
      name: 'articles'
    }]
  })

  api.run(compilerMock, undefined, () => {
    let testArticle = locals.rooftop.articles[3]
    t.truthy(testArticle.content.relationship_test)
    for (let i = 0; i < 3; i++) {
      testArticle = testArticle.content.relationship_test[0]
      t.is(testArticle.title, `Test Article ${i}`)
    }
    t.end()
  })
})
