//
//  MessageActionSpec.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2023.
//

@testable import DetoxInvokeHandler

import Quick
import Nimble
import Foundation

class MessageWebActionSpec: QuickSpec {
  override func spec() {
    describe("web action") {
      var messageBuilder: MessageBuilder!

      let predicate = ElementPredicate.init(type: .text, value: "foo")
      let webPredicate = WebPredicate(type: .name, value: "bar")

      beforeEach {
        messageBuilder = MessageBuilder()
          .setTextPredicate("foo").at(index: 3)
          .setNameWebPredicate("bar").webAt(index: 1)
      }

      it("should parse tap action") {
        let message = messageBuilder.makeWebTapAction().build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message.defaultInstance(
            type: .webAction,
            webAction: .tap,
            atIndex: 3,
            webAtIndex: 1,
            predicate: predicate,
            webPredicate: webPredicate
          )
        ))
      }

      it("should parse type-text action") {
        let message = messageBuilder.makeWebTypeTextAction("baz").build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message.defaultInstance(
            type: .webAction,
            webAction: .typeText,
            atIndex: 3,
            webAtIndex: 1,
            params: ["baz"],
            predicate: predicate,
            webPredicate: webPredicate
          )
        ))
      }

      it("should parse replace-text action") {
        let message = messageBuilder.makeWebReplaceTextAction("baz").build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message.defaultInstance(
            type: .webAction,
            webAction: .replaceText,
            atIndex: 3,
            webAtIndex: 1,
            params: ["baz"],
            predicate: predicate,
            webPredicate: webPredicate
          )
        ))
      }

      it("should parse clear-text action") {
        let message = messageBuilder.makeWebClearTextAction().build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message.defaultInstance(
            type: .webAction,
            webAction: .clearText,
            atIndex: 3,
            webAtIndex: 1,
            predicate: predicate,
            webPredicate: webPredicate
          )
        ))
      }

      it("should parse select-all-text action") {
        let message = messageBuilder.makeWebSelectAllTextAction().build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message.defaultInstance(
            type: .webAction,
            webAction: .selectAllText,
            atIndex: 3,
            webAtIndex: 1,
            predicate: predicate,
            webPredicate: webPredicate
          )
        ))
      }

      it("should parse get-text action") {
        let message = messageBuilder.makeWebGetTextAction().build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message.defaultInstance(
            type: .webAction,
            webAction: .getText,
            atIndex: 3,
            webAtIndex: 1,
            predicate: predicate,
            webPredicate: webPredicate
          )
        ))
      }

      it("should parse scroll-to-view action") {
        let message = messageBuilder.makeWebScrollToViewAction().build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message.defaultInstance(
            type: .webAction,
            webAction: .scrollToView,
            atIndex: 3,
            webAtIndex: 1,
            predicate: predicate,
            webPredicate: webPredicate
          )
        ))
      }

      it("should parse focus action") {
        let message = messageBuilder.makeWebFocusAction().build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message.defaultInstance(
            type: .webAction,
            webAction: .focus,
            atIndex: 3,
            webAtIndex: 1,
            predicate: predicate,
            webPredicate: webPredicate
          )
        ))
      }

      it("should parse move-cursor-to-end action") {
        let message = messageBuilder.makeWebMoveCursorToEndAction().build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message.defaultInstance(
            type: .webAction,
            webAction: .moveCursorToEnd,
            atIndex: 3,
            webAtIndex: 1,
            predicate: predicate,
            webPredicate: webPredicate
          )
        ))
      }

      it("should parse run-script action") {
        let message = messageBuilder.makeWebRunScriptAction("baz").build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message.defaultInstance(
            type: .webAction,
            webAction: .runScript,
            atIndex: 3,
            webAtIndex: 1,
            params: ["baz"],
            predicate: predicate,
            webPredicate: webPredicate
          )
        ))
      }

      it("should parse run-script-with-args action") {
        let message = messageBuilder.makeWebRunScriptWithArgsAction(
          "baz",
          args: ["qux", "quux"]
        ).build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message.defaultInstance(
            type: .webAction,
            webAction: .runScriptWithArgs,
            atIndex: 3,
            webAtIndex: 1,
            params: ["baz", ["qux", "quux"]],
            predicate: predicate,
            webPredicate: webPredicate
          )
        ))
      }

      it("should parse get-current-url action") {
        let message = messageBuilder.makeWebGetCurrentUrlAction().build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message.defaultInstance(
            type: .webAction,
            webAction: .getCurrentUrl,
            atIndex: 3,
            webAtIndex: 1,
            predicate: predicate,
            webPredicate: webPredicate
          )
        ))
      }

      it("should parse get-title action") {
        let message = messageBuilder.makeWebGetTitleAction().build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message.defaultInstance(
            type: .webAction,
            webAction: .getTitle,
            atIndex: 3,
            webAtIndex: 1,
            predicate: predicate,
            webPredicate: webPredicate
          )
        ))
      }
    }
  }
}
