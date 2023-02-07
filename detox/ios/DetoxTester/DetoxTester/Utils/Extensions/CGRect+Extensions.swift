//
//  CGRect+Extensions.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import DetoxInvokeHandler

extension CGRect {
  /// Center point of the rect.
  var center: CGPoint {
    return .init(
      x: origin.x + width / 2,
      y: origin.y + height / 2
    )
  }

  /// Dictionary representation of the rect.
  var dictionary: [String: CGFloat] {
    return [
      "width": width,
      "height": height,
      "x": origin.x,
      "y": origin.y
    ]
  }
}
