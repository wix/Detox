//
//  LongPressAndDragViewController.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import UIKit

class LongPressAndDragViewController: UIViewController {
  @IBOutlet var longPressAndDragButton: UIButton!
  @IBOutlet var label: UILabel!

  var allowDragging = false
  var intersectionStarted: Date?

  override func viewDidLoad() {
    super.viewDidLoad()
    setupLongPressGestureRecognizer()
    setupDragGestureRecognizer()
  }

  private func setupLongPressGestureRecognizer() {
    let longPressGestureRecognizer = UILongPressGestureRecognizer(
      target: self,
      action: #selector(pressed)
    )
    longPressGestureRecognizer.delegate = self
    longPressAndDragButton.addGestureRecognizer(longPressGestureRecognizer)
  }

  private func setupDragGestureRecognizer() {
    let dragGestureRecognizer = UIPanGestureRecognizer(
      target: self,
      action: #selector(panned)
    )
    dragGestureRecognizer.delegate = self
    longPressAndDragButton.addGestureRecognizer(dragGestureRecognizer)
  }

  @objc private func pressed() {
    print("Long-press button long-pressed")
    changeButtonToDraggableState()
  }

  private func changeButtonToDraggableState() {
    allowDragging = true

    longPressAndDragButton.layer.add(makeShakeAnimation(), forKey:"animate")
    longPressAndDragButton.setTitle("Drag", for: .normal)

    longPressAndDragButton.setNeedsLayout()
    longPressAndDragButton.layoutIfNeeded()
  }

  private func makeShakeAnimation() -> CABasicAnimation {
    let shakeAnimation = CABasicAnimation(keyPath: "transform.rotation")
    shakeAnimation.duration = 0.05
    shakeAnimation.repeatCount = 4
    shakeAnimation.autoreverses = true
    shakeAnimation.duration = 0.2
    shakeAnimation.repeatCount = 99999

    let startAngle: Float = -0.035
    let stopAngle = -startAngle

    shakeAnimation.fromValue = NSNumber(value: startAngle as Float)
    shakeAnimation.toValue = NSNumber(value: 3 * stopAngle as Float)
    shakeAnimation.autoreverses = true
    shakeAnimation.timeOffset = 290 * drand48()

    return shakeAnimation
  }

  @objc private func panned(_ sender: UIPanGestureRecognizer) {
    print("Drag button panned")

    if (sender.state == .ended) {
      UIView.animate(withDuration: 0.1, delay: 0, options: .curveEaseIn) {
        self.longPressAndDragButton!.center = self.view.center
      }
      return
    }

    if (longPressAndDragButton.frame.intersects(label.frame)) {
      if (intersectionStarted == nil) {
        intersectionStarted = Date.now
      }

      if (intersectionStarted?.timeIntervalSinceNow ?? 0 <= -1) {
        UIView.animate(withDuration: 0.05, delay: 0, options: .curveEaseIn) {
          self.longPressAndDragButton!.center = self.view.center
        }

        label.text = "Success!"

        intersectionStarted = nil
        return
      }
    } else {
      intersectionStarted = nil
    }

    longPressAndDragButton.center += sender.translation(in: longPressAndDragButton)
    sender.setTranslation(.zero, in: longPressAndDragButton)
  }
}

extension LongPressAndDragViewController: UIGestureRecognizerDelegate {
  func gestureRecognizer(
    _ gestureRecognizer: UIGestureRecognizer,
    shouldRecognizeSimultaneouslyWith otherGestureRecognizer: UIGestureRecognizer
  ) -> Bool {
      return gestureRecognizer is UIPanGestureRecognizer
          && otherGestureRecognizer is UILongPressGestureRecognizer
  }

  func gestureRecognizer(
    _ gestureRecognizer: UIGestureRecognizer,
    shouldBeRequiredToFailBy otherGestureRecognizer: UIGestureRecognizer
  ) -> Bool {
    return gestureRecognizer is UIPanGestureRecognizer
        && otherGestureRecognizer is UILongPressGestureRecognizer
  }
}
