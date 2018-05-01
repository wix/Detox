
#import <EarlGrey/GREYConstants.h>
#import <EarlGrey/GREYDefines.h>
#import <Foundation/Foundation.h>

@protocol GREYAction;

/**
 *  A interface that exposes UI element actions.
 */
@interface GREYActions : NSObject

// Single Line Comment here
+ (id<GREYAction>)actionForMultipleTapsWithCount:(NSUInteger)count;

/**
 * Multi Line Comment here
 * Awesome
 */
+ (id<GREYAction>)actionForMultipleTapsWithCount:(NSUInteger)count atPoint:(CGPoint)point;

/**
 *  Returns a scroll action that scrolls in a @c direction for an @c amount of points starting from
 *  the given start point specified as percentages. @c xOriginStartPercentage is the x start
 *  position as a percentage of the total width of the scrollable visible area,
 *  @c yOriginStartPercentage is the y start position as a percentage of the total height of the
 *  scrollable visible area. @c xOriginStartPercentage and @c yOriginStartPercentage must be between
 *  0 and 1, exclusive.
 *
 *  @param direction              The direction of the scroll.
 *  @param amount                 The amount scroll in points to inject.
 *  @param xOriginStartPercentage X coordinate of the start point specified as a percentage (0, 1)
 *                                exclusive, of the total width of the scrollable visible area.
 *  @param yOriginStartPercentage Y coordinate of the start point specified as a percentage (0, 1)
 *                                exclusive, of the total height of the scrollable visible area.
 *
 *  @return A GREYAction that scrolls a scroll view in a given @c direction for a given @c amount
 *          starting from the given start points.
 */
+ (id<GREYAction>)actionForScrollInDirection:(GREYDirection)direction
                                      amount:(CGFloat)amount
                      xOriginStartPercentage:(CGFloat)xOriginStartPercentage
                      yOriginStartPercentage:(CGFloat)yOriginStartPercentage;

/**
 *  Returns an action that uses the iOS keyboard to input a string.
 *
 *  @param text The text to be typed. For Objective-C, backspace is supported by using "\b" in the
 *              string and "\u{8}" in Swift strings. Return key is supported with "\n".
 *              For Example: @"Helpo\b\bloWorld" will type HelloWorld in Objective-C.
 *                           "Helpo\u{8}\u{8}loWorld" will type HelloWorld in Swift.
 *
 *  @return A GREYAction to type a specific text string in a text field.
 */
+ (id<GREYAction>)actionForTypeText:(NSString *)text;

/**
 *  @return A GREYAction that scrolls to the given content @c edge of a scroll view.
 */
+ (id<GREYAction>)actionForScrollToContentEdge:(GREYContentEdge)edge;

+ (id<GREYAction>)actionWithUnknownType:(WTFType *)wat;
+ (id<GREYAction>)actionWithKnown:(NSUInteger)iknowdis andUnknownType:(WTFTypalike *)wat;
+ (id<GREYMatcher>)detoxMatcherForBoth:(id<GREYMatcher>)firstMatcher andAncestorMatcher:(id<GREYMatcher>)ancestorMatcher;


// This method is an instance method
// For us this means that we don't set the class type, but let it be set from the outside
// This is an assumption based on our current experience with EarlGrey, we might need to rework this at some point
- (instancetype)performAction:(NSString *)action;