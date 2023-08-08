//
//  InvokeHandlerWebExpectationSpec.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2023.
//

@testable import DetoxInvokeHandler

import Quick
import Nimble
import Foundation

class InvokeHandlerWebExpectationSpec: QuickSpec {
  override func spec() {
    var webExpectationDelegate: FakeWebExpectationDelegate!
    var handler: InvokeHandler!
    var messageBuilderWithPredicate: MessageBuilder!

    let element = "foo"
    let webElement = "bar"

    beforeEach {
      webExpectationDelegate = .init()
      let matcher = FakeElementMatcher()

      handler = .init(
        elementMatcher: matcher,
        actionDelegate: FakeActionDelegate(),
        webActionDelegate: FakeWebActionDelegate(),
        expectationDelegate: FakeExpectationDelegate(),
        webExpectationDelegate: webExpectationDelegate
      )

      messageBuilderWithPredicate = MessageBuilder().setTextPredicate("bar").setIdWebPredicate("id")

      matcher.setMatch(from: .text("bar", isRegex: false), to: element)
      matcher.setWebMatch(from: .id("id"), to: webElement)
    }

    it("should throw if expectation delegate is throwing") {
      let message = messageBuilderWithPredicate.webExpectToExist().negateExpectation().build()

      webExpectationDelegate.throwCount = 1

      expect { try handler.handle(message) }.to(throwError(FakeWebExpectationDelegate.Error()))
    }

    it("should call delegate with negated expectation") {
      let message = messageBuilderWithPredicate.webExpectToExist().webNegateExpectation().build()

      expect(try handler.handle(message)).to(beNil())

      let expected = (WebExpectation.toExist, false, webElement)
      expect(webExpectationDelegate.recorder.last).to(equal(expected))
    }

    it("should call delegate for existence expectation") {
      let message = messageBuilderWithPredicate.webExpectToExist().build()

      expect(try handler.handle(message)).to(beNil())

      let expected = (WebExpectation.toExist, true, webElement)
      expect(webExpectationDelegate.recorder.last).to(equal(expected))
    }

    it("should call delegate for text expectation") {
      let message = messageBuilderWithPredicate.webExpectToHaveText("foo").build()

      expect(try handler.handle(message)).to(beNil())

      let expected = (WebExpectation.toHaveText("foo"), true, webElement)
      expect(webExpectationDelegate.recorder.last).to(equal(expected))
    }
  }
}
