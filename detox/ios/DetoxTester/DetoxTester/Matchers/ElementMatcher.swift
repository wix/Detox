//
//  ElementMatcher.swift (DetoxTester)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import DetoxInvokeHandler
import Foundation
import XCTest

class ElementMatcher: ElementMatcherProtocol {
  let app: XCUIApplication

  init(_ app: XCUIApplication) {
    self.app = app
  }

  func match(to pattern: ElementPattern) throws -> [AnyHashable] {
    matcherLog("called to match with pattern: \(pattern)")
    let allElements = app.descendants(matching: .any)
    return try match(to: pattern, elements: allElements)
  }

  private func match(
    to pattern: ElementPattern,
    elements: XCUIElementQuery
  ) throws -> [AnyHashable] {
    switch pattern {
      case .text(let text):
        fatalError("cannot match by text using the XCUITest target")

      case .label(let label):
        return findElements(byLabel: label)

      case .and(let patterns):
        return try composePatternMatching(patterns)

      case .id(let id):
        return findElement(byIdentifier: id)

      case .ancestor(let pattern):
        fatalError("not implmented yet")

      case .decendant(let pattern):
        fatalError("not implmented yet")

      case .value(let value):
        return findElements(byValue: value)

      case .type(_):
        fatalError("cannot match by type using the XCUITest target")

      case .traits(_):
        fatalError("not implmented yet")
    }

  }

  private func findElements(_ elements: XCUIElementQuery, byLabel label: String) -> [XCUIElement] {
    let staticTexts = app.staticTexts.allElementsBoundByIndex
    return staticTexts.filter {
      $0.label == label
    }
  }

  private func findElements(byValue value: String) -> [XCUIElement] {
    let allElements = app.descendants(matching: .any).allElementsBoundByAccessibilityElement
    return allElements.filter {
      $0.value as? String == value
    }
  }

  private func findElement(byIdentifier id: String) -> [XCUIElement] {
    let allElements = app.descendants(matching: .any)
    return [allElements.element(matching: .any, identifier: id)]
  }

  private func composePatternMatching(_ patterns: [ElementPattern]) throws -> [XCUIElement] {
    let elementsSets = try patterns.map { try Set(match(to: $0)) }
    guard var intersection = elementsSets.first else {
      return []
    }

    for elementsSet in elementsSets.dropFirst() {
      intersection = intersection.intersection(elementsSet)
    }

    return Array(intersection.map {$0 as! XCUIElement})
  }
}
