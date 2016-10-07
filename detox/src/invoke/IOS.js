var Class = function (value) {
  return {
    type: 'Class',
    value: value
  };
}

var NSInteger = function (value) {
  return {
    type: 'NSInteger',
    value: value
  };
};

var CGPoint = function (value) {
  return {
    type: 'CGPoint',
    value: value
  };
};

var CGRect = function (value) {
  return {
    type: 'CGRect',
    value: value
  };
};

module.exports = {
  Class: Class,
  NSInteger: NSInteger,
  CGPoint: CGPoint,
  CGRect: CGRect
};
