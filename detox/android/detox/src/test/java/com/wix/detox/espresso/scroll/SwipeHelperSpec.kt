package com.wix.detox.espresso.scroll

import com.wix.detox.espresso.common.annot.*
import org.junit.Assert.assertEquals
import org.spekframework.spek2.Spek
import org.spekframework.spek2.style.specification.describe

const val EDGE_FUZZ_FACTOR = 0.083

object SwipeHelperSpec: Spek({
    fun assertPointsEqual(expected: Pair<Point, Point>, actual: Pair<Point, Point>) {
        assertEquals(expected.first.first, actual.first.first, 0.01)
        assertEquals(expected.first.second, actual.first.second, 0.01)
        assertEquals(expected.second.first, actual.second.first, 0.01)
        assertEquals(expected.second.second, actual.second.second, 0.01)
    }

    describe("SwipeHelper") {
        it("should calculate left swipe with default values") {
            var from = Pair(0.5 + EDGE_FUZZ_FACTOR, 0.5)
            var to = Pair(0.0, 0.5)
            var expected = Pair(from, to)
            var actual = SwipeHelper.calculateSwipe(MOTION_DIR_LEFT)

            assertPointsEqual(expected, actual)
        }

        it("should calculate top swipe with default values") {
            val from = Pair(0.5, 0.5 + EDGE_FUZZ_FACTOR)
            val to = Pair(0.5, 0.0)
            val expected = Pair(from, to)
            val actual = SwipeHelper.calculateSwipe(MOTION_DIR_UP)

            assertPointsEqual(expected, actual)
        }

        it("should calculate bottom swipe with default values") {
            val from = Pair(0.5, 0.5 - EDGE_FUZZ_FACTOR)
            val to = Pair(0.5, 1.0)
            val expected = Pair(from, to)
            val actual = SwipeHelper.calculateSwipe(MOTION_DIR_DOWN)

            assertPointsEqual(expected, actual)
        }

        it("should calculate right swipe with default values") {
            val from = Pair(0.5 - EDGE_FUZZ_FACTOR, 0.5)
            val to = Pair(1.0, 0.5)
            val expected = Pair(from, to)
            val actual = SwipeHelper.calculateSwipe(MOTION_DIR_RIGHT)

            assertPointsEqual(expected, actual)
        }

        it("should calculate top swipe with given offset") {
            val from = Pair(0.5, 0.5 + EDGE_FUZZ_FACTOR)
            val to = Pair(0.5, 0.25 + EDGE_FUZZ_FACTOR)
            val expected = Pair(from, to)
            val actual = SwipeHelper.calculateSwipe(MOTION_DIR_UP, 0.25, Double.NaN, Double.NaN)

            assertPointsEqual(expected, actual)
        }

        it("should calculate bottom swipe with given offset") {
            val from = Pair(0.5, 0.5 - EDGE_FUZZ_FACTOR)
            val to = Pair(0.5, 0.75 - EDGE_FUZZ_FACTOR)
            val expected = Pair(from, to)
            val actual = SwipeHelper.calculateSwipe(MOTION_DIR_DOWN, 0.25, Double.NaN, Double.NaN)

            assertPointsEqual(expected, actual)
        }

        it("should calculate left swipe with given offset") {
            val from = Pair(0.5 + EDGE_FUZZ_FACTOR, 0.5)
            val to = Pair(0.25 + EDGE_FUZZ_FACTOR, 0.5)
            val expected = Pair(from, to)
            val actual = SwipeHelper.calculateSwipe(MOTION_DIR_LEFT, 0.25, Double.NaN, Double.NaN)

            assertPointsEqual(expected, actual)
        }

        it("should calculate right swipe with given offset") {
            val from = Pair(0.5 - EDGE_FUZZ_FACTOR, 0.5)
            val to = Pair(0.75 - EDGE_FUZZ_FACTOR, 0.5)
            val expected = Pair(from, to)
            val actual = SwipeHelper.calculateSwipe(MOTION_DIR_RIGHT, 0.25, Double.NaN, Double.NaN)

            assertPointsEqual(expected, actual)
        }

        it("should calculate top swipe with offset exceeding start position") {
            val from = Pair(0.5, 0.75)
            val to = Pair(0.5, 0.0)
            val expected = Pair(from, to)
            val actual = SwipeHelper.calculateSwipe(MOTION_DIR_UP, 0.75, Double.NaN, Double.NaN)

            assertPointsEqual(expected, actual)
        }

        it("should calculate bottom swipe with offset exceeding start position") {
            val from = Pair(0.5, 0.25)
            val to = Pair(0.5, 1.0)
            val expected = Pair(from, to)
            val actual = SwipeHelper.calculateSwipe(MOTION_DIR_DOWN, 0.75, Double.NaN, Double.NaN)

            assertPointsEqual(expected, actual)
        }

        it("should calculate left swipe with offset exceeding start position") {
            val from = Pair(0.75, 0.5)
            val to = Pair(0.0, 0.5)
            val expected = Pair(from, to)
            val actual = SwipeHelper.calculateSwipe(MOTION_DIR_LEFT, 0.75, Double.NaN, Double.NaN)

            assertPointsEqual(expected, actual)
        }

        it("should calculate right swipe with offset exceeding start position") {
            val from = Pair(0.25, 0.5)
            val to = Pair(1.0, 0.5)
            val expected = Pair(from, to)
            val actual = SwipeHelper.calculateSwipe(MOTION_DIR_RIGHT, 0.75, Double.NaN, Double.NaN)

            assertPointsEqual(expected, actual)
        }

        it("should calculate top swipe with offset exceeding 1.0") {
            val from = Pair(0.5, 1.0)
            val to = Pair(0.5, 0.0)
            val expected = Pair(from, to)
            val actual = SwipeHelper.calculateSwipe(MOTION_DIR_UP, 2.0, Double.NaN, Double.NaN)

            assertPointsEqual(expected, actual)
        }

        it("should calculate bottom swipe with offset exceeding 1.0") {
            val from = Pair(0.5, 0.0)
            val to = Pair(0.5, 1.0)
            val expected = Pair(from, to)
            val actual = SwipeHelper.calculateSwipe(MOTION_DIR_DOWN, 2.0, Double.NaN, Double.NaN)

            assertPointsEqual(expected, actual)
        }

        it("should calculate left swipe with offset exceeding 1.0") {
            val from = Pair(1.0, 0.5)
            val to = Pair(0.0, 0.5)
            val expected = Pair(from, to)
            val actual = SwipeHelper.calculateSwipe(MOTION_DIR_LEFT, 2.0, Double.NaN, Double.NaN)

            assertPointsEqual(expected, actual)
        }

        it("should calculate right swipe with offset exceeding 1.0") {
            val from = Pair(0.0, 0.5)
            val to = Pair(1.0, 0.5)
            val expected = Pair(from, to)
            val actual = SwipeHelper.calculateSwipe(MOTION_DIR_RIGHT, 2.0, Double.NaN, Double.NaN)

            assertPointsEqual(expected, actual)
        }

        it("should calculate top swipe with given start X") {
            val from = Pair(0.25, 0.5 + EDGE_FUZZ_FACTOR)
            val to = Pair(0.25, 0.0)
            val expected = Pair(from, to)
            val actual = SwipeHelper.calculateSwipe(MOTION_DIR_UP, Double.NaN, 0.25, Double.NaN)

            assertPointsEqual(expected, actual)
        }

        it("should calculate bottom swipe with given start X") {
            val from = Pair(0.25, 0.5 - EDGE_FUZZ_FACTOR)
            val to = Pair(0.25, 1.0)
            val expected = Pair(from, to)
            val actual = SwipeHelper.calculateSwipe(MOTION_DIR_DOWN, Double.NaN, 0.25, Double.NaN)

            assertPointsEqual(expected, actual)
        }

        it("should calculate left swipe with given start Y") {
            val from = Pair(0.5 + EDGE_FUZZ_FACTOR, 0.25)
            val to = Pair(0.0, 0.25)
            val expected = Pair(from, to)
            val actual = SwipeHelper.calculateSwipe(MOTION_DIR_LEFT, Double.NaN, Double.NaN, 0.25)

            assertPointsEqual(expected, actual)
        }

        it("should calculate right swipe with given start Y") {
            val from = Pair(0.5 - EDGE_FUZZ_FACTOR, 0.25)
            val to = Pair(1.0, 0.25)
            val expected = Pair(from, to)
            val actual = SwipeHelper.calculateSwipe(MOTION_DIR_RIGHT, Double.NaN, Double.NaN, 0.25)

            assertPointsEqual(expected, actual)
        }

        it("should calculate top swipe with given start Y") {
            val from = Pair(0.5, 0.75)
            val to = Pair(0.5, 0.25 - EDGE_FUZZ_FACTOR)
            val expected = Pair(from, to)
            val actual = SwipeHelper.calculateSwipe(MOTION_DIR_UP, Double.NaN, Double.NaN, 0.75)

            assertPointsEqual(expected, actual)
        }

        it("should calculate bottom swipe with given start Y") {
            val from = Pair(0.5, 0.25)
            val to = Pair(0.5, 0.75 + EDGE_FUZZ_FACTOR)
            val expected = Pair(from, to)
            val actual = SwipeHelper.calculateSwipe(MOTION_DIR_DOWN, Double.NaN, Double.NaN, 0.25)

            assertPointsEqual(expected, actual)
        }

        it("should calculate left swipe with given start X") {
            val from = Pair(0.75, 0.5)
            val to = Pair(0.25 - EDGE_FUZZ_FACTOR, 0.5)
            val expected = Pair(from, to)
            val actual = SwipeHelper.calculateSwipe(MOTION_DIR_LEFT, Double.NaN, 0.75, Double.NaN)

            assertPointsEqual(expected, actual)
        }

        it("should calculate right swipe with given start X") {
            val from = Pair(0.25, 0.5)
            val to = Pair(0.75 + EDGE_FUZZ_FACTOR, 0.5)
            val expected = Pair(from, to)
            val actual = SwipeHelper.calculateSwipe(MOTION_DIR_RIGHT, Double.NaN, 0.25, Double.NaN)

            assertPointsEqual(expected, actual)
        }

        it("should calculate top swipe with given start X, Y and offset") {
            val from = Pair(0.75, 0.75)
            val to = Pair(0.75, 0.5)
            val expected = Pair(from, to)
            val actual = SwipeHelper.calculateSwipe(MOTION_DIR_UP, 0.25, 0.75, 0.75)

            assertPointsEqual(expected, actual)
        }

        it("should calculate bottom with given start X, Y and offset") {
            val from = Pair(0.75, 0.25)
            val to = Pair(0.75, 0.5)
            val expected = Pair(from, to)
            val actual = SwipeHelper.calculateSwipe(MOTION_DIR_DOWN, 0.25, 0.75, 0.25)

            assertPointsEqual(expected, actual)
        }

        it("should calculate left with given start X, Y and offset") {
            val from = Pair(0.75, 0.75)
            val to = Pair(0.5, 0.75)
            val expected = Pair(from, to)
            val actual = SwipeHelper.calculateSwipe(MOTION_DIR_LEFT, 0.25, 0.75, 0.75)

            assertPointsEqual(expected, actual)
        }

        it("should calculate right with given start X, Y and offset") {
            val from = Pair(0.25, 0.75)
            val to = Pair(0.5, 0.75)
            val expected = Pair(from, to)
            val actual = SwipeHelper.calculateSwipe(MOTION_DIR_RIGHT, 0.25, 0.25, 0.75)

            assertPointsEqual(expected, actual)
        }
    }
})
