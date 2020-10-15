package com.wix.detox.common.collect

import org.assertj.core.api.Assertions.assertThat
import org.spekframework.spek2.Spek
import org.spekframework.spek2.style.specification.describe
import java.lang.Exception
import kotlin.test.assertFailsWith

object PairsIteratorSpec: Spek({
    describe("Pairs iterator") {
        it("should be sane about empty lists") {
            val uut = PairsIterator(emptyList<Any>())
            assertThat(uut.hasNext()).isFalse()

            assertFailsWith(Exception::class) {
                assertThat(uut.next())
            }
        }

        it("should be sane about 2-item lists") {
            val uut = PairsIterator(listOf("first", "second"))
            assertThat(uut.hasNext()).isTrue()
            assertThat(uut.next()).isEqualTo(Pair("first", "second"))
        }

        it("should throw if iterating onto an uneven size") {
            val uut = PairsIterator(listOf("first", "second", "third"))
            uut.next()

            assertThat(uut.hasNext()).isTrue()
            assertFailsWith(IllegalStateException::class) {
                uut.next()
            }
        }

        it("should init using an explicit iterator") {
            val uut = PairsIterator(emptyList<Any>().iterator())
            assertThat(uut.hasNext()).isFalse()
        }
    }
})
