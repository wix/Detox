//
//  MessageWebPredicateSpec.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2023.
//

@testable import DetoxInvokeHandler

import Quick
import Nimble
import Foundation

class MessageWebPredicateSpec: QuickSpec {
  override func spec() {
    describe("web predicate: default web-view") {
      var messageBuilder: MessageBuilder!

      beforeEach {
        messageBuilder = MessageBuilder().makeWebTapAction()
      }

      it("should parse web-predicate with `id` type") {
        let message = messageBuilder.setNameWebPredicate("foo").build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message.defaultInstance(
            type: .webAction,
            webAction: .tap,
            webPredicate: .init(type: .name, value: "foo")
          )
        ))
      }

      it("should parse web-predicate with `className` type") {
        let message = messageBuilder.setClassNameWebPredicate("foo").build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message.defaultInstance(
            type: .webAction,
            webAction: .tap,
            webPredicate: .init(type: .className, value: "foo")
          )
        ))
      }

      it("should parse web-predicate with `cssSelector` type") {
        let message = messageBuilder.setCssSelectorWebPredicate("foo").build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message.defaultInstance(
            type: .webAction,
            webAction: .tap,
            webPredicate: .init(type: .cssSelector, value: "foo")
          )
        ))
      }

      it("should parse web-predicate with `label` type") {
        let message = messageBuilder.setLabelWebPredicate("foo").build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message.defaultInstance(
            type: .webAction,
            webAction: .tap,
            webPredicate: .init(type: .label, value: "foo")
          )
        ))
      }

      it("should parse web-predicate with `value` type") {
        let message = messageBuilder.setValueWebPredicate("foo").build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message.defaultInstance(
            type: .webAction,
            webAction: .tap,
            webPredicate: .init(type: .value, value: "foo")
          )
        ))
      }

      it("should parse web-predicate with `name` type") {
        let message = messageBuilder.setNameWebPredicate("foo").build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message.defaultInstance(
            type: .webAction,
            webAction: .tap,
            webPredicate: .init(type: .name, value: "foo")
          )
        ))
      }

      it("should parse web-predicate with `xpath` type") {
        let message = messageBuilder.setXpathWebPredicate("foo").build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message.defaultInstance(
            type: .webAction,
            webAction: .tap,
            webPredicate: .init(type: .xpath, value: "foo")
          )
        ))
      }

      it("should parse web-predicate with `href` type") {
        let message = messageBuilder.setHrefWebPredicate("foo").build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message.defaultInstance(
            type: .webAction,
            webAction: .tap,
            webPredicate: .init(type: .href, value: "foo")
          )
        ))
      }

      it("should parse web-predicate with `hrefContains` type") {
        let message = messageBuilder.setHrefContainsWebPredicate("foo").build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message.defaultInstance(
            type: .webAction,
            webAction: .tap,
            webPredicate: .init(type: .hrefContains, value: "foo")
          )
        ))
      }

      it("should parse web-predicate with `hrefContains` type") {
        let message = messageBuilder.setTagWebPredicate("foo").build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message.defaultInstance(
            type: .webAction,
            webAction: .tap,
            webPredicate: .init(type: .tag, value: "foo")
          )
        ))
      }
    }

    describe("web predicate: specific web-view") {
      var messageBuilder: MessageBuilder!

      beforeEach {
        messageBuilder = MessageBuilder().makeWebTapAction()
      }

      it("should parse web-predicate with element-predicate") {
        let message = messageBuilder
          .setLabelPredicate("foo")
          .setNameWebPredicate("bar").build()

        let parsed = try Message(from: message)

        expect(parsed).to(equal(
          Message.defaultInstance(
            type: .webAction,
            webAction: .tap,
            predicate: .init(type: .label, value: "foo"),
            webPredicate: .init(type: .name, value: "bar")
          )
        ))
      }
    }
  }
}
