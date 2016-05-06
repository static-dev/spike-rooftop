# Roots-Mini Rooftop Plugin

[![npm](http://img.shields.io/npm/v/roots-mini-rooftop.svg?style=flat)](https://badge.fury.io/js/roots-mini-rooftop) [![tests](http://img.shields.io/travis/carrot/roots-mini-rooftop/master.svg?style=flat)](https://travis-ci.org/carrot/roots-mini-rooftop) [![dependencies](http://img.shields.io/david/carrot/roots-mini-rooftop.svg?style=flat)](https://david-dm.org/carrot/roots-mini-rooftop)

Rooftop plugin for roots-mini

> **Note:** This project is in early development, and versioning is a little different. [Read this](http://markup.im/#q4_cRZ1Q) for more details.

### Why should you care?

Write about why this project is important.

### Installation

`npm install roots-mini-rooftop -S`

### Usage

This is just a webpack plugin, but it only works with roots-mini projects since it takes advantage of custom settings that are passed to the core plugins. You can include it in your roots-mini project like this:

```js
// app.js
const rooftop = require('roots-mini-rooftop')

export default {
  // all your other settings...
  plugins: [
    rooftop({ name: 'xxx', apiToken: 'xxx' })
  ]
}
```

Once included, it will expose a `rooftop` local to your jade files, which you can use to iterate through your posts. By default, it will only pull the `post` content type, which can be accessed through `rooftop.posts`, as such:

```jade
// a jade file
ul
  for post in rooftop.posts
    li= JSON.stringify(post)
```

If you want to access other content types, you can easily have us grab them by customizing the `contentTypes` option, as such:

```js
rooftop({
  name: 'xxx',
  apiToken: 'xxx',
  contentTypes: ['posts', 'case_studies']
})
```

This would pull any `case_studies` and add it to `rooftop.case_studies` in your jade files.

Now let's say you want to get a little more granular in which posts you are pulling, what order they are in, etc. Rather than passing a string through the `contentTypes` array, you can pass an object instead with some extra options. For example:

```js
rooftop({
  name: 'xxx',
  apiToken: 'xxx',
  contentTypes: [{
    name: 'posts',
    order: 'asc',
    search: 'hello'
  }]
})
```

This would pull back any posts whose content matches "hello" somewhere, in ascending rather than descending order. For a full list of possible parameters you can pass in here, check [the 'list posts' arguments list here](http://v2.wp-api.org/reference/posts/).

Now it is true that rooftop doesn't return the cleanest and nicest-formatted json. So you can also pass a `transform` option to each content type, where you can transform the data however you'd like before it goes into your views.

```js
rooftop({
  name: 'xxx',
  apiToken: 'xxx',
  contentTypes: [{
    name: 'posts',
    transform: (post) => {
      // do your transformation here...
      return post
    }
  }]
})
```

We run a default transform function that cleans up response objects for you, out of the box. However, if you'd like ti disable this and get back the raw response directly from rooftop, if you pass `false` as the value of `transform`, it will come back untouched.

```js
rooftop({
  name: 'xxx',
  apiToken: 'xxx',
  contentTypes: [{
    name: 'posts',
    transform: false // disable our standard transform function
  }]
})
```

### Testing

To run the tests locally, you'll need to add a `test/.env` with your name and token values:

- `cp test/.env.sample test/.env`
- `name` is derived from your Rooftop url. Assuming your URL is https://myproject.rooftop.io then **myproject** is your name value
- `token` can be found <https://[myproject].rooftopcms.io/wp-admin/admin.php?page=rooftop-overview>

### License & Contributing

- Details on the license [can be found here](LICENSE.md)
- Details on running tests and contributing [can be found here](contributing.md)
