//
//  InvokeHandlerExpectationSpec.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2023.
//

@testable import DetoxInvokeHandler

import Quick
import Nimble
import Foundation

class InvokeHandlerExpectationSpec: QuickSpec {
  override func spec() {
    var expectationDelegate: FakeExpectationDelegate!
    var handler: InvokeHandler!
    var messageBuilderWithPredicate: MessageBuilder!

    let element = "foo"

    beforeEach {
      expectationDelegate = .init()
      let matcher = FakeElementMatcher()

      handler = .init(
        elementMatcher: matcher,
        actionDelegate: FakeActionDelegate(),
        webActionDelegate: FakeWebActionDelegate(),
        expectationDelegate: expectationDelegate,
        webExpectationDelegate: FakeWebExpectationDelegate()
      )

      messageBuilderWithPredicate = MessageBuilder().setTextPredicate("bar")

      matcher.setMatch(from: .text("bar", isRegex: false), to: element)
    }

    it("should throw if expectation delegate is throwing") {
      let message = messageBuilderWithPredicate.expectToBeFocused().negateExpectation().build()

      expectationDelegate.throwCount = 1

      expect { try handler.handle(message) }.to(throwError(FakeExpectationDelegate.Error()))
    }

    it("should call delegate with negated expectation") {
      let message = messageBuilderWithPredicate.expectToBeFocused().negateExpectation().build()

      expect(try handler.handle(message)).to(beNil())

      let expected = (Expectation.toBeFocused, false, element, nil as Double?)
      expect(expectationDelegate.recorder.last).to(equal(expected))
    }

    it("should call delegate with timeout") {
      let message = messageBuilderWithPredicate.expectToBeFocused().setTimeout(0.5).build()

      expect(try handler.handle(message)).to(beNil())

      let expected = (Expectation.toBeFocused, true, element, 0.5)
      expect(expectationDelegate.recorder.last).to(equal(expected))
    }

    it("should call delegate for focus expectation") {
      let message = messageBuilderWithPredicate.expectToBeFocused().build()

      expect(try handler.handle(message)).to(beNil())

      let expected = (Expectation.toBeFocused, true, element, nil as Double?)
      expect(expectationDelegate.recorder.last).to(equal(expected))
    }

    it("should call delegate for text expectation") {
      let message = messageBuilderWithPredicate.expectToHaveText("foo").build()

      expect(try handler.handle(message)).to(beNil())

      let expected = (Expectation.toHaveText("foo"), true, element, nil as Double?)
      expect(expectationDelegate.recorder.last).to(equal(expected))
    }

    it("should call delegate for id expectation") {
      let message = messageBuilderWithPredicate.expectToHaveId("foo").build()

      expect(try handler.handle(message)).to(beNil())

      let expected = (Expectation.toHaveId("foo"), true, element, nil as Double?)
      expect(expectationDelegate.recorder.last).to(equal(expected))
    }

    it("should call delegate for visibility expectation with default value") {
      let message = messageBuilderWithPredicate.expectToBeVisible().build()

      expect(try handler.handle(message)).to(beNil())

      let expected = (Expectation.toBeVisible(threshold: 75), true, element, nil as Double?)
      expect(expectationDelegate.recorder.last).to(equal(expected))
    }

    it("should call delegate for visibility expectation with threshold") {
      let message = messageBuilderWithPredicate.expectToBeVisible(25).build()

      expect(try handler.handle(message)).to(beNil())

      let expected = (Expectation.toBeVisible(threshold: 25), true, element, nil as Double?)
      expect(expectationDelegate.recorder.last).to(equal(expected))
    }

    it("should call delegate for slider position expectation with tolerance") {
      let message = messageBuilderWithPredicate
        .expectToHaveSliderPosition(position: 0.6, tolerance: 0.00001).build()

      expect(try handler.handle(message)).to(beNil())

      let expected = (
        Expectation.toHaveSliderInPosition(normalizedPosition: 0.6, tolerance: 0.00001),
        true,
        element,
        nil as Double?
      )
      expect(expectationDelegate.recorder.last).to(equal(expected))
    }

    it("should call delegate for slider not in position expectation") {
      let message = messageBuilderWithPredicate.expectToHaveSliderPosition(position: 0.6)
        .negateExpectation().build()

      expect(try handler.handle(message)).to(beNil())

      let expected = (
        Expectation.toHaveSliderInPosition(normalizedPosition: 0.6, tolerance: nil),
        false,
        element,
        nil as Double?
      )
      expect(expectationDelegate.recorder.last).to(equal(expected))
    }

    it("should call delegate for existence expectation") {
      let message = messageBuilderWithPredicate.expectToExist().build()

      expect(try handler.handle(message)).to(beNil())

      let expected = (Expectation.toExist, true, element, nil as Double?)
      expect(expectationDelegate.recorder.last).to(equal(expected))
    }
  }
}
