require('dotenv').config({ silent: true })

const test = require('ava')
const Rooftop = require('..')

test('errors without a "name"', (t) => {
  t.throws(
    () => { new Rooftop() }, // eslint-disable-line
    'ValidationError: [roots-mini-rooftop constructor] option "name" is required'
  )
})

test('errors without an "apiToken"', (t) => {
  t.throws(
    () => { new Rooftop({ name: 'xxx' }) }, // eslint-disable-line
    'ValidationError: [roots-mini-rooftop constructor] option "apiToken" is required'
  )
})

test('initializes with a name and apiToken', (t) => {
  const rt = new Rooftop({ name: 'xxx', apiToken: 'xxx' })
  t.truthy(rt)
})

test('returns valid content', (t) => {
  const api = new Rooftop({
    name: process.env.name,
    apiToken: process.env.token,
    contentTypes: ['posts', 'case_studies']
  })

  return api.run({ options: { locals: {} } }, undefined, () => {})
    .then((res) => {
      t.is(res.posts.length, 2)
      t.is(res.case_studies.length, 1)
    })
})

test('implements request options', (t) => {
  const api = new Rooftop({
    name: process.env.name,
    apiToken: process.env.token,
    contentTypes: [{
      name: 'posts',
      search: 'hello'
    }]
  })

  return api.run({ options: { locals: {} } }, undefined, () => {})
    .then((res) => {
      t.is(res.posts.length, 1)
      t.is(res.posts[0].slug, 'testing-123')
    })
})

test.todo('implements transform function')
test.todo('can disable transform function')
test.todo('works with custom transform function')
