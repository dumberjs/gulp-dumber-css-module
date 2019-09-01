# gulp-dumber-css-module [![Build Status](https://travis-ci.org/dumberjs/gulp-dumber-css-module.svg?branch=master)](https://travis-ci.org/dumberjs/gulp-dumber-css-module)

Gulp plugin for using [CSS Module](https://github.com/css-modules/css-modules) with dumber bundler.

## Usage

```js
// Can be used in chain after gulp-sass, gulp-less and gulp-postcss
const sass = require('gulp-sass');
const cssModule = require('gulp-dumber-css-module');
const gulp = require('gulp');

gulp.src('src/**/*.scss')
  .pipe(sass())
  .pipe(cssModule({ /* options */ }));
```

## Options

gulp-dumber-css-module simply wraps [postcss-modules](https://github.com/css-modules/postcss-modules). You can pass all options it supports, except `getJSON()` which is handled internally by gulp-dumber-css-module.


## Background

For CSS `foo.css`:

```css
.title {
    color: green;
}
.article {
    font-size: 16px;
}
```

CSS Module turns it into something like

```css
._title_xkpkl_5 {
    color: green;
}
._article_xkpkl_10 {
    font-size: 16px;
}
```

With a mapping:
```js
{
  "title": "_title_xkpkl_5 _title_116zl_1",
  "article": "_article_xkpkl_10"
}
```

[Interoperable CSS (ICSS)](https://github.com/css-modules/icss) defined that module `foo.css` should return that mapping object.

```js
module.exports = {
  "title": "_title_xkpkl_5 _title_116zl_1",
  "article": "_article_xkpkl_10"
};
```

## dumber's css-module support

This gulp plugin is very simple, it uses [postcss-modules](https://github.com/css-modules/postcss-modules) to compile the source css file, then simply add mapping object inside a comment.

The source `foo.css` vinyl file will be updated with content:

```css
._title_xkpkl_5 {
    color: green;
}
._article_xkpkl_10 {
    font-size: 16px;
}
/* dumber-css-module: {"title": "_title_xkpkl_5 _title_116zl_1", "article": "_article_xkpkl_10"} */
```

This css file will simply loaded by dumber as a text module `text!foo.css`.

The real magic happens at runtime.
When use load `import styles from './foo.css';`, the default implementation of [`ext:css` plugin in dumber](https://github.com/dumberjs/dumber/blob/master/lib/inject-css.js)

1. Load `text!foo.css` module.
2. Inject CSS content onto HTML head.
3. if dumber-css-module json string is present, put that as the module exports instead of original CSS string.
4. if dumber-css-module json string is not present, put original CSS string as the module exports.

## License

MIT.
