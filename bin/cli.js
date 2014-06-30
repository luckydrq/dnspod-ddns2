#!/usr/bin/env node

var argv = require('minimist')(process.argv.slice(2));
var pkg = require('../package.json');

if (argv.v || argv.version) {
  console.log(pkg.version);
  process.exit(0);
}

if (argv.h || argv.help) {
  console.log(' Usage:');
  console.log('');
  console.log(' --domain_name=[your domain name]');
  console.log(' --login_email=[your login_email of dnspod]');
  console.log(' --login_password=[your login_email of dnspod]');
  console.log(' --timeout=[frequecy to invoke ddns, default to 30s];');
  process.exit(0);
}

if (!argv.login_email) {
  console.error('[login_email] is required!');
  process.exit(1);
}

if (!argv.login_password) {
  console.error('[login_password] is required!');
  process.exit(1);
}


global.login_email = argv.login_email;
global.login_password = argv.login_password;
global.domain_name = argv.domain_name;

var timeout = parseInt(argv.timeout, 10);
global.timeout = !isNaN(timeout) ? timeout * 1000 : 30000;

require('..')(global.timeout);
