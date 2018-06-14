#!/usr/bin/env node

if (!module.parent) {
  // eslint-disable-next-line global-require
  const { register } = require('./global');

  register();
}

const { help, opts } = require('@webpack-contrib/cli-utils');
const chalk = require('chalk');
const cosmiconfig = require('cosmiconfig');
const debug = require('debug')('webpack-serve');
const meow = require('meow');
const importLocal = require('import-local'); // eslint-disable-line import/order

// Prefer the local installation of webpack-serve
/* istanbul ignore if */
if (importLocal(__filename)) {
  debug('Using local install of webpack-serve');
}

const serve = require('./');

const flagOptions = { flags: opts() };
const cli = meow(
  chalk`
{underline Usage}
  $ webpack-serve <config> [...options]

{underline Options}
${help()}

{underline Examples}
  $ webpack-serve ./webpack.config.js --no-reload
  $ webpack-serve --config ./webpack.config.js --port 1337
  $ webpack-serve # config can be omitted for webpack v4+ only
`,
  flagOptions
);

const argv = Object.assign({}, cli.flags);
const explorer = cosmiconfig('serve', {});
let { config } = explorer.searchSync() || {};

if (cli.input.length) {
  [config] = cli.input;
}

serve({ argv, config }).catch(() => {
  process.exit(1);
});