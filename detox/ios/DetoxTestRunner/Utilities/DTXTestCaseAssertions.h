//
//  DTXTestCaseAssertions.h
//  Detox
//
//  Created by Alon Haiut on 10/10/2021.
//  Copyright © 2021 Wix. All rights reserved.
//

@import XCTest;

#ifndef DTXTestCaseAssertions_h
#define DTXTestCaseAssertions_h

extern XCTestCase* _XCTCurrentTestCase(void);

#define DTXFail(...) \
	_XCTPrimitiveFail(_XCTCurrentTestCase(), __VA_ARGS__)

#endif /* DTXTestCaseAssertions_h */

