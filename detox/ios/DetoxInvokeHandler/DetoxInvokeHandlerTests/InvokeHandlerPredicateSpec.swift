//
//  InvokeHandlerPredicateSpec.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2023.
//

@testable import DetoxInvokeHandler

import Quick
import Nimble
import Foundation

class InvokeHandlerPredicateSpec: QuickSpec {
  override func spec() {
    var matcher: FakeElementMatcher!
    var handler: InvokeHandler!
    var messageBuilderWithAction: MessageBuilder!

    beforeEach {
      matcher = .init()

      handler = .init(
        elementMatcher: matcher,
        actionDelegate: FakeActionDelegate(),
        webActionDelegate: FakeWebActionDelegate(),
        expectationDelegate: FakeExpectationDelegate(),
        webExpectationDelegate: FakeWebExpectationDelegate()
      )

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

      matcher.setMatch(from: .text("foo", isRegex: false), to: "bar")

      expect { try handler.handle(message) }.notTo(throwError())
    }

    it("should find element by `value` predicate") {
      let message = messageBuilderWithAction.setValuePredicate("foo").build()

      matcher.setMatch(from: .value("foo"), to: "bar")

      expect { try handler.handle(message) }.notTo(throwError())
    }

    it("should find element by `label` predicate") {
      let message = messageBuilderWithAction.setLabelPredicate("foo").build()

      matcher.setMatch(from: .label("foo", isRegex: false), to: "bar")

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
        .text("foo", isRegex: false),
        .label("bar", isRegex: false)
      ])
      matcher.setMatch(from: pattern, to: "baz")

      expect { try handler.handle(message) }.notTo(throwError())
    }

    it("should find element by child with ancestor predicate") {
      let message = messageBuilderWithAction.setChildWithAncestorPredicate("foo", "bar").build()

      let pattern = ElementPattern.and(patterns: [
        .id("foo", isRegex: false),
        .ancestor(pattern: .id("bar", isRegex: false))
      ])
      matcher.setMatch(from: pattern, to: "baz")

      expect { try handler.handle(message) }.notTo(throwError())
    }

    it("should find element by parent with descendant predicate") {
      let message = messageBuilderWithAction.setParentWithDescendantPredicate("foo", "bar").build()

      let pattern = ElementPattern.and(patterns: [
        .id("foo", isRegex: false),
        .descendant(pattern: .id("bar", isRegex: false))
      ])
      matcher.setMatch(from: pattern, to: "baz")

      expect { try handler.handle(message) }.notTo(throwError())
    }

    it("should throw if could not find element at index") {
      let message = messageBuilderWithAction.setTextPredicate("foo").at(index: 1).build()

      matcher.setMatch(from: .text("foo", isRegex: false), to: "bar")

      expect { try handler.handle(message) }.to(throwError(
        InvokeHandler.Error.noElementAtIndex(
          index: 1,
          elementsCount: 1,
          predicate: ElementPredicate(type: .text, value: "foo")
        )
      ))
    }

    it("should find element at index") {
      let message = messageBuilderWithAction.setTextPredicate("foo").at(index: 1).build()

      let pattern: ElementPattern = .text("foo", isRegex: false)
      matcher.setMatch(from: pattern, to: "bar")
      matcher.setMatch(from: pattern, to: "baz")

      expect { try handler.handle(message) }.notTo(throwError())
    }
  }
}
