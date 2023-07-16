//
//  PinchViewController.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import UIKit

class PinchViewController: UIViewController, UIGestureRecognizerDelegate {
  @IBOutlet var pinchView: UIImageView!

  override func viewDidLoad() {
    super.viewDidLoad()

    pinchView.enableZoom(self)
    pinchView.enableRotation(self)
  }

  func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer, shouldRecognizeSimultaneouslyWith otherGestureRecognizer: UIGestureRecognizer) -> Bool {
    return true
  }
}

private extension UIImageView {
  func enableZoom(_ delegate: UIGestureRecognizerDelegate) {
    let pinchGesture = UIPinchGestureRecognizer(target: self, action: #selector(startZooming(_:)))
    isUserInteractionEnabled = true
    pinchGesture.delegate = delegate
    addGestureRecognizer(pinchGesture)
  }

  @objc
  func startZooming(_ sender: UIPinchGestureRecognizer) {
    sender.view!.transform = sender.view!.transform.scaledBy(x: sender.scale, y: sender.scale);
    sender.scale = 1;
  }
}

private extension UIImageView {
  func enableRotation(_ delegate: UIGestureRecognizerDelegate) {
    let rotationGesture = UIRotationGestureRecognizer(
      target: self,
      action: #selector(startRotate(_:))
    )
    isUserInteractionEnabled = true
    rotationGesture.delegate = delegate
    addGestureRecognizer(rotationGesture)
  }

  @objc
  func startRotate(_ sender: UIRotationGestureRecognizer) {
    sender.view!.transform = sender.view!.transform.rotated(by: sender.rotation);
    sender.rotation = 0;
  }
}
