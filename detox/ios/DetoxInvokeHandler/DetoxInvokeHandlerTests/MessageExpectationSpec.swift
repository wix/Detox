//
//  MessageExpectationSpec.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2023.
//

@testable import DetoxInvokeHandler

import Quick
import Nimble
import Foundation

class MessageExpectationSpec: QuickSpec {
  override func spec() {
    describe("expectation") {
      var messageBuilder: MessageBuilder!
      let predicate = ElementPredicate(type: .text, value: "foo")

      beforeEach {
        messageBuilder = MessageBuilder().setTextPredicate("foo")
      }

      it("should parse expectation with `not` modifier") {
        let message = messageBuilder.expectToBeFocused().negateExpectation().build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message.defaultInstance(
            type: Message.MessageType.expectation,
            expectation: .toBeFocused,
            modifiers: [.not],
            predicate: predicate
          )
        ))
      }

      it("should parse expectation with timeout") {
        let message = messageBuilder.expectToBeFocused().setTimeout(50).build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message.defaultInstance(
            type: .expectation,
            expectation: .toBeFocused,
            predicate: predicate,
            timeout: 50
          )
        ))
      }

      it("should parse text expectation") {
        let message = messageBuilder.expectToHaveText("foo").build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message.defaultInstance(
            type: .expectation,
            expectation: .toHaveText,
            params: ["foo"],
            predicate: predicate
          )
        ))
      }

      it("should parse id expectation") {
        let message = messageBuilder.expectToHaveId("foo").build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message.defaultInstance(
            type: .expectation,
            expectation: .toHaveId,
            params: ["foo"],
            predicate: predicate
          )
        ))
      }

      it("should parse focus expectation") {
        let message = messageBuilder.expectToBeFocused().build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message.defaultInstance(
            type: .expectation,
            expectation: .toBeFocused,
            predicate: predicate
          )
        ))
      }

      it("should parse visiblity expectation") {
        let message = messageBuilder.expectToBeVisible().build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message.defaultInstance(
            type: .expectation,
            expectation: .toBeVisible,
            predicate: predicate
          )
        ))
      }

      it("should parse visiblity expectation with threshold") {
        let message = messageBuilder.expectToBeVisible(25).build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message.defaultInstance(
            type: .expectation,
            expectation: .toBeVisible,
            params: [25],
            predicate: predicate
          )
        ))
      }

      it("should parse slider position expectation with threshold") {
        let message = messageBuilder.expectToHaveSliderPosition(position: 0.5).build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message.defaultInstance(
            type: .expectation,
            expectation: .toHaveSliderPosition,
            params: [0.5],
            predicate: predicate
          )
        ))
      }

      it("should parse existence expectation") {
        let message = messageBuilder.expectToExist().build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message.defaultInstance(
            type: .expectation,
            expectation: .toExist,
            predicate: predicate
          )
        ))
      }
    }
  }
}
