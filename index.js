'use strict';
const {Transform} = require('stream');
const postcss = require('postcss');
const cssModules = require('postcss-modules');
const applySourceMap = require('vinyl-sourcemaps-apply');
const fancyLog = require('fancy-log');
const PluginError = require('plugin-error');
const path = require('path');

const PLUGIN_NAME = 'gulp-dumber-css-module';

module.exports = function(options = {}) {
  return new Transform({
    objectMode: true,
    transform(file, enc, cb) {
      if (file.isStream()) {
        cb(new PluginError(PLUGIN_NAME, 'Streaming is not supported'));
        return;
      }
      if (file.isBuffer() && file.extname === '.css') {
        let exportedTokens;
        const getJSON = (cssFileName, json) => {
          exportedTokens = json;
        };

        const postcssOptions = {
          from: file.path,
          to: file.path,
          // Generate a separate source map for gulp-sourcemaps
          map: file.sourceMap ? { annotation: false } : false
        }
        postcss([cssModules(Object.assign({}, options, {getJSON}))])
          .process(file.contents, postcssOptions)
          .then(
            result => {
              const warnings = result.warnings().join('\n');

              file.contents = Buffer.from(
                result.css +
                '\n/* dumber-css-module: ' +
                JSON.stringify(exportedTokens) +
                ' */\n'
              );

              // Apply source map to the chain
              if (file.sourceMap) {
                const map = result.map.toJSON();
                map.file = file.relative;
                map.sources = map.sources.map(source =>
                  path.join(path.dirname(file.relative), source)
                );
                applySourceMap(file, map);
              }

              if (warnings) {
                fancyLog.info(PLUGIN_NAME, file.relative + '\n' + warnings)
              }

              cb(null, file);
            },
            cb
          )
      } else {
        // bypass
        cb(null, file);
      }
    }
  })
};
