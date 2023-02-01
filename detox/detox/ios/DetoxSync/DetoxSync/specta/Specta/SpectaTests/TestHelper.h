#import <XCTest/XCTest.h>
#import <Specta/Specta.h>

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= 90000 || __MAC_OS_X_VERSION_MAX_ALLOWED >= 101100

@interface XCTestObservationCenter (SPTTestSuspention)

- (void)_suspendObservationForBlock:(void (^)(void))block;

@end

#else

@interface XCTestObservationCenter

+ (id)sharedObservationCenter;
- (void)_suspendObservationForBlock:(void (^)(void))block;

@end

#endif

#define RunSpec(TestClass) RunSpecClass([TestClass class])

XCTestRun *RunSpecClass(Class testClass);

#define assertTrue(expression)        XCTAssertTrue((expression), @"")
#define assertFalse(expression)       XCTAssertFalse((expression), @"")
#define assertNil(a1)                 XCTAssertNil((a1), @"")
#define assertNotNil(a1)              XCTAssertNotNil((a1), @"")
#define assertEqual(a1, a2)           XCTAssertEqual((a1), (a2), @"")
#define assertEqualObjects(a1, a2)    XCTAssertEqualObjects((a1), (a2), @"")
#define assertNotEqual(a1, a2)        XCTAssertNotEqual((a1), (a2), @"")
#define assertNotEqualObjects(a1, a2) XCTAssertNotEqualObjects((a1), (a2), @"")
