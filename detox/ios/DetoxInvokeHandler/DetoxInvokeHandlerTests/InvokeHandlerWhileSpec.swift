//
//  InvokeHandlerWhileSpec.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2022.
//

@testable import DetoxInvokeHandler

import Quick
import Nimble
import Foundation

class InvokeHandlerWhileSpec: QuickSpec {
  override func spec() {
    var actionDelegate: FakeActionDelegate!
    var expectationDelegate: FakeExpectationDelegate!
    var handler: InvokeHandler!

    var message: [String: AnyHashable]!

    let firstElement = "foo"
    let secondElement = "bar"

    beforeEach {
      let matcher = FakeElementMatcher()
      actionDelegate = .init()
      expectationDelegate = .init()

      handler = .init(
        elementMatcher: matcher,
        actionDelegate: actionDelegate,
        webActionDelegate: FakeWebActionDelegate(),
        expectationDelegate: expectationDelegate,
        webExpectationDelegate: FakeWebExpectationDelegate()
      )

      message = MessageBuilder()
        .setIdPredicate("qux")
        .makeTapAction()
        .waitUntilVisible(id: "quz")
        .build()

      matcher.setMatch(from: .id("qux", isRegex: false), to: firstElement)
      matcher.setMatch(from: .id("quz", isRegex: false), to: secondElement)
    }

    it("should act while expectation is not fulfilled") {
      expectationDelegate.throwCount = 6

      expect(try handler.handle(message)).to(beNil())

      // Fail 6 times, pass on the 7th try.
      expect(expectationDelegate.recorder.count).to(equal(7))

      let expectedRecordedExpectation = (
        Expectation.toBeVisible(threshold: 75),
        true,
        secondElement,
        nil as Double?
      )
      expect(expectationDelegate.recorder.allSatisfy{$0 == expectedRecordedExpectation })
        .to(beTruthy())

      let expectedRecordedAction = (Action.tap(), firstElement)
      expect(actionDelegate.actRecorder.count).to(equal(5))
      expect(actionDelegate.actRecorder.allSatisfy{ $0 == expectedRecordedAction }).to(beTruthy())
    }

    it("should not act if while expectation is already fulfilled") {
      expect(try handler.handle(message)).to(beNil())

      expect(actionDelegate.actRecorder).to(beEmpty())

      let expectedRecordedExpectation = (
        Expectation.toBeVisible(threshold: 75),
        true,
        secondElement,
        nil as Double?
      )
      expect(expectationDelegate.recorder.last).to(equal(expectedRecordedExpectation))
    }
  }
}
