#import "FTRBaseIntegrationTest.h"

@interface FTRActionSheetTest : FTRBaseIntegrationTest
@end

@implementation FTRActionSheetTest

- (void)setUp {
  [super setUp];
  [self openTestViewNamed:@"Action Sheets"];
}

- (void)testSimpleActionSheet {
  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"simpleActionSheetButton")]
      performAction:grey_tap()];
  [[EarlGrey selectElementWithMatcher:grey_text(@"Action Sheet")]
      assertWithMatcher:grey_sufficientlyVisible()];
  [[EarlGrey selectElementWithMatcher:grey_text(@"Simple Button")]
      performAction:grey_tap()];
  [[EarlGrey selectElementWithMatcher:grey_text(@"Action Sheet Button Pressed")]
      assertWithMatcher:grey_sufficientlyVisible()];

  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"simpleActionSheetButton")]
      performAction:grey_tap()];
  [[EarlGrey selectElementWithMatcher:grey_text(@"Action Sheet")]
      assertWithMatcher:grey_sufficientlyVisible()];
  if (UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPhone) {
    [[EarlGrey selectElementWithMatcher:grey_text(@"Cancel")]
        performAction:grey_tap()];
  } else {
    [[EarlGrey selectElementWithMatcher:grey_keyWindow()]
        performAction:grey_tapAtPoint(CGPointMake(50, 50))];
  }
  [[EarlGrey selectElementWithMatcher:grey_text(@"Actions Verified Here")]
      assertWithMatcher:grey_sufficientlyVisible()];
}

- (void)testMultipleActionSheet {
  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"multipleActionSheetButton")]
      performAction:grey_tap()];
  [[EarlGrey selectElementWithMatcher:grey_text(@"Action Sheet")]
      assertWithMatcher:grey_sufficientlyVisible()];
  [[EarlGrey selectElementWithMatcher:grey_text(@"Simple Button")]
      performAction:grey_tap()];
  [[EarlGrey selectElementWithMatcher:grey_text(@"Action Sheet Button Pressed")]
      assertWithMatcher:grey_sufficientlyVisible()];

  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"multipleActionSheetButton")]
      performAction:grey_tap()];
  [[EarlGrey selectElementWithMatcher:grey_text(@"Action Sheet")]
      assertWithMatcher:grey_sufficientlyVisible()];
  if (UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPhone) {
    [[EarlGrey selectElementWithMatcher:grey_text(@"Cancel")]
        performAction:grey_tap()];
  } else {
    [[EarlGrey selectElementWithMatcher:grey_keyWindow()]
        performAction:grey_tapAtPoint(CGPointMake(50, 50))];
  }
  [[EarlGrey selectElementWithMatcher:grey_text(@"Actions Verified Here")]
      assertWithMatcher:grey_sufficientlyVisible()];

  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"multipleActionSheetButton")]
      performAction:grey_tap()];
  [[EarlGrey selectElementWithMatcher:grey_text(@"Action Sheet")]
      assertWithMatcher:grey_sufficientlyVisible()];
  [[EarlGrey selectElementWithMatcher:grey_text(@"Hide Button")]
      performAction:grey_tap()];
  [[EarlGrey selectElementWithMatcher:grey_text(@"")]
      assertWithMatcher:grey_sufficientlyVisible()];
  [[EarlGrey selectElementWithMatcher:grey_accessibilityLabel(@"multipleActionSheetButton")]
      assertWithMatcher:grey_notVisible()];
}

@end
