//
//  Encodable+Extensions.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

extension Encodable {
  /// Returns the object as a dictionary.
  func encodeToDictionary() -> [String: Any] {
    let dictionary = (
      try? JSONSerialization.jsonObject(
        with: JSON.encoder.encode(self)
      )
    ) as? [String: Any] ?? [:]

    return dictionary.compactMapValues { $0 }
  }
}
