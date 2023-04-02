//
//  InvokeHandlerSpec.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2022.
//

@testable import DetoxInvokeHandler

import Quick
import Nimble
import Foundation

class InvokeHandlerSpec: QuickSpec {
  override func spec() {
    var matcher: FakeElementMatcher!
    var actionDelegate: FakeActionDelegate!
    var expectationDelegate: FakeExpectationDelegate!
    var handler: InvokeHandler!

    beforeEach {
      matcher = .init()
      actionDelegate = .init()
      expectationDelegate = .init()

      handler = .init(
        elementMatcher: matcher,
        actionDelegate: actionDelegate,
        expectationDelegate: expectationDelegate
      )
    }

    describe("predicates") {
      var messageBuilderWithAction: MessageBuilder!

      beforeEach {
        messageBuilderWithAction = MessageBuilder().makeTapAction()
      }

      it("should throw if element was not found") {
        let message = messageBuilderWithAction.setTextPredicate("foo").build()

        expect { try handler.handle(message) }.to(throwError(
          errorType: FakeElementMatcher.Error.self
        ))
      }

      it("should find element by `text` predicate") {
        let message = messageBuilderWithAction.setTextPredicate("foo").build()

        matcher.setMatch(from: .text("foo"), to: "bar")

        expect { try handler.handle(message) }.notTo(throwError())
      }

      it("should find element by `value` predicate") {
        let message = messageBuilderWithAction.setValuePredicate("foo").build()

        matcher.setMatch(from: .value("foo"), to: "bar")

        expect { try handler.handle(message) }.notTo(throwError())
      }

      it("should find element by `label` predicate") {
        let message = messageBuilderWithAction.setLabelPredicate("foo").build()

        matcher.setMatch(from: .label("foo"), to: "bar")

        expect { try handler.handle(message) }.notTo(throwError())
      }

      it("should find element by `traits` predicate") {
        let message = messageBuilderWithAction.setTraitsPredicate([
          "image",
          "selected",
          "playsSound"
        ]).build()

        matcher.setMatch(from: .traits([.image, .selected, .playsSound]), to: "bar")

        expect { try handler.handle(message) }.notTo(throwError())
      }

      it("should find element by `and` predicate") {
        let message = messageBuilderWithAction.setAndPredicates([
          ("text", "foo"),
          ("label", "bar")
        ]).build()

        let pattern = ElementPattern.and(patterns: [
          .text("foo"),
          .label("bar")
        ])
        matcher.setMatch(from: pattern, to: "baz")

        expect { try handler.handle(message) }.notTo(throwError())
      }

      it("should find element by child with ancestor predicate") {
        let message = messageBuilderWithAction.setChildWithAncestorPredicate("foo", "bar").build()

        let pattern = ElementPattern.and(patterns: [
          .id("foo"),
          .ancestor(pattern: .id("bar"))
        ])
        matcher.setMatch(from: pattern, to: "baz")

        expect { try handler.handle(message) }.notTo(throwError())
      }

      it("should find element by parent with descendant predicate") {
        let message = messageBuilderWithAction.setParentWithDescendantPredicate("foo", "bar").build()

        let pattern = ElementPattern.and(patterns: [
          .id("foo"),
          .descendant(pattern: .id("bar"))
        ])
        matcher.setMatch(from: pattern, to: "baz")

        expect { try handler.handle(message) }.notTo(throwError())
      }

      it("should throw if could not find element at index") {
        let message = messageBuilderWithAction.setTextPredicate("foo").at(index: 1).build()

        matcher.setMatch(from: .text("foo"), to: "bar")

        expect { try handler.handle(message) }.to(throwError(
          InvokeHandler.Error.noElementAtIndex(index: 1, elementsCount: 1)
        ))
      }

      it("should find element at index") {
        let message = messageBuilderWithAction.setTextPredicate("foo").at(index: 1).build()

        let pattern: ElementPattern = .text("foo")
        matcher.setMatch(from: pattern, to: "bar")
        matcher.setMatch(from: pattern, to: "baz")

        expect { try handler.handle(message) }.notTo(throwError())
      }
    }

    describe("actions") {
      let element = "foo"
      let targetElement = "qux"

      var messageBuilderWithPredicate: MessageBuilder!

      beforeEach {
        messageBuilderWithPredicate = MessageBuilder().setTextPredicate("bar")

        matcher.setMatch(from: .text("bar"), to: element)
        matcher.setMatch(from: .id("baz"), to: targetElement)
      }

      it("should throw if action is throwing") {
        let message = messageBuilderWithPredicate.makeTapAction().build()

        actionDelegate.shouldThrow = true

        expect { try handler.handle(message) }.to(throwError(FakeActionDelegate.Error()))
      }

      describe("tap") {
        var tapMessageBuilder: MessageBuilder!

        beforeEach {
          tapMessageBuilder = messageBuilderWithPredicate.makeTapAction()
        }

        it("should call delegate for tap action") {
          let message = tapMessageBuilder.build()

          expect(try handler.handle(message)).to(beNil())

          let expected = (Action.tap(), element)
          expect(actionDelegate.actRecorder.last).to(equal(expected))
        }

        it("should call delegate for tap action with x and y axis params") {
          let message = tapMessageBuilder.setParams(x: 1, y: 2).build()

          expect(try handler.handle(message)).to(beNil())

          let expected = (Action.tapOnAxis(x: 1, y: 2), element)
          expect(actionDelegate.actRecorder.last).to(equal(expected))
        }
      }

      describe("long-press") {
        var longPressMessageBuilder: MessageBuilder!

        beforeEach {
          longPressMessageBuilder = messageBuilderWithPredicate.makeLongPressAction()
        }

        it("should call delegate for long-press action") {
          let message = longPressMessageBuilder.build()

          expect(try handler.handle(message)).to(beNil())

          let expected = (Action.longPress(), element)
          expect(actionDelegate.actRecorder.last).to(equal(expected))
        }

        it("should call delegate for long-press with duration action") {
          let message = longPressMessageBuilder.setDurationParam(duration: 320).build()

          expect(try handler.handle(message)).to(beNil())

          let expected = (Action.longPress(duration: 0.32), element)
          expect(actionDelegate.actRecorder.last).to(equal(expected))
        }

        it("should call delegate for long-press and drag action") {
          let message = longPressMessageBuilder.setDragParamsAndTarget(
            duration: 12,
            normalizedPositionX: 0.2,
            normalizedPositionY: 0.1,
            normalizedTargetPositionX: NSNull(),
            normalizedTargetPositionY: NSNull(),
            speed: "fast",
            holdDuration: 10,
            targetElementID: "baz"
          ).build()

          expect(try handler.handle(message)).to(beNil())

          let expected = (Action.longPressAndDrag(
            duration: 0.012,
            normalizedPositionX: 0.2,
            normalizedPositionY: 0.1,
            targetElement: targetElement,
            normalizedTargetPositionX: nil,
            normalizedTargetPositionY: nil,
            speed: .fast,
            holdDuration: 10
          ), element)
          expect(actionDelegate.actRecorder.last).to(equal(expected))
        }
      }

      describe("swipe") {
        it("should call delegate for swipe action (down and fast)") {
          let message = messageBuilderWithPredicate.makeSwipeAction(
            direction: "up", speed: "fast", normalizedOffset: NSNull(),
            normalizedStartingPointX: NSNull(), normalizedStartingPointY: NSNull()
          ).build()

          expect(try handler.handle(message)).to(beNil())

          let expected = (
            Action.swipe(
              direction: .up,
              speed: .fast,
              normalizedOffset: nil,
              normalizedStartingPointX: nil,
              normalizedStartingPointY: nil
            ),
            element
          )
          expect(actionDelegate.actRecorder.last).to(equal(expected))
        }

        it("should call delegate for swipe action (right and slow)") {
          let message = messageBuilderWithPredicate.makeSwipeAction(
            direction: "right", speed: "slow", normalizedOffset: 0.3,
            normalizedStartingPointX: 0.4, normalizedStartingPointY: 0.5
          ).build()

          expect(try handler.handle(message)).to(beNil())

          let expected = (
            Action.swipe(
              direction: .right,
              speed: .slow,
              normalizedOffset: 0.3,
              normalizedStartingPointX: 0.4,
              normalizedStartingPointY: 0.5
            ),
            element
          )
          expect(actionDelegate.actRecorder.last).to(equal(expected))
        }
      }

      describe("screenshot") {
        beforeEach {
          actionDelegate.defaultImagePath = "bar"
        }

        it("should call delegate for taking screenshot") {
          let message = messageBuilderWithPredicate.makeScreenshotAction(name: nil).build()

          expect(try handler.handle(message)).to(equal("bar"))
          expect(actionDelegate.actRecorder.last).to(beNil())
        }

        it("should call delegate for taking screenshot with name") {
          let message = messageBuilderWithPredicate.makeScreenshotAction(name: "foo").build()

          expect(try handler.handle(message)).to(equal("foo"))
          expect(actionDelegate.actRecorder.last).to(beNil())
        }
      }

      describe("get attributes") {
        it("should get attributes from delegate") {
          let message = messageBuilderWithPredicate.makeGetAttributesAction().build()

          let attributes = ["foo": "bar"]
          actionDelegate.setAttributes(.init(attributes), for: [element])

          expect(try handler.handle(message)).to(equal(AnyCodable(attributes)))
          expect(actionDelegate.actRecorder.last).to(beNil())
        }
      }

      describe("multi taps") {
        it("should call delegate for multi tap action") {
          let message = messageBuilderWithPredicate.makeMultiTapAction(3).build()

          expect(try handler.handle(message)).to(beNil())

          let expected = (
            Action.tap(times: 3),
            element
          )
          expect(actionDelegate.actRecorder.last).to(equal(expected))
        }
      }

      describe("tap key") {
        it("should call delegate for tap backspace key action") {
          let message = messageBuilderWithPredicate.makeTapBackspaceKeyAction().build()

          expect(try handler.handle(message)).to(beNil())

          let expected = (
            Action.tapKey(.backspaceKey),
            element
          )
          expect(actionDelegate.actRecorder.last).to(equal(expected))
        }
        
        it("should call delegate for tap return key action") {
          let message = messageBuilderWithPredicate.makeTapReturnKeyAction().build()

          expect(try handler.handle(message)).to(beNil())

          let expected = (
            Action.tapKey(.returnKey),
            element
          )
          expect(actionDelegate.actRecorder.last).to(equal(expected))
        }
      }

      describe("change text") {
        it("should call delegate for type text action") {
          let message = messageBuilderWithPredicate.makeTypeTextAction("foo").build()

          expect(try handler.handle(message)).to(beNil())

          let expected = (
            Action.changeText(.type("foo")),
            element
          )
          expect(actionDelegate.actRecorder.last).to(equal(expected))
        }

        it("should call delegate for replace text action") {
          let message = messageBuilderWithPredicate.makeReplaceTextAction("foo").build()

          expect(try handler.handle(message)).to(beNil())

          let expected = (
            Action.changeText(.replace("foo")),
            element
          )
          expect(actionDelegate.actRecorder.last).to(equal(expected))
        }

        it("should call delegate for clear text action") {
          let message = messageBuilderWithPredicate.makeClearTextAction().build()

          expect(try handler.handle(message)).to(beNil())

          let expected = (
            Action.changeText(.clear),
            element
          )
          expect(actionDelegate.actRecorder.last).to(equal(expected))
        }
      }

      describe("scroll") {
        it("should call delegate for scroll to top edge action") {
          let message = messageBuilderWithPredicate.makeScrollToEdgeAction("top").build()

          expect(try handler.handle(message)).to(beNil())

          let expected = (
            Action.scroll(.to(.top)),
            element
          )
          expect(actionDelegate.actRecorder.last).to(equal(expected))
        }

        it("should call delegate for scroll to bottom edge action") {
          let message = messageBuilderWithPredicate.makeScrollToEdgeAction("bottom").build()

          expect(try handler.handle(message)).to(beNil())

          let expected = (
            Action.scroll(.to(.bottom)),
            element
          )
          expect(actionDelegate.actRecorder.last).to(equal(expected))
        }

        it("should call delegate for scroll to left edge action") {
          let message = messageBuilderWithPredicate.makeScrollToEdgeAction("left").build()

          expect(try handler.handle(message)).to(beNil())

          let expected = (
            Action.scroll(.to(.left)),
            element
          )
          expect(actionDelegate.actRecorder.last).to(equal(expected))
        }

        it("should call delegate for scroll to right edge action") {
          let message = messageBuilderWithPredicate.makeScrollToEdgeAction("right").build()

          expect(try handler.handle(message)).to(beNil())

          let expected = (
            Action.scroll(.to(.right)),
            element
          )
          expect(actionDelegate.actRecorder.last).to(equal(expected))
        }

        it("should call delegate for scroll with offset and direction action") {
          let message = messageBuilderWithPredicate.makeScrollAction(
            offset: 12.2,
            direction: "left",
            startNormalizedPositionX: NSNull(),
            startNormalizedPositionY: NSNull()
          ).build()

          expect(try handler.handle(message)).to(beNil())

          let expected = (
            Action.scroll(.withParams(
              offset: 12.2,
              direction: .left,
              startNormalizedPositionX: nil,
              startNormalizedPositionY: nil
            )),
            element
          )
          expect(actionDelegate.actRecorder.last).to(equal(expected))
        }

        it("should call delegate for scroll with start normalized position action") {
          let message = messageBuilderWithPredicate.makeScrollAction(
            offset: 1,
            direction: "down",
            startNormalizedPositionX: 2.2,
            startNormalizedPositionY: 1.1
          ).build()

          expect(try handler.handle(message)).to(beNil())

          let expected = (
            Action.scroll(.withParams(
              offset: 1,
              direction: .down,
              startNormalizedPositionX: 2.2,
              startNormalizedPositionY: 1.1
            )),
            element
          )
          expect(actionDelegate.actRecorder.last).to(equal(expected))
        }
      }

      describe("set column to value") {
        it("should call delegate for setting column to value action") {
          let message = messageBuilderWithPredicate.makeSetColumnToValueAction(1, "foo").build()

          expect(try handler.handle(message)).to(beNil())

          let expected = (
            Action.setColumnToValue(
              index: 1,
              value: "foo"
            ),
            element
          )
          expect(actionDelegate.actRecorder.last).to(equal(expected))
        }
      }

      describe("set date picker date") {
        it("should call delegate for setting date picker date action with `ISO8601`") {
          let message = messageBuilderWithPredicate.makeSetDatePickerDateAction(
            "1994-07-20T05:10:00-08:00",
            "ISO8601"
          ).build()

          expect(try handler.handle(message)).to(beNil())

          let expected = (
            Action.setDatePicker(
              date: ISO8601DateFormatter().date(from: "1994-07-20T05:10:00-08:00")!
            ),
            element
          )
          expect(actionDelegate.actRecorder.last).to(equal(expected))
        }

        it("should call delegate for setting date picker date action with custom format") {
          let message = messageBuilderWithPredicate.makeSetDatePickerDateAction(
            "2022/02/22",
            "yyyy/MM/dd"
          ).build()

          expect(try handler.handle(message)).to(beNil())

          let dateFormatter = DateFormatter()
          dateFormatter.locale = Locale(identifier: "en_US_POSIX")
          dateFormatter.dateFormat = "yyyy/MM/dd"

          let expected = (
            Action.setDatePicker(
              date: dateFormatter.date(from: "2022/02/22")!
            ),
            element
          )
          expect(actionDelegate.actRecorder.last).to(equal(expected))
        }
      }

      describe("slider") {
        it("should call delegate for adjust slider to position action") {
          let message = messageBuilderWithPredicate.makeAdjustSliderAction(0.75).build()

          expect(try handler.handle(message)).to(beNil())

          let expected = (
            Action.adjustSlider(normalizedPosition: 0.75),
            element
          )
          expect(actionDelegate.actRecorder.last).to(equal(expected))
        }
      }

      describe("pinch") {
        it("should call delegate for slow pinch action") {
          let message = messageBuilderWithPredicate.makePinchAction(1, "slow", 0).build()

          expect(try handler.handle(message)).to(beNil())

          let expected = (
            Action.pinch(
              scale: 1,
              speed: .slow,
              angle: 0
            ),
            element
          )
          expect(actionDelegate.actRecorder.last).to(equal(expected))
        }

        it("should call delegate for fast pinch action") {
          let message = messageBuilderWithPredicate.makePinchAction(0.2, "fast", 45.5).build()

          expect(try handler.handle(message)).to(beNil())

          let expected = (
            Action.pinch(
              scale: 0.2,
              speed: .fast,
              angle: 45.5
            ),
            element
          )
          expect(actionDelegate.actRecorder.last).to(equal(expected))
        }
      }
    }

    describe("expectations") {
      let element = "foo"

      var messageBuilderWithPredicate: MessageBuilder!

      beforeEach {
        messageBuilderWithPredicate = MessageBuilder().setTextPredicate("bar")

        matcher.setMatch(from: .text("bar"), to: element)
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

    describe("action loop") {
      let firstElement = "foo"
      let secondElement = "bar"

      var message: [String: AnyHashable]!

      beforeEach {
        message = MessageBuilder()
          .setIdPredicate("qux")
          .makeTapAction()
          .waitUntilVisible(id: "quz")
          .build()

        matcher.setMatch(from: .id("qux"), to: firstElement)
        matcher.setMatch(from: .id("quz"), to: secondElement)
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
        expect(actionDelegate.actRecorder.count).to(equal(6))
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
}
