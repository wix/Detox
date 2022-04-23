//
//  CGPoint+Extensions.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

extension CGPoint {
  /// Normalize the point in the given `size`.
  func normalize(in size: CGSize) -> CGPoint {
    guard size.width > 0, size.height > 0
    else {
      return .zero
    }

    return .init(x: self.x / size.width, y: self.y / size.height)
  }

  /// Convert point from screen coordinates to the given `rect` coordinates.
  func convertToRectCoordinates(_ rect: CGRect) -> CGPoint {
    return .init(x: x - rect.origin.x, y: y - rect.origin.y)
  }
}
