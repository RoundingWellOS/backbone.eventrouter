if (!global.document || !global.window) {

  var jsdom = require('jsdom').jsdom;

  global.document = jsdom('<html><head><script></script></head><body><div id="testDiv"></div></body></html>', {
    FetchExternalResources: ['script'],
    ProcessExternalResources: ['script']
  });

  global.window = document.defaultView;
  global.navigator = global.window.navigator;
  global.location = global.window.location;
}

global.$ = global.jQuery = require('jquery');

global.chai = require('chai');
global.sinon = require('sinon');
global.chai.use(require('sinon-chai'));

require('babel/register');
require('./setup')();
