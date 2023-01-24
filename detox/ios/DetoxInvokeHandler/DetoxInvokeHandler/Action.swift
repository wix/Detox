//
//  Action.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

/// Represents a user interaction that can be simulated on an element, if possible.
public enum Action: Equatable, Hashable {
  /// Tap on element on its activation point, multiple times (`times`).
  case tap(times: UInt = 1)

  /// Tap on element on the specified point.
  case tapOnAxis(x: Int, y: Int)

  /// Long press on element on its activation point with `duration` (`nil` when default).
  case longPress(duration: TimeInterval? = nil)

  /// Long press on element on its activation point, and drag it to a position of a `targetElement`.
  case longPressAndDrag(
    duration: Double,
    normalizedPositionX: Double?,
    normalizedPositionY: Double?,
    targetElement: AnyHashable,
    normalizedTargetPositionX: Double?,
    normalizedTargetPositionY: Double?,
    speed: ActionSpeed?,
    holdDuration: Double?
  )

  /// Swipe an element in specified `direction` and `speed`.
  case swipe(
    direction: SwipeDirection,
    speed: ActionSpeed?,
    normalizedOffset: Double?,
    normalizedStartingPointX: Double?,
    normalizedStartingPointY: Double?
  )

  /// Take screenshot of an element, and save it with the specified `imageName`.
  case screenshot(imageName: String?)

  /// Get the state attributes of an element (accessibility information).
  case getAttributes

  /// Tap a key with the specified `type`.
  case tapKey(_ type: TapKeyType)

  /// Change the text of an element, as specified by `change`.
  case changeText(_ change: ChangeTextType)

  /// Scroll a scrollable element based on the scrolling `type`.
  case scroll(_ type: ScrollType)

  /// Set the element column at `index` to `value`.
  case setColumnToValue(index: UInt, value: String)

  /// Set the date picker element to a specified `date`.
  case setDatePicker(date: Date)

  /// Pinch the element with the specified `scale`, `speed` and `angle`.
  case pinch(scale: Double, speed: ActionSpeed?, angle: Double?)

  /// Adjust a slider element to the new `normalizedPosition`.
  case adjustSlider(normalizedPosition: Double)
}

extension Action {
  /// Represents the direction of a swipe action.
  public enum SwipeDirection: String, Equatable {
    /// Swipe down.
    case down = "down"

    /// Swipe up.
    case up = "up"

    /// Swipe right.
    case right = "right"

    /// Swipe left.
    case left = "left"
  }

  /// Represents the speed of an action (`swipe` or `pinch` for example).
  public enum ActionSpeed: String, Equatable {
    /// Perform the action slowly.
    case slow = "slow"

    /// Perform the action quickly.
    case fast = "fast"
  }

  /// Represents the type of a key to tap.
  public enum TapKeyType: Equatable, Hashable {
    /// Backspace key.
    case backspaceKey

    /// Return key.
    case returnKey
  }

  /// Represents the type of the text changing action.
  public enum ChangeTextType: Equatable, Hashable {
    /// Type new `text`.
    case type(_ text: String)

    /// Replace existing text with `text`.
    case replace(_ text: String)

    /// Clear current text.
    case clear
  }

  /// Represents the type of the scrolling action.
  public enum ScrollType: Equatable, Hashable {
    /// Scroll to specified `edge`.
    case to(_ edge: ScrollToEdgeType)

    /// Scroll with given parameters.
    case withParams(
      offset: Double,
      direction: ScrollDirection,
      startNormalizedPositionX: Double?,
      startNormalizedPositionY: Double?
    )
  }

  /// Represents the element edges that can be scrolled to in a scroll interaction.
  public enum ScrollToEdgeType: String, Equatable, Hashable {
    /// Top edge.
    case top = "top"

    /// Bottom edge.
    case bottom = "bottom"

    /// Left edge.
    case left = "left"

    /// Right edge.
    case right = "right"
  }

  /// Represents the directions that can be scrolled to in a scroll with direction interaction.
  public enum ScrollDirection: String, Equatable, Hashable {
    /// Scroll down.
    case down = "down"

    /// Scroll up.
    case up = "up"

    /// Scroll right.
    case right = "right"

    /// Scroll left.
    case left = "left"
  }
}
