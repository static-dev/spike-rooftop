# Spike Rooftop Plugin

[![npm](http://img.shields.io/npm/v/spike-rooftop.svg?style=flat)](https://badge.fury.io/js/spike-rooftop) [![tests](http://img.shields.io/travis/static-dev/spike-rooftop/master.svg?style=flat)](https://travis-ci.org/static-dev/spike-rooftop) [![dependencies](http://img.shields.io/david/static-dev/spike-rooftop.svg?style=flat)](https://david-dm.org/static-dev/spike-rooftop)
[![coverage](http://img.shields.io/coveralls/static-dev/spike-rooftop.svg?style=flat)](https://coveralls.io/github/static-dev/spike-rooftop)

[Rooftop CMS](https://www.rooftopcms.com/) plugin for [spike](https://github.com/static-dev/spike)

> **Note:** This project is in early development, and versioning is a little different. [Read this](http://markup.im/#q4_cRZ1Q) for more details.

### Why should you care?

If you are using the lovely [Rooftop CMS](https://www.rooftopcms.com/) and want to pull your API values in and compile them into a [spike](https://github.com/static-dev/spike) static site, this plugin will do some good work for you :grin:

### Installation

`npm install spike-rooftop -S`

### Usage

This is a standard [webpack](https://webpack.github.io/) plugin, but is built for and intended to be used with [spike](https://github.com/static-dev/spike). You can include it in your spike project like this:

```js
// app.js
const Rooftop = require('spike-rooftop')
const jade = require('posthtml-jade')
const locals = {}

module.exports = {
  plugins: [
    new Rooftop({ addDataTo: locals, name: 'xxx', apiToken: 'xxx' })
  ],
  posthtml: { defaults: jade(locals) }
}
```

Since Spike uses posthtml, you can use a variety of different plugins to expose local variables to your html. We are using [jade](https://github.com/posthtml/posthtml-jade) here because it's the plugin provided in spike's default template, and also is currently the only plugin that provides the ability to run complex loops through objects.

In order to pass the data correctly, you must pass `spike-rooftop` an object, which it will load the data onto when the compile begins under a `rooftop` key. If you also pass the same object to whatever posthtml plugin you are using in whatever manner it requires to make the data available in your html templates, the data will be present on that object before they start compiling. This is a slightly unconventional pattern for javascript libraries, but in this situation is allows for maximum flexibility and convenience.

Once included, it will expose a `rooftop` local to your jade files, which you can use to iterate through your posts. By default, it will only pull the `post` content type, which can be accessed through `rooftop.posts`, as such:

```jade
//- a jade file
ul
  for post in rooftop.posts
    li= JSON.stringify(post)
```

If you want to access other content types, you can easily have us grab them by customizing the `contentTypes` option, as such:

```js
const locals = {}

new Rooftop({
  addDataTo: locals,
  name: 'xxx',
  apiToken: 'xxx',
  contentTypes: ['posts', 'case_studies']
})
```

This would pull any `case_studies` and add it to `rooftop.case_studies` in your jade files.

Now let's say you want to get a little more granular in which posts you are pulling, what order they are in, etc. Rather than passing a string through the `contentTypes` array, you can pass an object instead with some extra options. For example:

```js
const locals = {}

new Rooftop({
  addDataTo: locals,
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
const locals = {}

new Rooftop({
  addDataTo: locals,
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

We run a default transform function that cleans up response objects for you, out of the box. However, if you'd like to disable this and get back the raw response directly from rooftop, if you pass `false` as the value of `transform`, it will come back untouched.

```js
const locals = {}

new Rooftop({
  addDataTo: locals,
  name: 'xxx',
  apiToken: 'xxx',
  contentTypes: [{
    name: 'posts',
    transform: false // disable our standard transform function
  }]
})
```

Using the template option allows you to write objects returned from Rooftop to single page templates. For example, if you are trying to render a blog as static, you might want each post returned from the API to be rendered as a single page by itself.

The template option is an object with path and output keys. path is an absolute or relative path to a template to be used to render each item, and output is a function with the currently iterated item as a parameter, which should return a string representing a path relative to the project root where the single view should be rendered. For example:

```js
const locals = {}

new Rooftop({
  addDataTo: locals,
  name: 'xxx',
  apiToken: 'xxx',
  contentTypes: [{
    name: 'posts',
    template: : {
      path: 'templates/post.html',
      output: (post) => { return `posts/${post.slug}.html` }
    }
  }]
})
```

Finally, if you'd like to have the output written locally to a JSON file so that it is effectively cached locally, you can pass the name of the file, resolved relative to your project's output, as a `json` option to the plugin. For example:

```js
const locals = {}

new Rooftop({
  addDataTo: locals,
  name: 'xxx',
  apiToken: 'xxx',
  contentTypes: ['posts'],
  json: 'data.json'
})
```

If you'd like to use our default transform outside of the library, this is also available as an export. For example, you could include it and use it with client-side js responses.

```js
const Rooftop = require('spike-rooftop')
console.log(Rooftop.transform)
```

### Testing

To run the tests locally, you'll need to add a `test/.env` with your name and token values:

- `cp test/.env.sample test/.env`
- `name` is derived from your Rooftop url. Assuming your URL is https://myproject.rooftop.io then **myproject** is your name value
- `token` can be found <https://[myproject].rooftopcms.io/wp-admin/admin.php?page=rooftop-overview>

### License & Contributing

- Details on the license [can be found here](LICENSE.md)
- Details on running tests and contributing [can be found here](contributing.md)
