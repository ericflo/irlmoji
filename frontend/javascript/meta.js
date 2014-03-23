var emoji = require('./emoji');

function getDetailMeta(im, url) {
  var orig = ('https://' + process.env.AWS_S3_BUCKET_NAME +
    '.s3.amazonaws.com/' + im.picture);
  /*
  var resized = orig
    .replace('original', 'resized')
    .replace(/\..{1,5}$/, '.jpg')
    .replace('.jpg', '/1000.jpg');
  */
  var metaTags = [
    '<meta name="twitter:card" content="photo">',
    '<meta name="twitter:site" content="@irlmoji">',
    '<meta name="twitter:creator" content="@' + im.user.username + '">',
    '<meta name="twitter:image" content="' + orig + '">',
    '<meta name="twitter:title" content="' + emoji.EMOJI_DATA[im.emoji][0] + ' ' + url + ' #IRLMoji">',
  ];
  return metaTags.join('\n');
}

module.exports = {
  getDetailMeta: getDetailMeta
};