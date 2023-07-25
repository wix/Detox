//
//  MessageSpec.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2022.
//

@testable import DetoxInvokeHandler

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

    describe("action") {
      var messageBuilder: MessageBuilder!
      let predicate = ElementPredicate.init(type: .text, value: "foo")

      beforeEach {
        messageBuilder = MessageBuilder().setTextPredicate("foo").at(index: 3)
      }

      it("should parse action with while expectation") {
        let message = messageBuilder.makeTapAction().waitUntilVisible(id: "foo").build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message.defaultInstance(
            type: .action,
            action: .tap,
            atIndex: 3,
            predicate: predicate,
            while: WhileMessage.defaultInstance(
              type: .expectation,
              expectation: .toBeVisible,
              predicate: .init(type: .id, value: "foo")
            )
          )
        ))
      }

      it("should parse tap action") {
        let message = messageBuilder.makeTapAction().build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message.defaultInstance(
            type: .action,
            action: .tap,
            atIndex: 3,
            predicate: predicate
          )
        ))
      }

      it("should parse tap backspace key action") {
        let message = messageBuilder.makeTapBackspaceKeyAction().build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message.defaultInstance(
            type: .action,
            action: .tapBackspaceKey,
            atIndex: 3,
            predicate: predicate
          )
        ))
      }

      it("should parse tap return key action") {
        let message = messageBuilder.makeTapReturnKeyAction().build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message.defaultInstance(
            type: .action,
            action: .tapReturnKey,
            atIndex: 3,
            predicate: predicate
          )
        ))
      }

      it("should parse type text action") {
        let message = messageBuilder.makeTypeTextAction("foo").build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message.defaultInstance(
            type: .action,
            action: .typeText,
            atIndex: 3,
            params: ["foo"],
            predicate: predicate
          )
        ))
      }

      it("should parse replace text action") {
        let message = messageBuilder.makeReplaceTextAction("foo").build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message.defaultInstance(
            type: .action,
            action: .replaceText,
            atIndex: 3,
            params: ["foo"],
            predicate: predicate
          )
        ))
      }

      it("should parse clear text action") {
        let message = messageBuilder.makeClearTextAction().build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message.defaultInstance(
            type: .action,
            action: .clearText,
            atIndex: 3,
            predicate: predicate
          )
        ))
      }

      it("should parse multi-tap action") {
        let message = messageBuilder.makeMultiTapAction(3).build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message.defaultInstance(
            type: .action,
            action: .multiTap,
            atIndex: 3,
            params: [3],
            predicate: predicate
          )
        ))
      }

      it("should parse scroll-to action") {
        let message = messageBuilder.makeScrollToEdgeAction("left").build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message.defaultInstance(
            type: .action,
            action: .scrollTo,
            atIndex: 3,
            params: ["left"],
            predicate: predicate
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
          Message.defaultInstance(
            type: .action,
            action: .scroll,
            atIndex: 3,
            params: [1.1, "right", .init(NSNull()), .init(NSNull())],
            predicate: predicate
          )
        ))
      }

      it("should parse set column to value action") {
        let message = messageBuilder.makeSetColumnToValueAction(23, "foo").build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message.defaultInstance(
            type: .action,
            action: .setColumnToValue,
            atIndex: 3,
            params: [23, "foo"],
            predicate: predicate
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
          Message.defaultInstance(
            type: .action,
            action: .setDatePickerDate,
            atIndex: 3,
            params: ["2022/02/22", "yyyy/MM/dd"],
            predicate: predicate
          )
        ))
      }

      it("should parse pinch action") {
        let message = messageBuilder.makePinchAction(1, "slow", 2).build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message.defaultInstance(
            type: .action,
            action: .pinch,
            atIndex: 3,
            params: [1, "slow", 2],
            predicate: predicate
          )
        ))
      }

      it("should parse adjust slider action") {
        let message = messageBuilder.makeAdjustSliderAction(0.5).build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message.defaultInstance(
            type: .action,
            action: .adjustSliderToPosition,
            atIndex: 3,
            params: [0.5],
            predicate: predicate
          )
        ))
      }

      it("should parse take-screenshot action") {
        let message = messageBuilder.makeScreenshotAction(name: "foo").build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message.defaultInstance(
            type: .action,
            action: .takeScreenshot,
            atIndex: 3,
            params: ["foo"],
            predicate: predicate
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
          Message.defaultInstance(
            type: .action,
            action: .swipe,
            atIndex: 3,
            params: ["down", "slow", .init(NSNull()), .init(NSNull()), .init(NSNull())],
            predicate: predicate
          )
        ))
      }

      it("should parse get-attributes action") {
        let message = messageBuilder.makeGetAttributesAction().build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message.defaultInstance(
            type: .action,
            action: .getAttributes,
            atIndex: 3,
            predicate: predicate
          )
        ))
      }

      it("should parse long press action") {
        let message = messageBuilder.makeLongPressAction().build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message.defaultInstance(
            type: .action,
            action: .longPress,
            atIndex: 3,
            predicate: predicate
          )
        ))
      }

      it("should parse long press and drag action") {
        let message = messageBuilder.makeLongPressAction().setDragParamsAndTarget(
          duration: 55,
          normalizedPositionX: 0.3,
          normalizedPositionY: 0.2,
          normalizedTargetPositionX: NSNull(),
          normalizedTargetPositionY: NSNull(),
          speed: 22,
          holdDuration: 10,
          targetElementID: "foo"
        ).build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message.defaultInstance(
            type: .action,
            action: .longPress,
            atIndex: 3,
            params: [55, 0.3, 0.2, .init(NSNull()), .init(NSNull()), 22, 10],
            predicate: predicate,
            targetElement: .init(predicate: .init(type: .id, value: "foo"))
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
          Message.defaultInstance(
            type: .action,
            action: .tap,
            predicate: .init(type: .text, value: "foo")
          )
        ))
      }

      it("should parse predicate with text regular expression (`isRegex`)") {
        let message = messageBuilder.setTextPredicate("foo", true).build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message.defaultInstance(
            type: .action,
            action: .tap,
            predicate: .init(type: .text, value: "foo", isRegex: true)
          )
        ))
      }

      it("should parse predicate with `value` type") {
        let message = messageBuilder.setValuePredicate("foo").build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message.defaultInstance(
            type: .action,
            action: .tap,
            predicate: .init(type: .value, value: "foo")
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
          Message.defaultInstance(
            type: .action,
            action: .tap,
            predicate: .init(
              type: .traits,
              value: ["updatesFrequently", "startsMediaSession"]
            )
          )
        ))
      }

      it("should parse predicate with `label` type") {
        let message = messageBuilder.setLabelPredicate("bar").build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message.defaultInstance(
            type: .action,
            action: .tap,
            predicate: .init(type: .label, value: "bar")
          )
        ))
      }

      it("should parse predicate with `type` type") {
        let message = messageBuilder.setTypePredicate("bar").build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message.defaultInstance(
            type: .action,
            action: .tap,
            predicate: .init(type: .type, value: "bar")
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
          Message.defaultInstance(
            type: .action,
            action: .tap,
            predicate: .init(type: .and, predicates: [
              .init(type: .text, value: "foo"),
              .init(type: .label, value: "bar")
            ])
          )
        ))
      }

      it("should parse predicate with child and ancestor ids") {
        let message = messageBuilder.setChildWithAncestorPredicate("foo", "bar").build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message.defaultInstance(
            type: .action,
            action: .tap,
            predicate: .init(type: .and, predicates: [
              .init(type: .id, value: "foo"),
              .init(type: .ancestor, predicate: .init(type: .id, value: "bar"))
            ])
          )
        ))
      }

      it("should parse predicate with parent and descendant ids") {
        let message = messageBuilder.setParentWithDescendantPredicate("foo", "bar").build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message.defaultInstance(
            type: .action,
            action: .tap,
            predicate: .init(type: .and, predicates: [
              .init(type: .id, value: "foo"),
              .init(type: .descendant, predicate: .init(type: .id, value: "bar"))
            ])
          )
        ))
      }
    }
  }
}
