const selectElementContents = `
function selectElementContents(el) {
  el.focus();
  if (el.contentEditable) {
    var range = document.createRange();
    range.selectNodeContents(el);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  } else {
    el.setSelectionRange(0, el.value.length);
  }
}`;

const moveCursorToEnd = `
function moveCursorToEnd(el) {
  el.focus();
  if (typeof window.getSelection != "undefined" && typeof document.createRange != "undefined") {
      var range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
  } else if (typeof document.body.createTextRange != "undefined") {
      var textRange = document.body.createTextRange();
      textRange.moveToElementText(el);
      textRange.collapse(false);
      textRange.select();
  }
}`;

const setCursorPosition = `
  function setPos(pos, el) {
    const isContentEditable = el && el.contentEditable;
    // for ContentEditable field
    if (isContentEditable) {
        el.focus();
        document.getSelection().collapse(el, pos);
        return;
    }
    el.setSelectionRange(pos, pos);
}`;

const focus = `
function focusElement(el) {
  el.focus();
}
`;

const getBoundingClientRect = `
function getBoundingClientRect(el) {
  return el.getBoundingClientRect();
}`;

module.exports = {
  selectElementContents,
  moveCursorToEnd,
  setCursorPosition,
  focus,
  getBoundingClientRect
}