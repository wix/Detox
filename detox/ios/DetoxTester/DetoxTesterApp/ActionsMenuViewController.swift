//
//  ActionsMenuViewController.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import UIKit

class ActionsMenuViewController: UIViewController, UITableViewDelegate, UITableViewDataSource {
  let options: [String] = MenuOptions.allCases.map { $0.rawValue }

  let cellReuseIdentifier = "actions menu cell"

  @IBOutlet var tableView: UITableView!

  override func viewDidLoad() {
    super.viewDidLoad()
    self.tableView.register(UITableViewCell.self, forCellReuseIdentifier: cellReuseIdentifier)
    tableView.delegate = self
    tableView.dataSource = self
  }

  func numberOfSections(in tableView: UITableView) -> Int {
    return self.options.count
  }

  func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
    return 1
  }

  func tableView(_ tableView: UITableView, heightForHeaderInSection section: Int) -> CGFloat {
    return 2
  }

  func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
    let cell = self.tableView.dequeueReusableCell(withIdentifier: cellReuseIdentifier)!
    cell.textLabel?.text = self.options[indexPath.section]
    cell.textLabel?.font = .systemFont(ofSize: 14)

    cell.backgroundColor = .white
    cell.layer.borderColor = UIColor.black.cgColor

    cell.selectionStyle = .none

    cell.layer.borderWidth = 1
    cell.layer.cornerRadius = 8
    cell.clipsToBounds = true

    return cell
  }

  func tableView(_ tableView: UITableView, viewForHeaderInSection section: Int) -> UIView? {
    let headerView = UIView()
    headerView.backgroundColor = UIColor.clear
    return headerView
  }

  func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
    UIView.animate(withDuration: 0.15, delay: 0, options: .curveEaseIn, animations: {
      tableView.cellForRow(at: indexPath)!.backgroundColor = .init(red: 0.8, green: 0.8, blue: 1, alpha: 1)
    }) { _ in
      UIView.animate(withDuration: 0.1, delay: 0, options: .curveEaseOut, animations: {
        tableView.cellForRow(at: indexPath)!.backgroundColor = .white
      }) { [self] _ in
        actionCellTapped(MenuOptions.allCases[indexPath.section])
      }
    }
  }

  private func actionCellTapped(_ menuOption: MenuOptions) {
    print("Tapped on action cell: `\(menuOption.rawValue)`.")
    switch menuOption {
      case .tap, .tapOnAxis:
        presentScreen("TapScreen")

      case .longPress:
        presentScreen("LongPressScreen")

      case .longPressAndDrag:
        presentScreen("LongPressAndDragScreen")

      case .swipe:
        presentScreen("SwipeScreen")

      case .screenshot:
        fatalError()
      case .getAttributes:
        fatalError()
      case .keyboardActions:
        fatalError()
      case .scroll:
        fatalError()
      case .setColumnToValue:
        fatalError()
      case .setDatePicker:
        fatalError()
      case .pinch:
        fatalError()
      case .adjustSlider:
        fatalError()
    }
  }

  private func presentScreen(_ storyboardName: String) {
    let storyboard = UIStoryboard(name: storyboardName, bundle: nil)
    let viewController = storyboard.instantiateInitialViewController()!
    self.present(viewController, animated: true, completion: nil)
  }
}

enum MenuOptions: String, CaseIterable {
  case tap = "Tap"
  case tapOnAxis = "Tap on Axis"
  case longPress = "Long Press"
  case longPressAndDrag = "Long Press & Drag"
  case swipe = "Swipe"
  case keyboardActions = "Keyboard Actions"
  case scroll = "Scroll"
  case setColumnToValue = "Set Column"
  case setDatePicker = "Date Picker"
  case pinch = "Pinch"
  case adjustSlider = "Adjust Slider"
}
