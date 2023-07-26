//
//  MessagePredicateSpec.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2023.
//

@testable import DetoxInvokeHandler

import Quick
import Nimble
import Foundation

class MessagePredicateSpec: QuickSpec {
  override func spec() {
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
