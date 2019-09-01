'use strict';
const test = require('tape');
const Vinyl = require('vinyl');
const streamArray = require('stream-array');
const streamAssert = require('stream-assert');
const cssModule = require('./index');
const path = require('path');
const { Readable } = require('stream');
const cwd = process.cwd();

test('cssModule does not support streaming', t => {
  const a = new Vinyl({
    cwd,
    base: path.join(cwd, 'src'),
    path: path.join(cwd, 'src', 'app.js'),
    contents: new Readable({})
  });

  streamArray([a])
    .pipe(cssModule())
    .once('error', function (err) {
      t.equal(err.message, 'Streaming is not supported');
      t.end();
    });
});

test('gulp-dumber-css-modules ignores non-css file', t => {
  const a = new Vinyl({
    cwd,
    base: path.join(cwd, 'src'),
    path: path.join(cwd, 'src', 'app.js'),
    contents: Buffer.from("lorem")
  });

  streamArray([a])
    .pipe(cssModule())
    .once('error', function (err) {
      t.fail(err.message);
      t.end();
    })
    .pipe(streamAssert.length(1))
    .pipe(streamAssert.first(f => {
      t.equal(f.path, a.path);
      t.equal(f.contents.toString(), a.contents.toString());
      t.notOk(f.sourceMap);
    }))
    .pipe(streamAssert.end(t.end));
});

test('gulp-dumber-css-modules transforms css file', t => {
  const a = new Vinyl({
    cwd,
    base: path.join(cwd, 'src'),
    path: path.join(cwd, 'src', 'app.css'),
    contents: Buffer.from(".a { color: red; }")
  });

  streamArray([a])
    .pipe(cssModule())
    .once('error', function (err) {
      t.fail(err.message);
      t.end();
    })
    .pipe(streamAssert.length(1))
    .pipe(streamAssert.first(f => {
      t.equal(f.path, a.path);
      const contents = f.contents.toString();
      const m = contents.match(/^\.(\S+) { color: red; }\n\/\* dumber-css-module: {"a":"\1"} \*\/\n$/);
      t.ok(m);
      t.notOk(f.sourceMap);
    }))
    .pipe(streamAssert.end(t.end));
});

test('gulp-dumber-css-modules transforms css file with sourceMap', t => {
  const a = new Vinyl({
    cwd,
    base: path.join(cwd, 'src'),
    path: path.join(cwd, 'src', 'app.css'),
    contents: Buffer.from(".a { color: red; }"),
  });

  a.sourceMap = {
    version: 3,
    file: 'app.css',
    sources: ['app.scss'],
    mappings: 'AAAA',
    sourcesContent: [".a { color: red; }"]
  };

  streamArray([a])
    .pipe(cssModule())
    .once('error', function (err) {
      t.fail(err.message);
      t.end();
    })
    .pipe(streamAssert.length(1))
    .pipe(streamAssert.first(f => {
      t.equal(f.path, a.path);
      const contents = f.contents.toString();
      const m = contents.match(/^\.(\S+) { color: red; }\n\/\* dumber-css-module: {"a":"\1"} \*\/\n$/);
      t.ok(m);
      t.ok(f.sourceMap);
      t.equal(f.sourceMap.file, 'app.css');
      t.equal(f.sourceMap.mappings, 'AAAA,cAAA,UAAA,EAAA');
      t.deepEqual(f.sourceMap.sourcesContent, [".a { color: red; }"]);
      t.deepEqual(f.sourceMap.sources, ['app.scss']);
    }))
    .pipe(streamAssert.end(t.end));
});

