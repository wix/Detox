function assertExistingContext(context) {
  if (!context) {
    const error = new Error(`Please add both arguments to super() call in your environment constructor, e.g.:

 class CustomDetoxEnvironment extends DetoxCircusEnvironment {
-  constructor(config) {
-    super(config);
+  constructor(config, context) {
+    super(config, context);

Cannot proceed further. Please fix your custom Detox environment class.`);

    throw error;
  }

  return context;
}

module.exports = assertExistingContext;
