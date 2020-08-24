//===--- ApproximateEquality.swift ----------------------------*- swift -*-===//
//
// This source file is part of the Swift Numerics open source project
//
// Copyright (c) 2019 - 2020 Apple Inc. and the Swift Numerics project authors
// Licensed under Apache License v2.0 with Runtime Library Exception
//
// See https://swift.org/LICENSE.txt for license information
//
//===----------------------------------------------------------------------===//

extension FloatingPoint {
  /// Test approximate equality with relative tolerance.
  ///
  /// Do not use this function to check if a number is approximately
  /// zero; no reasoned relative tolerance can do what you want for
  /// that case. Use `isAlmostZero` instead for that case.
  ///
  /// The relation defined by this predicate is symmetric and reflexive
  /// (except for NaN), but *is not* transitive. Because of this, it is
  /// often unsuitable for use for key comparisons, but it can be used
  /// successfully in many other contexts.
  ///
  /// The internet is full advice about what not to do when comparing
  /// floating-point values:
  ///
  /// - "Never compare floats for equality."
  /// - "Always use an epsilon."
  /// - "Floating-point values are always inexact."
  ///
  /// Much of this advice is false, and most of the rest is technically
  /// correct but misleading. Almost none of it provides specific and
  /// correct recommendations for what you *should* do if you need to
  /// compare floating-point numbers.
  ///
  /// There is no uniformly correct notion of "approximate equality", and
  /// there is no uniformly correct tolerance that can be applied without
  /// careful analysis. This function considers two values to be almost
  /// equal if the relative difference between them is smaller than the
  /// specified `tolerance`.
  ///
  /// The default value of `tolerance` is `sqrt(.ulpOfOne)`; this value
  /// comes from the common numerical analysis wisdom that if you don't
  /// know anything about a computation, you should assume that roughly
  /// half the bits may have been lost to rounding. This is generally a
  /// pretty safe choice of tolerance--if two values that agree to half
  /// their bits but are not meaningfully almost equal, the computation
  /// is likely ill-conditioned and should be reformulated.
  ///
  /// For more complete guidance on an appropriate choice of tolerance,
  /// consult with a friendly numerical analyst.
  ///
  /// - Parameters:
  ///   - other: the value to compare with `self`
  ///   - tolerance: the relative tolerance to use for the comparison.
  ///     Should be in the range [.ulpOfOne, 1).
  ///
  /// - Returns: `true` if `self` is almost equal to `other`; otherwise
  ///   `false`.
  @inlinable
  public func isAlmostEqual(
    to other: Self,
    tolerance: Self = Self.ulpOfOne.squareRoot()
  ) -> Bool {
    // Tolerances outside of [.ulpOfOne, 1) yield well-defined but useless
    // results, so this is enforced by an assert rathern than a precondition.
    assert(tolerance >= .ulpOfOne && tolerance < 1, "tolerance should be in [.ulpOfOne, 1).")
    // The simple computation below does not necessarily give sensible
    // results if one of self or other is infinite; we need to rescale
    // the computation in that case.
    guard self.isFinite && other.isFinite else {
      return rescaledAlmostEqual(to: other, tolerance: tolerance)
    }
    // This should eventually be rewritten to use a scaling facility to be
    // defined on FloatingPoint suitable for hypot and scaled sums, but the
    // following is good enough to be useful for now.
    let scale = max(abs(self), abs(other), .leastNormalMagnitude)
    return abs(self - other) < scale*tolerance
  }

  /// Test if this value is nearly zero with a specified `absoluteTolerance`.
  ///
  /// This test uses an *absolute*, rather than *relative*, tolerance,
  /// because no number should be equal to zero when a relative tolerance
  /// is used.
  ///
  /// Some very rough guidelines for selecting a non-default tolerance for
  /// your computation can be provided:
  ///
  /// - If this value is the result of floating-point additions or
  ///   subtractions, use a tolerance of `.ulpOfOne * n * scale`, where
  ///   `n` is the number of terms that were summed and `scale` is the
  ///   magnitude of the largest term in the sum.
  ///
  /// - If this value is the result of floating-point multiplications,
  ///   consider each term of the product: what is the smallest value that
  ///   should be meaningfully distinguished from zero? Multiply those terms
  ///   together to get a tolerance.
  ///
  /// - More generally, use half of the smallest value that should be
  ///   meaningfully distinct from zero for the purposes of your computation.
  ///
  /// For more complete guidance on an appropriate choice of tolerance,
  /// consult with a friendly numerical analyst.
  ///
  /// - Parameter absoluteTolerance: values with magnitude smaller than
  ///   this value will be considered to be zero. Must be greater than
  ///   zero.
  ///
  /// - Returns: `true` if `abs(self)` is less than `absoluteTolerance`.
  ///            `false` otherwise.
  @inlinable
  public func isAlmostZero(
    absoluteTolerance tolerance: Self = Self.ulpOfOne.squareRoot()
  ) -> Bool {
    assert(tolerance > 0)
    return abs(self) < tolerance
  }

  /// Rescales self and other to give meaningful results when one of them
  /// is infinite. We also handle NaN here so that the fast path doesn't
  /// need to worry about it.
  @usableFromInline
  internal func rescaledAlmostEqual(to other: Self, tolerance: Self) -> Bool {
    // NaN is considered to be not approximately equal to anything, not even
    // itself.
    if self.isNaN || other.isNaN { return false }
    if self.isInfinite {
      if other.isInfinite { return self == other }
      // Self is infinite and other is finite. Replace self with the binade
      // of the greatestFiniteMagnitude, and reduce the exponent of other by
      // one to compensate.
      let scaledSelf = Self(sign: self.sign,
                            exponent: Self.greatestFiniteMagnitude.exponent,
                            significand: 1)
      let scaledOther = Self(sign: .plus,
                             exponent: -1,
                             significand: other)
      // Now both values are finite, so re-run the naive comparison.
      return scaledSelf.isAlmostEqual(to: scaledOther, tolerance: tolerance)
    }
    // If self is finite and other is infinite, flip order and use scaling
    // defined above, since this relation is symmetric.
    return other.rescaledAlmostEqual(to: self, tolerance: tolerance)
  }
}
