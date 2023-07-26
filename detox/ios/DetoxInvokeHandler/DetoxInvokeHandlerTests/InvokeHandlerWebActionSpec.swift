//
//  InvokeHandlerWebActionSpec.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2023.
//

@testable import DetoxInvokeHandler

import Quick
import Nimble
import Foundation

class InvokeHandlerWebActionSpec: QuickSpec {
  override func spec() {
    var webActionDelegate: FakeWebActionDelegate!
    var handler: InvokeHandler!
    var messageBuilderWithPredicate: MessageBuilder!

    let webView = "web view"
    let webViewElement = "web view element"

    beforeEach {
      let matcher = FakeElementMatcher()
      webActionDelegate = .init()

      handler = .init(
        elementMatcher: matcher,
        actionDelegate: FakeActionDelegate(),
        webActionDelegate: webActionDelegate,
        expectationDelegate: FakeExpectationDelegate(),
        webExpectationDelegate: FakeWebExpectationDelegate()
      )

      messageBuilderWithPredicate = MessageBuilder()
        .setIdPredicate("webView")
        .setNameWebPredicate("webViewElement")

      matcher.setMatch(from: .id("webView", isRegex: false), to: webView)
      matcher.setWebMatch(from: .name("webViewElement"), to: webViewElement)
    }

    it("should throw if action is throwing") {
      let message = messageBuilderWithPredicate.makeWebTapAction().build()

      webActionDelegate.shouldThrow = true

      expect { try handler.handle(message) }.to(throwError(FakeWebActionDelegate.Error()))
    }

    describe("getters") {
      it("should call delegate to get text") {
        let message = messageBuilderWithPredicate.makeWebGetTextAction().build()

        webActionDelegate.text = "bar"

        expect(try handler.handle(message)).to(equal("bar"))
        expect(webActionDelegate.actRecorder.last).to(beNil())
      }

      it("should call delegate to get current url") {
        let message = messageBuilderWithPredicate.makeWebGetCurrentUrlAction().build()

        webActionDelegate.currentUrl = "bar"

        expect(try handler.handle(message)).to(equal("bar"))
        expect(webActionDelegate.actRecorder.last).to(beNil())
      }

      it("should call delegate to get title") {
        let message = messageBuilderWithPredicate.makeWebGetTitleAction().build()

        webActionDelegate.title = "bar"

        expect(try handler.handle(message)).to(equal("bar"))
        expect(webActionDelegate.actRecorder.last).to(beNil())
      }
    }

    it("should call delegate for tap action") {
      let message = messageBuilderWithPredicate.makeWebTapAction().build()

      expect(try handler.handle(message)).to(beNil())

      let expected = (
        WebAction.tap,
        webViewElement
      )
      expect(webActionDelegate.actRecorder.last).to(equal(expected))
    }

    it("should call delegate for focus action") {
      let message = messageBuilderWithPredicate.makeWebFocusAction().build()

      expect(try handler.handle(message)).to(beNil())

      let expected = (
        WebAction.focus,
        webViewElement
      )
      expect(webActionDelegate.actRecorder.last).to(equal(expected))
    }

    it("should call delegate for type-text action") {
      let message = messageBuilderWithPredicate.makeWebTypeTextAction("text").build()

      expect(try handler.handle(message)).to(beNil())

      let expected = (
        WebAction.typeText(text: "text", isContentEditable: false),
        webViewElement
      )
      expect(webActionDelegate.actRecorder.last).to(equal(expected))
    }

    it("should call delegate for replace-text action") {
      let message = messageBuilderWithPredicate.makeWebReplaceTextAction("text").build()

      expect(try handler.handle(message)).to(beNil())

      let expected = (
        WebAction.replaceText(text: "text"),
        webViewElement
      )
      expect(webActionDelegate.actRecorder.last).to(equal(expected))
    }

    it("should call delegate for clear-text action") {
      let message = messageBuilderWithPredicate.makeWebClearTextAction().build()

      expect(try handler.handle(message)).to(beNil())

      let expected = (
        WebAction.clearText,
        webViewElement
      )
      expect(webActionDelegate.actRecorder.last).to(equal(expected))
    }

    it("should call delegate for select-all-text action") {
      let message = messageBuilderWithPredicate.makeWebSelectAllTextAction().build()

      expect(try handler.handle(message)).to(beNil())

      let expected = (
        WebAction.selectAllText,
        webViewElement
      )
      expect(webActionDelegate.actRecorder.last).to(equal(expected))
    }

    it("should call delegate for scroll-to-view action") {
      let message = messageBuilderWithPredicate.makeWebScrollToViewAction().build()

      expect(try handler.handle(message)).to(beNil())

      let expected = (
        WebAction.scrollToView,
        webViewElement
      )
      expect(webActionDelegate.actRecorder.last).to(equal(expected))
    }

    it("should call delegate for move-cursor-to-end action") {
      let message = messageBuilderWithPredicate.makeWebMoveCursorToEndAction().build()

      expect(try handler.handle(message)).to(beNil())

      let expected = (
        WebAction.moveCursorToEnd,
        webViewElement
      )
      expect(webActionDelegate.actRecorder.last).to(equal(expected))
    }

    it("should call delegate for run-script action") {
      let message = messageBuilderWithPredicate.makeWebRunScriptAction("script").build()

      expect(try handler.handle(message)).to(beNil())

      let expected = (
        WebAction.runScript(script: "script"),
        webViewElement
      )
      expect(webActionDelegate.actRecorder.last).to(equal(expected))
    }

    it("should call delegate for run-script-with-args action") {
      let message = messageBuilderWithPredicate.makeWebRunScriptWithArgsAction(
        "script",
        args: ["arg1", "arg2"]
      ).build()

      expect(try handler.handle(message)).to(beNil())

      let expected = (
        WebAction.runScriptWithArgs(script: "script", args: ["arg1", "arg2"]),
        webViewElement
      )
      expect(webActionDelegate.actRecorder.last).to(equal(expected))
    }
  }
}
