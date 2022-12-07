package com.wix.detox.inquiry

import org.assertj.core.api.Assertions
import org.spekframework.spek2.Spek
import org.spekframework.spek2.style.specification.describe

class DetoxBusyResourceDescriptionSpec: Spek({
    describe("Idling Resource Description Builder") {
        lateinit var description: DetoxBusyResourceDescription
        lateinit var expectedJSON: Map<String, Any>

        it("should build with given description") {
            description = DetoxBusyResourceDescription.Builder()
                .name("foo")
                .addDescription("bar", "baz")
                .addDescription("qux", "quux")
                .build()

            expectedJSON = mapOf(
                "name" to "foo",
                "description" to mapOf("bar" to "baz", "qux" to "quux")
            )
            Assertions.assertThat(description.json()).isEqualTo(expectedJSON)
        }

        it("should build without description") {
            description = DetoxBusyResourceDescription.Builder().name("foo").build()

            expectedJSON = mapOf("name" to "foo")
            Assertions.assertThat(description.json()).isEqualTo(expectedJSON)
        }

        it("should build without name") {
            description = DetoxBusyResourceDescription.Builder()
                .addDescription("bar", "baz")
                .addDescription("qux", "quux")
                .build()

            expectedJSON = mapOf(
                "name" to "unknown",
                "description" to mapOf("bar" to "baz", "qux" to "quux")
            )
            Assertions.assertThat(description.json()).isEqualTo(expectedJSON)
        }
    }
})
