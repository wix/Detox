function getMainCategory(category) {
  return category ? String(category).split(',', 1)[0] : 'undefined';
}

module.exports = getMainCategory;
