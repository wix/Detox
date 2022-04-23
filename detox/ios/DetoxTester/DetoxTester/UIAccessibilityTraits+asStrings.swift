//
//  UIAccessibilityTraits+asStrings.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

extension UIAccessibilityTraits {
  func asStrings() -> [String]? {
    if self.isEmpty {
      return nil
    }

    var strings: [String] = []

    Self.traitToString.forEach { (traitString: String, trait: UIAccessibilityTraits) in
      if self.contains(trait) {
        strings.append(traitString)
      }
    }

    return strings
  }

  private static var traitToString: [String: UIAccessibilityTraits] {
    [
      "adjustable": .adjustable,
      "header": .header,
      "causesPageTurn": .causesPageTurn,
      "allowsDirectInteraction": .allowsDirectInteraction,
      "image": .image,
      "keyboardKey": .keyboardKey,
      "link": .link,
      "notEnabled": .notEnabled,
      "playsSound": .playsSound,
      "searchField": .searchField,
      "selected": .selected,
      "startsMediaSession": .startsMediaSession,
      "staticText": .staticText,
      "summaryElement": .summaryElement,
      "tabBar": .tabBar,
      "updatesFrequently": .updatesFrequently,
      "button": .button,
    ]
  }
}
