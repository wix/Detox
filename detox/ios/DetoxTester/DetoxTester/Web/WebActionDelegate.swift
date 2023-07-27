//
//  WebActionDelegate.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import DetoxInvokeHandler
import Foundation
import XCTest

/// A delegate for actions that can be performed on an web element.
class WebActionDelegate: WebActionDelegateProtocol {
  func act(action: DetoxInvokeHandler.WebAction, on element: AnyHashable) throws {
    fatalError("unsupported")
  }

  func getText(of element: AnyHashable) throws -> AnyCodable {
    fatalError("unsupported")
  }

  func getCurrentUrl(of element: AnyHashable) throws -> AnyCodable {
    fatalError("unsupported")
  }

  func getTitle(of element: AnyHashable) throws -> AnyCodable {
    fatalError("unsupported")
  }
}
