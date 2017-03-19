#! /usr/bin/env node
const log = require('npmlog');
const DetoxServer = require('./DetoxServer');

log.addLevel('wss', 999, {fg: 'blue', bg: 'black'}, 'wss');
log.level = 'wss';

const detoxServer = new DetoxServer(8099);
