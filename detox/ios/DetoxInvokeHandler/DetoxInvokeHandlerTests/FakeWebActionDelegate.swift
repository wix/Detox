//
//  FakeWebActionDelegate.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import Foundation

class FakeWebActionDelegate: WebActionDelegateProtocol {
  struct Error: Swift.Error { }

  var shouldThrow: Bool = false

  var text: String?

  var currentUrl: String?

  var title: String?

  private(set) var actRecorder: [(WebAction, AnyHashable)] = []

  func act(action: WebAction, on element: AnyHashable) throws {
    actRecorder.append((action, element))

    if shouldThrow {
      throw Error()
    }
  }

  func getText(of element: AnyHashable) throws -> AnyCodable {
    AnyCodable(text)
  }

  func getCurrentUrl(of element: AnyHashable) throws -> AnyCodable {
    AnyCodable(currentUrl)
  }

  func getTitle(of element: AnyHashable) throws -> AnyCodable {
    AnyCodable(title)
  }
}
