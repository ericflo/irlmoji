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

module.exports = {
  openDialog: openDialog
};