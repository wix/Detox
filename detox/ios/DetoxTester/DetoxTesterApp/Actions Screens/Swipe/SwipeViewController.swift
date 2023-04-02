//
//  SwipeViewController.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import UIKit

class SwipeViewController: UIViewController {
  @IBOutlet var swipableView: UIView!
  @IBOutlet var label: UILabel!

  override func viewDidLoad() {
    super.viewDidLoad()

    let swipeGestureRecognizer = UISwipeGestureRecognizer(
      target: self,
      action: #selector(swiped(_:))
    )
    swipeGestureRecognizer.direction = .right
    swipableView.addGestureRecognizer(swipeGestureRecognizer)
  }

  @objc private func swiped(_ sender: UISwipeGestureRecognizer) {
    print("Swipable view swiped")
    label.text = "Success!"
  }
}
