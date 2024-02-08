//
//  AccessibilityTraits.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import UIKit

/// Represents UI element accessibility traits strings.
public enum AccessibilityTrait: String, Equatable {
  case none = "none"
  case button = "button"
  case link = "link"
  case image = "image"
  case searchField = "searchField"
  case keyboardKey = "keyboardKey"
  case staticText = "staticText"
  case header = "header"
  case tabBar = "tabBar"
  case summaryElement = "summaryElement"
  case selected = "selected"
  case notEnabled = "notEnabled"
  case adjustable = "adjustable"
  case allowsDirectInteraction = "allowsDirectInteraction"
  case updatesFrequently = "updatesFrequently"
  case causesPageTurn = "causesPageTurn"
  case playsSound = "playsSound"
  case startsMediaSession = "startsMediaSession"
}

extension AccessibilityTrait {
  /// Returns the equivalent `UIAccessibilityTraits` to this trait.
  var uiAccessibilityTrait: UIAccessibilityTraits {
    switch self {
      case .none:
        return .none

      case .button:
        return .button

      case .link:
        return .link

      case .image:
        return .image

      case .searchField:
        return .searchField

      case .keyboardKey:
        return .keyboardKey

      case .staticText:
        return .staticText

      case .header:
        return .header

      case .tabBar:
        return .tabBar

      case .summaryElement:
        return .summaryElement

      case .selected:
        return .selected

      case .notEnabled:
        return .notEnabled

      case .adjustable:
        return .adjustable

      case .allowsDirectInteraction:
        return .allowsDirectInteraction

      case .updatesFrequently:
        return .updatesFrequently

      case .causesPageTurn:
        return .causesPageTurn

      case .playsSound:
        return .playsSound

      case .startsMediaSession:
        return .startsMediaSession
    }
  }
}
