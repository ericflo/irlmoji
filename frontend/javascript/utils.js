var _ = require('lodash/dist/lodash.underscore');
var fs = require('fs');

function openDialog(url, id, width, height) {
  var windowOptions = 'scrollbars=yes,resizable=yes,toolbar=no,location=yes';
  var winHeight = screen.height;
  var winWidth = screen.width;
  var left = Math.round((winWidth / 2) - (width / 2));
  var top = 0;
  if (winHeight > height) {
    top = Math.round((winHeight / 2) - (height / 2));
  }
  return window.open(
    url,
    id,
    windowOptions + ',width=' + width + ',height=' + height +
      ',left=' + left + ',top=' + top
  );
}

function readEnv() {
  var fileData;
  try {
    fileData = fs.readFileSync('env.json');
  } catch (e) {
    if (e.code === 'ENOENT') {
      return console.log(ENV_WARNING);
    }
  }
  var data;
  try {
    data = JSON.parse(fileData);
  } catch (e) {
    return console.log(ENV_WARNING);
  }
  _.each(data, function(value, key) {
    process.env[key] = value;
  }, this);
}

module.exports = {
  openDialog: openDialog,
  readEnv: readEnv
};