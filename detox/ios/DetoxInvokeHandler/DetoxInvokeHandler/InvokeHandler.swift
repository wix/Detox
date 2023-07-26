//
//  InvokeHandler.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

/// Handles JSON messages by parsing them and routing them into the relevant delegate to handle the
/// requested action or expectation on the specified element (in which located by the provided
/// element matcher).
public class InvokeHandler {
  /// Used to find elements by matching to a given pattern (the message predicate).
  private let elementMatcher: ElementMatcherProtocol

  /// Used to delegate actions on elements.
  private let actionDelegate: ActionDelegateProtocol

  /// Used to delegate web actions on web elements.
  private let webActionDelegate: WebActionDelegateProtocol

  /// Used to delegate expectations on elements.
  private let expectationDelegate: ExpectationDelegateProtocol

  /// Used to delegate expectations on web elements.
  private let webExpectationDelegate: WebExpectationDelegateProtocol

  /// Initializes the handler with given params.
  public init(
    elementMatcher: ElementMatcherProtocol,
    actionDelegate: ActionDelegateProtocol,
    webActionDelegate: WebActionDelegateProtocol,
    expectationDelegate: ExpectationDelegateProtocol,
    webExpectationDelegate: WebExpectationDelegateProtocol
  ) {
    self.elementMatcher = elementMatcher
    self.actionDelegate = actionDelegate
    self.webActionDelegate = webActionDelegate
    self.expectationDelegate = expectationDelegate
    self.webExpectationDelegate = webExpectationDelegate
  }

  /// Handles the given `message` by parsing and calling the relevant delegate.
  ///
  /// - Returns `nil` if nothing was requested by the message. Otherwise returns a dictionary.
  public func handle(_ message: [String: AnyHashable]) throws -> AnyCodable? {
    let parsedMessage = try Message(from: message)
    return try handle(parsedMessage: parsedMessage)
  }

  private func handle(parsedMessage: Message) throws -> AnyCodable? {
    switch parsedMessage.type {
      case .action:
        return try handleActionMessage(parsedMessage: parsedMessage)

      case .webAction:
        return try handleWebActionMessage(parsedMessage: parsedMessage)

      case .expectation:
        return try handleExpectationMessage(parsedMessage: parsedMessage)

      case .webExpectation:
        return try handleWebExpectationMessage(parsedMessage: parsedMessage)
    }
  }

  // MARK: - Handle Web Expectation Message

  private func handleWebExpectationMessage(parsedMessage: Message) throws -> AnyCodable? {
    guard let expectationType = parsedMessage.webExpectation else {
      fatalError("invalid web expectation type (\(parsedMessage)")
    }

    let expectation = WebExpectation.make(from: expectationType, params: parsedMessage.params)
    let isTruthy: Bool = parsedMessage.modifiers?.contains(.not) != true

    let webViewElement = try findWebViewElement(from: parsedMessage)
    try webExpectationDelegate.expect(expectation, isTruthy: isTruthy, on: webViewElement)

    return nil
  }

  // MARK: - Handle Web Action Message

  private func handleWebActionMessage(
    parsedMessage: Message
  ) throws -> AnyCodable? {
    guard let webActionType = parsedMessage.webAction else {
      fatalError("invalid web action type (\(parsedMessage)")
    }

    let webViewElement = try findWebViewElement(from: parsedMessage)

    switch webActionType {
      case .getText:
        return try webActionDelegate.getText(of: webViewElement)

      case .getCurrentUrl:
        return try webActionDelegate.getCurrentUrl(of: webViewElement)

      case .getTitle:
        return try webActionDelegate.getTitle(of: webViewElement)

      default:
        let webAction = WebAction.make(from: webActionType, params: parsedMessage.params)
        try webActionDelegate.act(action: webAction, on: webViewElement)
    }

    return nil
  }

  private func findWebViewElement(from parsedMessage: Message) throws -> AnyHashable {
    let predicate = parsedMessage.predicate
    let matchedWebViews = try findWebViews(by: predicate)
    guard let webView = try getElement(from: matchedWebViews, at: parsedMessage.atIndex) else {
      throw Error.noElementAtIndex(
        index: parsedMessage.atIndex ?? 0,
        elementsCount: matchedWebViews.count,
        predicate: predicate
      )
    }

    let matchedWebViewElements = try findWebViewElements(webView, by: parsedMessage.webPredicate)
    guard let webViewElement = try getElement(
      from: matchedWebViewElements,
      at: parsedMessage.webAtIndex
    ) else {
      throw Error.noWebElementAtIndex(
        index: parsedMessage.webAtIndex ?? 0,
        elementsCount: matchedWebViewElements.count,
        predicate: parsedMessage.webPredicate,
        webViewPredicate: parsedMessage.predicate
      )
    }

    return webViewElement
  }

  private func findWebViews(by predicate: ElementPredicate?) throws -> [AnyHashable] {
    let pattern = (predicate != nil) ? try ElementPattern(from: predicate!) : nil
    return try elementMatcher.matchWebViews(to: pattern)
  }

  private func findWebViewElements(
    _ webView: AnyHashable,
    by predicate: WebPredicate?
  ) throws -> [AnyHashable] {
    let pattern = try WebElementPattern(from: predicate!)
    return try elementMatcher.matchWebViewElements(on: webView, to: pattern)
  }

  // MARK: - Handle Action Message

  private func handleActionMessage(
    parsedMessage: Message
  ) throws -> AnyCodable? {
    guard let action = parsedMessage.action else {
      fatalError("invalid action type (\(parsedMessage)")
    }

    if let whileMessage = parsedMessage.whileMessage {
      do {
        try handleWhileMessage(whileMessage)

        return nil // Expectation was satisfied.
      }
      catch {
        // Do nothing, expectation wasn't satisfied.
      }
    }

    let predicate = parsedMessage.predicate!
    let elements = try findElements(by: predicate)

    if action == .getAttributes && parsedMessage.atIndex == nil {
      return try getAttributes(from: elements)
    }

    guard let element = try getElement(from: elements, at: parsedMessage.atIndex) else {
      throw Error.noElementAtIndex(
        index: parsedMessage.atIndex ?? 0,
        elementsCount: elements.count,
        predicate: predicate
      )
    }

    if action == .getAttributes {
      return try getAttributes(from: [element])
    }

    if action == .takeScreenshot {
      return try takeScreenshot(parsedMessage.params, of: element)
    }

    let targetElementPredicate = parsedMessage.targetElement?.predicate
    let targetElements = targetElementPredicate != nil ?
    try findElements(by: targetElementPredicate!) : nil
    let targetElement = targetElements != nil ?
    try getElement(from: targetElements!, at: 0) : nil

    try handleAction(
      on: element,
      type: action,
      params: parsedMessage.params,
      whileMessage: parsedMessage.whileMessage,
      target: targetElement
    )

    return nil
  }

  // MARK: - Handle Expectation Message

  private func handleExpectationMessage(
    parsedMessage: Message
  ) throws -> AnyCodable? {
    let findElementHandler: () throws -> AnyHashable? = { [self] in
      return try getElement(
        from: try findElements(by: parsedMessage.predicate!),
        at: parsedMessage.atIndex
      )
    }

    try handleExpectation(
      on: findElementHandler,
      type: parsedMessage.expectation!,
      params: parsedMessage.params,
      modifiers: parsedMessage.modifiers,
      timeout: parsedMessage.timeout
    )

    return nil
  }

  // MARK: - Find element

  private func findElements(by predicate: ElementPredicate) throws -> [AnyHashable] {
    let pattern = try ElementPattern(from: predicate)
    return try elementMatcher.match(to: pattern)
  }

  private func getElement(from elements: [AnyHashable], at index: Int?) throws -> AnyHashable? {
    let index = index ?? 0
    guard index >= 0, elements.count > index else {
      return nil
    }

    return elements[index]
  }

  // MARK: - Get attributes

  private func getAttributes(from elements: [AnyHashable]) throws -> AnyCodable {
    return try actionDelegate.getAttributes(from: elements)
  }

  // MARK: - Take screenshot

  private func takeScreenshot(_ params: [AnyCodable]?, of element: AnyHashable) throws -> AnyCodable {
    return try actionDelegate.takeScreenshot(
      params != nil ? (params![0].value as! String) : nil,
      date: Date(),
      of: element
    )
  }

  // MARK: - Handle actions

  private func handleAction(
    on element: AnyHashable,
    type: ActionType,
    params: [AnyCodable]?,
    whileMessage: WhileMessage?,
    target targetElement: AnyHashable? = nil
  ) throws {
    guard let whileMessage = whileMessage else {
      try handleAction(on: element, type: type, params: params, target: targetElement)
      return
    }

    var previousScreenshot = (element as? ScreenshotProvidingProtocol)?.screenshotData()
    while (true) {
      do {
        try handleWhileMessage(whileMessage)
      } catch {
        try handleAction(on: element, type: type, params: params, target: targetElement)

        guard
          let currentScreenshot = (element as? ScreenshotProvidingProtocol)?.screenshotData()
        else {
          continue
        }

        if previousScreenshot?.elementsEqual(currentScreenshot) == true {
          throw Error.noStateChangeWhileMessage(withError: String(describing: error))
        }

        previousScreenshot = currentScreenshot
        continue
      }

      break
    }
  }

  private func handleAction(
    on element: AnyHashable,
    type: ActionType,
    params: [AnyCodable]?,
    target targetElement: AnyHashable?
  ) throws {
    try actionDelegate.act(
      action: action(type: type, params: params, target: targetElement),
      on: element
    )
  }

  private func action(
    type: ActionType,
    params: [AnyCodable]?,
    target targetElement: AnyHashable?
  ) throws -> Action {
    switch type {
      case .tap:
        return try tapAction(params: params)

      case .multiTap:
        return try multiTapAction(params: params)

      case .longPress:
        return try longPressAction(params: params, target: targetElement)

      case .swipe:
        return try swipeAction(params: params)

      case .takeScreenshot:
        return try screenshotAction(params: params)

      case .tapBackspaceKey:
        return .tapKey(.backspaceKey)

      case .tapReturnKey:
        return .tapKey(.returnKey)

      case .typeText:
        return try typeTextAction(params: params)

      case .replaceText:
        return try replaceTextAction(params: params)

      case .clearText:
        return .changeText(.clear)

      case .scrollTo:
        return try scrollToAction(params: params)

      case .scroll:
        return try scrollAction(params: params)

      case .setColumnToValue:
        return try setColumnToValueAction(params: params)

      case .setDatePickerDate:
        return try setDatePickerAction(params: params)

      case .pinch:
        return try pinchAction(params: params)

      case .adjustSliderToPosition:
        return try adjustSliderAction(params: params)

      case .performAccessibilityAction:
        return try performAccessibilityAction(params: params)

      case .getAttributes:
        fatalError("invalid action handling request, cannot handle get-attributes from here")
    }
  }

  private func handleWhileMessage(_ whileMessage: WhileMessage) throws {
    let findElementHandler: () throws -> AnyHashable? = { [self] in
      let elements = try findElements(by: whileMessage.predicate)
      return try getElement(from: elements, at: whileMessage.atIndex)
    }

    try handleExpectation(
      on: findElementHandler,
      type: whileMessage.expectation,
      params: whileMessage.params,
      modifiers: whileMessage.modifiers,
      timeout: nil
    )
  }

  private func tapAction(params: [AnyCodable]?) throws -> Action {
    guard let params = params else {
      return .tap()
    }

    let axisParam = (params.first?.value)! as! [String: Int]
    let x = axisParam["x"]!
    let y = axisParam["y"]!

    return .tapOnAxis(x: x, y: y)
  }

  private func multiTapAction(params: [AnyCodable]?) throws -> Action {
    return .tap(times: UInt(params!.first!.value as! Int))
  }

  private func longPressAction(
    params: [AnyCodable]?,
    target targetElement: AnyHashable?
  ) throws -> Action {
    guard let params = params else {
      return .longPress()
    }

    let duration = (params[0].value as! NSNumber).doubleValue / 1000

    if params.count == 1 {
      return .longPress(duration: duration)
    }

    let speedString = params[5].value as? String
    let speed: Action.ActionSpeed? = speedString != nil ? .init(rawValue: speedString!)! : nil

    return .longPressAndDrag(
      duration: duration,
      normalizedPositionX: (params[1].value as? NSNumber)?.doubleValue,
      normalizedPositionY: (params[2].value as? NSNumber)?.doubleValue,
      targetElement: targetElement!,
      normalizedTargetPositionX: (params[3].value as? NSNumber)?.doubleValue,
      normalizedTargetPositionY: (params[4].value as? NSNumber)?.doubleValue,
      speed: speed,
      holdDuration: (params[6].value as? NSNumber)?.doubleValue
    )
  }

  private func swipeAction(params: [AnyCodable]?) throws -> Action {
    let direction: Action.SwipeDirection = .init(rawValue: (params?[0].value as! String))!

    let speedString = params?[1].value as? String
    let speed: Action.ActionSpeed? = speedString != nil ? .init(rawValue: speedString!)! : nil

    return .swipe(
      direction: direction,
      speed: speed,
      normalizedOffset: (params?[2].value as? NSNumber)?.doubleValue,
      normalizedStartingPointX: (params?[3].value as? NSNumber)?.doubleValue,
      normalizedStartingPointY: (params?[4].value as? NSNumber)?.doubleValue
    )
  }

  private func screenshotAction(params: [AnyCodable]?) throws -> Action {
    return .screenshot(imageName: params?[0].value as? String)
  }

  private func typeTextAction(params: [AnyCodable]?) throws -> Action {
    return .changeText(.type(params!.first!.value as! String))
  }

  private func replaceTextAction(params: [AnyCodable]?) throws -> Action {
    return .changeText(.replace(params!.first!.value as! String))
  }

  private func scrollToAction(params: [AnyCodable]?) throws -> Action {
    return .scroll(.to(.init(rawValue: params!.first!.value as! String)!))
  }

  private func scrollAction(params: [AnyCodable]?) throws -> Action {
    return .scroll(.withParams(
      offset: (params?[0].value as? NSNumber)!.doubleValue,
      direction: .init(rawValue: params![1].value as! String)!,
      startNormalizedPositionX: (params![2].value as? NSNumber)?.doubleValue,
      startNormalizedPositionY: (params![3].value as? NSNumber)?.doubleValue)
    )
  }

  private func setColumnToValueAction(params: [AnyCodable]?) throws -> Action {
    return .setColumnToValue(
      index: UInt(params?[0].value as! Int),
      value: params?[1].value as! String
    )
  }

  private func setDatePickerAction(params: [AnyCodable]?) throws -> Action {
    let dateString = params?[0].value as! String
    let formatString = params?[1].value as! String

    let date = date(from: dateString, using: formatString)!

    return .setDatePicker(date: date)
  }

  private func date(from dateString: String, using formatString: String) -> Date? {
    if formatString == "ISO8601" {
      let formatter = ISO8601DateFormatter()
      return formatter.date(from: dateString)
    }

    let formatter = dateFormatter(from: formatString)
    return formatter.date(from: dateString)
  }

  private func dateFormatter(from format: String) -> DateFormatter {
    let dateFormatter = DateFormatter()
    dateFormatter.locale = Locale(identifier: "en_US_POSIX")
    dateFormatter.dateFormat = format

    return dateFormatter
  }

  private func pinchAction(params: [AnyCodable]?) throws -> Action {
    return .pinch(
      scale: (params![0].value as! NSNumber).doubleValue,
      speed: .init(rawValue: params![1].value as! String)!,
      angle: (params![2].value as! NSNumber).doubleValue
    )
  }

  private func adjustSliderAction(params: [AnyCodable]?) throws -> Action {
    return .adjustSlider(normalizedPosition: (params!.first?.value as! NSNumber).doubleValue)
  }

  private func performAccessibilityAction(params: [AnyCodable]?) throws -> Action {
    return .performAccessibilityAction(actionName: params!.first?.value as! String)
  }

  // MARK: - Handle expectations

  private func handleExpectation(
    on findElementHandler: () throws -> AnyHashable?,
    type: ExpectationType,
    params: [AnyCodable]?,
    modifiers: [ElementPredicateModifiers]?,
    timeout: Double?
  ) throws {
    let isTruthy: Bool = modifiers?.contains(.not) != true

    try expectationDelegate.expect(
      expectation(type: type, params: params),
      isTruthy: isTruthy,
      on: findElementHandler,
      timeout: timeout
    )
  }

  private func expectation(type: ExpectationType, params: [AnyCodable]?) throws -> Expectation {
    switch type {
      case .toBeVisible:
        return try visibilityExpectation(params: params)

      case .toBeFocused:
        return .toBeFocused

      case .toHaveText:
        return try textExpectation(params: params)

      case .toHaveId:
        return try idExpectation(params: params)

      case .toHaveSliderPosition:
        return try sliderPositionExpectation(params: params)

      case .toExist:
        return .toExist

      case .toHaveValue:
        return try valueExpectation(params: params)

      case .toHaveToggleValue:
        return try toggleValueExpectation(params: params)

      case .toHaveLabel:
        return try labelExpectation(params: params)
    }
  }

  private func visibilityExpectation(params: [AnyCodable]?) throws -> Expectation {
    let threshold = (params?.first?.value as? NSNumber)?.doubleValue
    return .toBeVisible(threshold: threshold ?? 75)
  }

  private func textExpectation(params: [AnyCodable]?) throws -> Expectation {
    let text = (params?.first?.value)! as! String
    return .toHaveText(text)
  }

  private func idExpectation(params: [AnyCodable]?) throws -> Expectation {
    let id = (params?.first?.value)! as! String
    return .toHaveId(id)
  }

  private func sliderPositionExpectation(params: [AnyCodable]?) throws -> Expectation {
    let normalizedPosition = ((params?.first?.value)! as! NSNumber).doubleValue
    let tolerance = params?.count == 2 ? (params?[1].value as? NSNumber)?.doubleValue : nil
    return .toHaveSliderInPosition(normalizedPosition: normalizedPosition, tolerance: tolerance)
  }

  private func valueExpectation(params: [AnyCodable]?) throws -> Expectation {
    let value = (params?.first?.value)! as! String
    return .toHaveValue(value)
  }

  private func toggleValueExpectation(params: [AnyCodable]?) throws -> Expectation {
    let value = (params?.first?.value)! as! Bool
    return .toHaveToggleValue(value)
  }

  private func labelExpectation(params: [AnyCodable]?) throws -> Expectation {
    let label = (params?.first?.value)! as! String
    return .toHaveLabel(label)
  }
}
