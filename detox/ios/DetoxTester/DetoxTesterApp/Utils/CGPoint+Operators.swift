//
//  CGPoint+Operators.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import CoreGraphics

extension CGPoint {
  static func +(lhs: CGPoint, rhs: CGPoint) -> CGPoint {
    return CGPoint(x: lhs.x + rhs.x, y: lhs.y + rhs.y)
  }

  static func +=(lhs: inout CGPoint, rhs: CGPoint) {
    lhs = lhs + rhs
  }
}
