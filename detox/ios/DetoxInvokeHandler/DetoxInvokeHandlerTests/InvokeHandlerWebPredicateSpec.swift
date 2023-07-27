//
//  InvokeHandlerWebPredicateSpec.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2023.
//

@testable import DetoxInvokeHandler

import Quick
import Nimble
import Foundation

class InvokeHandlerWebPredicateSpec: QuickSpec {
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
      
      messageBuilderWithAction = MessageBuilder().makeWebTapAction().setTextPredicate("foo")
      matcher.setMatch(from: .text("foo", isRegex: false), to: "any")
    }
    
    it("should throw if element was not found") {
      let message = messageBuilderWithAction.setTagWebPredicate("bar").build()
      
      expect { try handler.handle(message) }.to(throwError(
        errorType: FakeElementMatcher.Error.self
      ))
    }
    
    it("should find element by `tag` predicate") {
      let message = messageBuilderWithAction.setTagWebPredicate("tag").build()
      
      matcher.setWebMatch(from: .tag("tag"), to: "foo")
      
      expect { try handler.handle(message) }.notTo(throwError())
    }

    it("should find element by `className` predicate") {
      let message = messageBuilderWithAction.setClassNameWebPredicate("class").build()

      matcher.setWebMatch(from: .className("class"), to: "foo")

      expect { try handler.handle(message) }.notTo(throwError())
    }

    it("should find element by `cssSelector` predicate") {
      let message = messageBuilderWithAction.setCssSelectorWebPredicate("css").build()

      matcher.setWebMatch(from: .cssSelector("css"), to: "foo")

      expect { try handler.handle(message) }.notTo(throwError())
    }

    it("should find element by `href` predicate") {
      let message = messageBuilderWithAction.setHrefWebPredicate("href").build()

      matcher.setWebMatch(from: .href("href"), to: "foo")

      expect { try handler.handle(message) }.notTo(throwError())
    }

    it("should find element by `hrefContains` predicate") {
      let message = messageBuilderWithAction.setHrefContainsWebPredicate("href").build()

      matcher.setWebMatch(from: .hrefContains("href"), to: "foo")

      expect { try handler.handle(message) }.notTo(throwError())
    }

    it("should find element by `id` predicate") {
      let message = messageBuilderWithAction.setIdWebPredicate("id").build()

      matcher.setWebMatch(from: .id("id"), to: "foo")

      expect { try handler.handle(message) }.notTo(throwError())
    }

    it("should find element by `name` predicate") {
      let message = messageBuilderWithAction.setNameWebPredicate("name").build()

      matcher.setWebMatch(from: .name("name"), to: "foo")

      expect { try handler.handle(message) }.notTo(throwError())
    }

    it("should find element by `xpath` predicate") {
      let message = messageBuilderWithAction.setXpathWebPredicate("xpath").build()

      matcher.setWebMatch(from: .xpath("xpath"), to: "foo")

      expect { try handler.handle(message) }.notTo(throwError())
    }

    it("should throw if could not find element at index") {
      let message = messageBuilderWithAction.setNameWebPredicate("name").webAt(index: 1).build()

      matcher.setWebMatch(from: .name("name"), to: "bar")

      expect { try handler.handle(message) }.to(throwError(
        InvokeHandler.Error.noWebElementAtIndex(
          index: 1,
          elementsCount: 1,
          predicate: WebPredicate(type: .name, value: "name"),
          webViewPredicate: ElementPredicate(type: .text, value: "foo")
        )
      ))
    }

    it("should find element at index") {
      let message = messageBuilderWithAction.setNameWebPredicate("name").webAt(index: 1).build()

      let pattern: WebElementPattern = .name("name")

      matcher.setWebMatch(from: pattern, to: "bar")
      matcher.setWebMatch(from: pattern, to: "baz")


      expect { try handler.handle(message) }.notTo(throwError())
    }
  }
}
