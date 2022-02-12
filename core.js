function getSelected() {
  if (window.getSelection) {
    return window.getSelection();
  } else if (document.getSelection) {
    return document.getSelection();
  } else {
    var selection = document.selection && document.selection.createRange();
    if (selection.text) {
      return selection.text;
    }
    return false;
  }
}

function encodeText(str) {
  return base64.encode(str);
}

function decodeText(str) {
  return base64.decode(str);
}

function encodeImage(image) {
  console.log('image');
}

