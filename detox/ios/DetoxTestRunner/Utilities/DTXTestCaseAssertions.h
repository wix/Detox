//
//  DTXTestCaseAssertions.h
//  Detox
//
//  Created by Leo Natan (Wix) on 2/21/20.
//

@import XCTest;

#ifndef DTXTestCaseAssertions_h
#define DTXTestCaseAssertions_h

extern XCTestCase* _XCTCurrentTestCase(void);

#define DTXFail(...) \
	_XCTPrimitiveFail(_XCTCurrentTestCase(), __VA_ARGS__)

#endif /* DTXTestCaseAssertions_h */
