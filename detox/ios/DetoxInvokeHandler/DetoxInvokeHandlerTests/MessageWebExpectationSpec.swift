//
//  MessageWebExpectationSpec.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2023.
//

@testable import DetoxInvokeHandler

import Quick
import Nimble
import Foundation

class MessageWebExpectationSpec: QuickSpec {
  override func spec() {
    describe("web expectation") {
      var messageBuilder: MessageBuilder!

      beforeEach {
        messageBuilder = MessageBuilder()
      }

      it("should parse `toExist` web-expectation") {
        let message = messageBuilder.setNameWebPredicate("foo").webExpectToExist().build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message.defaultInstance(
            type: .webExpectation,
            webExpectation: .toExist,
            webPredicate: .init(type: .name, value: "foo")
          )
        ))
      }

      it("should parse `toHaveText` web-expectation") {
        let message = messageBuilder.setNameWebPredicate("foo").webExpectToHaveText("bar").build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message.defaultInstance(
            type: .webExpectation,
            webExpectation: .toHaveText,
            params: ["bar"],
            webPredicate: .init(type: .name, value: "foo")
          )
        ))
      }
    }
  }
}
