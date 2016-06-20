require('dotenv').config({ silent: true })

const test = require('ava')
const Rooftop = require('..')
const Spike = require('spike-core')
const path = require('path')
const fs = require('fs')
const rimraf = require('rimraf')

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
    t.is(locals.rooftop.posts.length, 2)
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
    t.truthy(src === '91')
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
