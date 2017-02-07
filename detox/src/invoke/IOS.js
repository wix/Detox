const Class = (value) => {
  return {
    type: 'Class',
    value: value
  };
};

const NSInteger = (value) => {
  return {
    type: 'NSInteger',
    value: value
  };
};

const CGFloat = (value) => {
  return {
    type: 'CGFloat',
    value: value
  };
};

const CGPoint = (value) => {
  return {
    type: 'CGPoint',
    value: value
  };
};

const CGRect = (value) => {
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
