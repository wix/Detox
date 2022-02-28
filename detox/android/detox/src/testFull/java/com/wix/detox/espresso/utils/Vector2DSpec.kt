package com.wix.detox.espresso.utils

import com.wix.detox.action.common.MOTION_DIR_DOWN
import com.wix.detox.action.common.MOTION_DIR_LEFT
import com.wix.detox.action.common.MOTION_DIR_RIGHT
import com.wix.detox.action.common.MOTION_DIR_UP
import org.spekframework.spek2.Spek
import org.spekframework.spek2.style.specification.describe
import kotlin.test.assertEquals

object Vector2DSpec: Spek({
    describe("Vector2DSpec") {
        it("should have x, y coordinates") {
            val vector = Vector2D(3.0, 4.0)
            assertEquals(Pair(3.0, 4.0), Pair(vector.x, vector.y))
        }

        it("should be comparable to each other") {
            val vector1 = Vector2D(3.0, 4.0)
            val vector2 = Vector2D(3.0, 4.0)
            assertEquals(vector1, vector2)
        }

        it("should be rotatable clockwise") {
            val vector = Vector2D(3.0, 4.0)

            assertEquals(Vector2D(4.0, -3.0), vector.rotate(MOTION_DIR_UP, MOTION_DIR_RIGHT))
            assertEquals(Vector2D(-3.0, -4.0), vector.rotate(MOTION_DIR_UP, MOTION_DIR_DOWN))
            assertEquals(Vector2D(-4.0, 3.0), vector.rotate(MOTION_DIR_UP, MOTION_DIR_LEFT))
            assertEquals(vector, vector.rotate(MOTION_DIR_UP, MOTION_DIR_UP))
        }

        it("should be have equivalent rotations clockwise") {
            val vector = Vector2D(3.0, 4.0)

            assertEquals(vector.rotate(MOTION_DIR_UP, MOTION_DIR_RIGHT), vector.rotate(MOTION_DIR_RIGHT, MOTION_DIR_DOWN))
            assertEquals(vector.rotate(MOTION_DIR_RIGHT, MOTION_DIR_DOWN), vector.rotate(MOTION_DIR_DOWN, MOTION_DIR_LEFT))
            assertEquals(vector.rotate(MOTION_DIR_DOWN, MOTION_DIR_LEFT), vector.rotate(MOTION_DIR_LEFT, MOTION_DIR_UP))
            assertEquals(vector.rotate(MOTION_DIR_LEFT, MOTION_DIR_UP), vector.rotate(MOTION_DIR_UP, MOTION_DIR_RIGHT));
        }

        it("should be have equivalent rotations counter-clockwise") {
            val vector = Vector2D(3.0, 4.0)

            assertEquals(vector.rotate(MOTION_DIR_UP, MOTION_DIR_LEFT), vector.rotate(MOTION_DIR_LEFT, MOTION_DIR_DOWN))
            assertEquals(vector.rotate(MOTION_DIR_LEFT, MOTION_DIR_DOWN), vector.rotate(MOTION_DIR_DOWN, MOTION_DIR_RIGHT))
            assertEquals(vector.rotate(MOTION_DIR_DOWN, MOTION_DIR_RIGHT), vector.rotate(MOTION_DIR_RIGHT, MOTION_DIR_UP))
            assertEquals(vector.rotate(MOTION_DIR_RIGHT, MOTION_DIR_UP), vector.rotate(MOTION_DIR_UP, MOTION_DIR_LEFT));
        }

        it("should be normalizable") {
            assertEquals(Vector2D(0.5, 0.25), Vector2D(0.5, 0.25).normalize())
            assertEquals(Vector2D(0.25, 0.5), Vector2D(1.25, 0.5).normalize())
            assertEquals(Vector2D(0.0, 0.0), Vector2D(3.0, 4.0).normalize())
            assertEquals(Vector2D(0.75, 0.25), Vector2D(-3.25, -4.75).normalize())
        }

        it("should be trimmable by max value") {
            assertEquals(Vector2D(1.0, 1.0), Vector2D(1.0, 1.0).trimMax(0.0, 0.0))
            assertEquals(Vector2D(100.0, 1.0), Vector2D(1.0, 1.0).trimMax(100.0, 0.0))
            assertEquals(Vector2D(1.0, 100.0), Vector2D(1.0, 1.0).trimMax(0.0, 100.0))
            assertEquals(Vector2D(0.0, 0.0), Vector2D(-1000.0, -3000.0).trimMax(0.0, 0.0))
            assertEquals(Vector2D(-1000.0, -3000.0).trimMax(0.0, 0.0), Vector2D(-1000.0, -3000.0).trimMax(0.0))
        }

        it("should be scalable by amount") {
            assertEquals(Vector2D(4.0, 6.0), Vector2D(2.0, 2.0).scale(2.0, 3.0))
            assertEquals(Vector2D(1.0, 1.0), Vector2D(2.0, 2.0).scale(0.5))
        }

        it("should be scalable by amount vector") {
            val factor = Vector2D(0.0, -1.0)
            assertEquals(Vector2D(0.0, -2.0), Vector2D(2.0, 2.0).scale(factor))
        }

        it("should be X/Y settable") {
            assertEquals(Vector2D(4.0, 2.0), Vector2D(2.0, 2.0).withX(4.0))
            assertEquals(Vector2D(2.0, 4.0), Vector2D(2.0, 2.0).withY(4.0))
        }

        it("should be addable") {
            val vector1 = Vector2D(1.0, 1.0)
            val vector2 = Vector2D(2.0, -4.0)

            assertEquals(Vector2D(3.0, -3.0), vector1.add(vector2))
        }

        it("should be creatable from FloatArray") {
            assertEquals(Vector2D(0.0, 1.0), Vector2D.from(FloatArray(2) { i -> i.toFloat() }))
        }

        it("should be creatable from x: Int, y: Int") {
            assertEquals(Vector2D(1.0, 1.0), Vector2D.from(1, 1))
        }
    }
})
