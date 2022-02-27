//
//  FakeElementMatcher.swift (DetoxMessageHandler)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

class FakeElementMatcher: ElementMatcherProtocol {
  struct Error: Swift.Error { }

  private var patternToElements: [ElementPattern: [AnyHashable]] = [:]

  func setMatch(from: ElementPattern, to: AnyHashable) {
    patternToElements[from] = (patternToElements[from] ?? []) + [to]
  }

  func match(to pattern: ElementPattern) throws -> [AnyHashable] {
    guard let elements = patternToElements[pattern] else {
      throw Error()
    }

    return elements
  }
}
