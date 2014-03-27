var jsdom = require('jsdom');

function initDOM() {
  global.window = jsdom.jsdom().createWindow('<html><body></body></html>');
  global.document = window.document;
  global.navigator = window.navigator;
};

function cleanDOM() {
  delete global.window;
  delete global.document;
  delete global.navigator;
};

module.exports = {
  initDOM: initDOM,
  cleanDOM: cleanDOM
};