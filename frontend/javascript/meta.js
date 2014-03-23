var emoji = require('./emoji');

function getDetailMeta(im, url) {
  var pic = ('https://' + process.env.AWS_S3_BUCKET_NAME +
    '.s3.amazonaws.com/' + im.picture);
  var metaTags = [
    '<meta name="twitter:card" content="photo">',
    '<meta name="twitter:site" content="@irlmoji">',
    '<meta name="twitter:creator" content="@' + im.user.username + '">',
    '<meta name="twitter:image" content="' + pic + '">',
    '<meta name="twitter:title" content="' + emoji.EMOJI_DATA[im.emoji][0] + '">',
  ];
  return metaTags.join('\n');
}

module.exports = {
  getDetailMeta: getDetailMeta
};