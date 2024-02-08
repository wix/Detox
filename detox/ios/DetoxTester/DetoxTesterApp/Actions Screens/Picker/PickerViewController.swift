//
//  PickerViewController.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import UIKit

class PickerViewController: UIViewController, UIPickerViewDelegate, UIPickerViewDataSource {
  @IBOutlet var pickerView: UIPickerView!
  var pickerData: [[String]] = [[String]]()

  override func viewDidLoad() {
    super.viewDidLoad()

    pickerView.delegate = self
    pickerView.dataSource = self
    pickerData = [
      ["Item 1", "Item 2", "Item 3", "Item 4"],
      ["Item A", "Item B", "Item C", "Item D"]
    ]
  }

  func numberOfComponents(in pickerView: UIPickerView) -> Int {
    return pickerData.count
  }

  func pickerView(_ pickerView: UIPickerView, numberOfRowsInComponent component: Int) -> Int {
    return pickerData[component].count
  }

  func pickerView(
    _ pickerView: UIPickerView, titleForRow row: Int, forComponent component: Int) -> String? {
    return pickerData[component][row]
  }
}
