//
//  ElementType+Extensions.swift (DetoxXCUITestRunner)
//  Created by Asaf Korem (Wix.com) on 2024.
//

import Foundation
import XCTest

extension XCUIElement.ElementType {
  /// Returns the `XCUIElement.ElementType` as a `String`.
  private func asString() -> String {
    switch self {
      case .switch:
        return "switch"

      case .tabBar:
        return "tabBar"

      case .staticText:
        return "staticText"

      case .searchField:
        return "searchField"

      case .link:
        return "link"

      case .key:
        return "key"

      case .image:
        return "image"

      case .button:
        return "button"

      case .application:
        return "application"

      case .group:
        return "group"

      case .slider:
        return "slider"

      case .map:
        return "map"

      case .window:
        return "window"

      case .sheet:
        return "sheet"

      case .drawer:
        return "drawer"

      case .alert:
        return "alert"

      case .dialog:
        return "dialog"

      case .radioButton:
        return "radioButton"

      case .radioGroup:
        return "radioGroup"

      case .checkBox:
        return "checkBox"

      case .disclosureTriangle:
        return "disclosureTriangle"

      case .popUpButton:
        return "popUpButton"

      case .comboBox:
        return "comboBox"

      case .menuButton:
        return "menuButton"

      case .toolbarButton:
        return "toolbarButton"

      case .popover:
        return "popover"

      case .keyboard:
        return "keyboard"

      case .navigationBar:
        return "navigationBar"

      case .tabGroup:
        return "tabGroup"

      case .toolbar:
        return "toolbar"

      case .statusBar:
        return "statusBar"

      case .table:
        return "table"

      case .tableRow:
        return "tableRow"

      case .tableColumn:
        return "tableColumn"

      case .outline:
        return "outline"

      case .outlineRow:
        return "outlineRow"

      case .browser:
        return "browser"

      case .collectionView:
        return "collectionView"

      case .pageIndicator:
        return "pageIndicator"

      case .progressIndicator:
        return "progressIndicator"

      case .activityIndicator:
        return "activityIndicator"

      case .segmentedControl:
        return "segmentedControl"

      case .picker:
        return "picker"

      case .pickerWheel:
        return "pickerWheel"

      case .toggle:
        return "toggle"

      case .icon:
        return "icon"

      case .scrollView:
        return "scrollView"

      case .scrollBar:
        return "scrollBar"

      case .textField:
        return "textField"

      case .secureTextField:
        return "secureTextField"

      case .datePicker:
        return "datePicker"

      case .textView:
        return "textView"

      case .menu:
        return "menu"

      case .menuItem:
        return "menuItem"

      case .menuBar:
        return "menuBar"

      case .menuBarItem:
        return "menuBarItem"

      case .webView:
        return "webView"

      case .incrementArrow:
        return "incrementArrow"

      case .decrementArrow:
        return "decrementArrow"

      case .timeline:
        return "timeline"

      case .ratingIndicator:
        return "ratingIndicator"

      case .valueIndicator:
        return "valueIndicator"

      case .splitGroup:
        return "splitGroup"

      case .splitter:
        return "splitter"

      case .relevanceIndicator:
        return "relevanceIndicator"

      case .colorWell:
        return "colorWell"

      case .helpTag:
        return "helpTag"

      case .matte:
        return "matte"

      case .dockItem:
        return "dockItem"

      case .ruler:
        return "ruler"

      case .rulerMarker:
        return "rulerMarker"

      case .grid:
        return "grid"

      case .levelIndicator:
        return "levelIndicator"

      case .cell:
        return "cell"

      case .layoutArea:
        return "layoutArea"

      case .layoutItem:
        return "layoutItem"

      case .handle:
        return "handle"

      case .stepper:
        return "stepper"

      case .tab:
        return "tab"

      case .touchBar:
        return "touchBar"

      case .statusItem:
        return "statusItem"

      case .any:
        return "any"

      case .other:
        return "other"

      @unknown default:
        return "unknown"
    }
  }

  static func from(string typeString: String) throws -> XCUIElement.ElementType {
    var type: XCUIElement.ElementType?

    var index: UInt = 0
    while let ithType = XCUIElement.ElementType(rawValue: index) {
      let ithTypeString = ithType.asString()

      guard ithTypeString != "unknown" else {
        break
      }

      if ithTypeString == typeString {
        type = ithType
        break
      }

      index += 1
    }

    guard let type else {
      throw Error.unknownElementTypeString(typeString)
    }

    return type
  }

  enum Error: Swift.Error, LocalizedError {
    case unknownElementTypeString(_ typeString: String)

    var errorDescription: String? {
      switch self {
        case .unknownElementTypeString(let typeString):
          return "Unknown element type: \(typeString)"
      }
    }
  }
}
