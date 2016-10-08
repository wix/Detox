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

var CGFloat = function (value) {
  return {
    type: 'CGFloat',
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
  CGFloat: CGFloat,
  CGPoint: CGPoint,
  CGRect: CGRect
};
