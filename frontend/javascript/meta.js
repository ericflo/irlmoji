function getDetailMeta(im) {
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
    '<meta name="twitter:image" content="' + orig + '">'
  ];
  return metaTags.join('\n');
}

module.exports = {
  getDetailMeta: getDetailMeta
};