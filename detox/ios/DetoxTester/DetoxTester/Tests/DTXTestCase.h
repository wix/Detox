//
//  DTXTestCase.h (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

#import <XCTest/XCTest.h>

/// Class for test cases for testing DetoxTester's internal components (integration tests).
/// Invokes nothing when running from Detox Server.
@interface DTXTestCase : XCTestCase
@end
