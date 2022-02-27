//
//  MessageSpec.swift (DetoxMessageHandler)
//  Created by Asaf Korem (Wix.com) on 2022.
//

@testable import DetoxMessageHandler

import Quick
import Nimble
import Foundation

class MessageSpec: QuickSpec {
  override func spec() {
    describe("invalid message") {
      it("should throw for invalid message") {
        let message = ["foo": "bar"]
        expect(try Message(from: message)).to(throwError())
      }
    }

    describe("expectation") {
      var messageBuilder: MessageBuilder!
      let predicate = MessagePredicate.init(type: .text, value: "foo")

      beforeEach {
        messageBuilder = MessageBuilder().setTextPredicate("foo")
      }

      it("should parse expectation with `not` modifier") {
        let message = messageBuilder.expectToBeFocused().negateExpectation().build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message(
            type: .expectation,
            action: nil,
            expectation: .toBeFocused,
            modifiers: [.not],
            atIndex: nil,
            params: nil,
            predicate: predicate,
            while: nil,
            timeout: nil
          )
        ))
      }

      it("should parse expectation with timeout") {
        let message = messageBuilder.expectToBeFocused().setTimeout(50).build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message(
            type: .expectation,
            action: nil,
            expectation: .toBeFocused,
            modifiers: nil,
            atIndex: nil,
            params: nil,
            predicate: predicate,
            while: nil,
            timeout: 50
          )
        ))
      }

      it("should parse text expectation") {
        let message = messageBuilder.expectToHaveText("foo").build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message(
            type: .expectation,
            action: nil,
            expectation: .toHaveText,
            modifiers: nil,
            atIndex: nil,
            params: ["foo"],
            predicate: predicate,
            while: nil,
            timeout: nil
          )
        ))
      }

      it("should parse id expectation") {
        let message = messageBuilder.expectToHaveId("foo").build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message(
            type: .expectation,
            action: nil,
            expectation: .toHaveId,
            modifiers: nil,
            atIndex: nil,
            params: ["foo"],
            predicate: predicate,
            while: nil,
            timeout: nil
          )
        ))
      }

      it("should parse focus expectation") {
        let message = messageBuilder.expectToBeFocused().build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message(
            type: .expectation,
            action: nil,
            expectation: .toBeFocused,
            modifiers: nil,
            atIndex: nil,
            params: nil,
            predicate: predicate,
            while: nil,
            timeout: nil
          )
        ))
      }

      it("should parse visiblity expectation") {
        let message = messageBuilder.expectToBeVisible().build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message(
            type: .expectation,
            action: nil,
            expectation: .toBeVisible,
            modifiers: nil,
            atIndex: nil,
            params: nil,
            predicate: predicate,
            while: nil,
            timeout: nil
          )
        ))
      }

      it("should parse visiblity expectation with threshold") {
        let message = messageBuilder.expectToBeVisible(25).build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message(
            type: .expectation,
            action: nil,
            expectation: .toBeVisible,
            modifiers: nil,
            atIndex: nil,
            params: [25],
            predicate: predicate,
            while: nil,
            timeout: nil
          )
        ))
      }

      it("should parse slider position expectation with threshold") {
        let message = messageBuilder.expectToHaveSliderPosition(position: 0.5).build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message(
            type: .expectation,
            action: nil,
            expectation: .toHaveSliderPosition,
            modifiers: nil,
            atIndex: nil,
            params: [0.5],
            predicate: predicate,
            while: nil,
            timeout: nil
          )
        ))
      }

      it("should parse existence expectation") {
        let message = messageBuilder.expectToExist().build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message(
            type: .expectation,
            action: nil,
            expectation: .toExist,
            modifiers: nil,
            atIndex: nil,
            params: nil,
            predicate: predicate,
            while: nil,
            timeout: nil
          )
        ))
      }
    }

    describe("action") {
      var messageBuilder: MessageBuilder!
      let predicate = MessagePredicate.init(type: .text, value: "foo")

      beforeEach {
        messageBuilder = MessageBuilder().setTextPredicate("foo").at(index: 3)
      }

      it("should parse action with while expectation") {
        let message = messageBuilder.makeTapAction().waitUntilVisible(id: "foo").build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message(
            type: .action,
            action: .tap,
            expectation: nil,
            modifiers: nil,
            atIndex: 3,
            params: nil,
            predicate: predicate,
            while: WhileMessage(
              type: .expectation,
              expectation: .toBeVisible,
              modifiers: nil,
              atIndex: nil,
              params: nil,
              predicate: .init(type: .id, value: "foo", predicates: nil, predicate: nil)
            ),
            timeout: nil
          )
        ))
      }

      it("should parse tap action") {
        let message = messageBuilder.makeTapAction().build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message(
            type: .action,
            action: .tap,
            expectation: nil,
            modifiers: nil,
            atIndex: 3,
            params: nil,
            predicate: predicate,
            while: nil,
            timeout: nil
          )
        ))
      }

      it("should parse tap backspace key action") {
        let message = messageBuilder.makeTapBackspaceKeyAction().build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message(
            type: .action,
            action: .tapBackspaceKey,
            expectation: nil,
            modifiers: nil,
            atIndex: 3,
            params: nil,
            predicate: predicate,
            while: nil,
            timeout: nil
          )
        ))
      }

      it("should parse tap return key action") {
        let message = messageBuilder.makeTapReturnKeyAction().build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message(
            type: .action,
            action: .tapReturnKey,
            expectation: nil,
            modifiers: nil,
            atIndex: 3,
            params: nil,
            predicate: predicate,
            while: nil,
            timeout: nil
          )
        ))
      }

      it("should parse type text action") {
        let message = messageBuilder.makeTypeTextAction("foo").build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message(
            type: .action,
            action: .typeText,
            expectation: nil,
            modifiers: nil,
            atIndex: 3,
            params: ["foo"],
            predicate: predicate,
            while: nil,
            timeout: nil
          )
        ))
      }

      it("should parse replace text action") {
        let message = messageBuilder.makeReplaceTextAction("foo").build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message(
            type: .action,
            action: .replaceText,
            expectation: nil,
            modifiers: nil,
            atIndex: 3,
            params: ["foo"],
            predicate: predicate,
            while: nil,
            timeout: nil
          )
        ))
      }

      it("should parse clear text action") {
        let message = messageBuilder.makeClearTextAction().build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message(
            type: .action,
            action: .clearText,
            expectation: nil,
            modifiers: nil,
            atIndex: 3,
            params: nil,
            predicate: predicate,
            while: nil,
            timeout: nil
          )
        ))
      }

      it("should parse multi-tap action") {
        let message = messageBuilder.makeMultiTapAction(3).build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message(
            type: .action,
            action: .multiTap,
            expectation: nil,
            modifiers: nil,
            atIndex: 3,
            params: [3],
            predicate: predicate,
            while: nil,
            timeout: nil
          )
        ))
      }

      it("should parse scroll-to action") {
        let message = messageBuilder.makeScrollToEdgeAction("left").build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message(
            type: .action,
            action: .scrollTo,
            expectation: nil,
            modifiers: nil,
            atIndex: 3,
            params: ["left"],
            predicate: predicate,
            while: nil,
            timeout: nil
          )
        ))
      }

      it("should parse scroll action") {
        let message = messageBuilder.makeScrollAction(
          offset: 1.1,
          direction: "right",
          startNormalizedPositionX: NSNull(),
          startNormalizedPositionY: NSNull()
        ).build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message(
            type: .action,
            action: .scroll,
            expectation: nil,
            modifiers: nil,
            atIndex: 3,
            params: [1.1, "right", .init(NSNull()), .init(NSNull())],
            predicate: predicate,
            while: nil,
            timeout: nil
          )
        ))
      }

      it("should parse set column to value action") {
        let message = messageBuilder.makeSetColumnToValueAction(23, "foo").build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message(
            type: .action,
            action: .setColumnToValue,
            expectation: nil,
            modifiers: nil,
            atIndex: 3,
            params: [23, "foo"],
            predicate: predicate,
            while: nil,
            timeout: nil
          )
        ))
      }

      it("should parse set date picker action") {
        let message = messageBuilder.makeSetDatePickerDateAction(
          "2022/02/22",
          "yyyy/MM/dd"
        ).build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message(
            type: .action,
            action: .setDatePickerDate,
            expectation: nil,
            modifiers: nil,
            atIndex: 3,
            params: ["2022/02/22", "yyyy/MM/dd"],
            predicate: predicate,
            while: nil,
            timeout: nil
          )
        ))
      }

      it("should parse pinch action") {
        let message = messageBuilder.makePinchAction(1, "slow", 2).build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message(
            type: .action,
            action: .pinch,
            expectation: nil,
            modifiers: nil,
            atIndex: 3,
            params: [1, "slow", 2],
            predicate: predicate,
            while: nil,
            timeout: nil
          )
        ))
      }

      it("should parse adjust slider action") {
        let message = messageBuilder.makeAdjustSliderAction(0.5).build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message(
            type: .action,
            action: .adjustSliderToPosition,
            expectation: nil,
            modifiers: nil,
            atIndex: 3,
            params: [0.5],
            predicate: predicate,
            while: nil,
            timeout: nil
          )
        ))
      }

      it("should parse take-screenshot action") {
        let message = messageBuilder.makeScreenshotAction(name: "foo").build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message(
            type: .action,
            action: .takeScreenshot,
            expectation: nil,
            modifiers: nil,
            atIndex: 3,
            params: ["foo"],
            predicate: predicate,
            while: nil,
            timeout: nil
          )
        ))
      }

      it("should parse swipe action") {
        let message = messageBuilder.makeSwipeAction(
          direction: "down",
          speed: "slow",
          normalizedOffset: NSNull(),
          normalizedStartingPointX: NSNull(),
          normalizedStartingPointY: NSNull()
        ).build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message(
            type: .action,
            action: .swipe,
            expectation: nil,
            modifiers: nil,
            atIndex: 3,
            params: ["down", "slow", .init(NSNull()), .init(NSNull()), .init(NSNull())],
            predicate: predicate,
            while: nil,
            timeout: nil
          )
        ))
      }

      it("should parse get-attributes action") {
        let message = messageBuilder.makeGetAttributesAction().build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message(
            type: .action,
            action: .getAttributes,
            expectation: nil,
            modifiers: nil,
            atIndex: 3,
            params: nil,
            predicate: predicate,
            while: nil,
            timeout: nil
          )
        ))
      }

      it("should parse long press action") {
        let message = messageBuilder.makeLongPressAction().build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message(
            type: .action,
            action: .longPress,
            expectation: nil,
            modifiers: nil,
            atIndex: 3,
            params: nil,
            predicate: predicate,
            while: nil,
            timeout: nil
          )
        ))
      }

      it("should parse long press and drag action") {
        let message = messageBuilder.makeLongPressAction().setDragParams(
          duration: 55,
          normalizedPositionX: 0.3,
          normalizedPositionY: 0.2,
          targetElement: "foo",
          normalizedTargetPositionX: NSNull(),
          normalizedTargetPositionY: NSNull(),
          speed: 22,
          holdDuration: 10
        ).build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message(
            type: .action,
            action: .longPress,
            expectation: nil,
            modifiers: nil,
            atIndex: 3,
            params: [55, 0.3, 0.2, "foo", .init(NSNull()), .init(NSNull()), 22, 10],
            predicate: predicate,
            while: nil,
            timeout: nil
          )
        ))
      }
    }

    describe("predicate") {
      var messageBuilder: MessageBuilder!

      beforeEach {
        messageBuilder = MessageBuilder().makeTapAction()
      }

      it("should parse predicate with `text` type") {
        let message = messageBuilder.setTextPredicate("foo").build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message(
            type: .action,
            action: .tap,
            expectation: nil,
            modifiers: nil,
            atIndex: nil,
            params: nil,
            predicate: .init(type: .text, value: "foo"),
            while: nil,
            timeout: nil
          )
        ))
      }

      it("should parse predicate with `value` type") {
        let message = messageBuilder.setValuePredicate("foo").build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message(
            type: .action,
            action: .tap,
            expectation: nil,
            modifiers: nil,
            atIndex: nil,
            params: nil,
            predicate: .init(type: .value, value: "foo"),
            while: nil,
            timeout: nil
          )
        ))
      }

      it("should parse predicate with `traits` type") {
        let message = messageBuilder.setTraitsPredicate([
          "updatesFrequently",
          "startsMediaSession"
        ]).build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message(
            type: .action,
            action: .tap,
            expectation: nil,
            modifiers: nil,
            atIndex: nil,
            params: nil,
            predicate: .init(
              type: .traits,
              value: ["updatesFrequently", "startsMediaSession"]
            ),
            while: nil,
            timeout: nil
          )
        ))
      }

      it("should parse predicate with `label` type") {
        let message = messageBuilder.setLabelPredicate("bar").build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message(
            type: .action,
            action: .tap,
            expectation: nil,
            modifiers: nil,
            atIndex: nil,
            params: nil,
            predicate: .init(type: .label, value: "bar"),
            while: nil,
            timeout: nil
          )
        ))
      }

      it("should parse predicate with `and` type") {
        let message = messageBuilder.setAndPredicates([
          ("text", "foo"),
          ("label", "bar")
        ]).build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message(
            type: .action,
            action: .tap,
            expectation: nil,
            modifiers: nil,
            atIndex: nil,
            params: nil,
            predicate: .init(type: .and, predicates: [
              .init(type: .text, value: "foo"),
              .init(type: .label, value: "bar")
            ]),
            while: nil,
            timeout: nil
          )
        ))
      }

      it("should parse predicate with child and ancestor ids") {
        let message = messageBuilder.setChildWithAncestorPredicate("foo", "bar").build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message(
            type: .action,
            action: .tap,
            expectation: nil,
            modifiers: nil,
            atIndex: nil,
            params: nil,
            predicate: .init(type: .and, predicates: [
              .init(type: .id, value: "foo"),
              .init(type: .ancestor, predicate: .init(type: .id, value: "bar"))
            ]),
            while: nil,
            timeout: nil
          )
        ))
      }

      it("should parse predicate with parent and decendant ids") {
        let message = messageBuilder.setParentWithDecendantPredicate("foo", "bar").build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message(
            type: .action,
            action: .tap,
            expectation: nil,
            modifiers: nil,
            atIndex: nil,
            params: nil,
            predicate: .init(type: .and, predicates: [
              .init(type: .id, value: "foo"),
              .init(type: .decendant, predicate: .init(type: .id, value: "bar"))
            ]),
            while: nil,
            timeout: nil
          )
        ))
      }
    }
  }
}
