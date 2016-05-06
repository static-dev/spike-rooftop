require('dotenv').config({ silent: true })

const test = require('ava')
const Rooftop = require('..')

const api = new Rooftop({
  name: process.env.name,
  apiToken: process.env.token,
  contentTypes: ['posts', 'case_studies']
})

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
  return api.run({ options: { locals: {} } }, undefined, () => {})
    .then((res) => {
      t.is(res.posts.length, 2)
      t.is(res.case_studies.length, 1)
    })
})
