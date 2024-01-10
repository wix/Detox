package com.wix.detox.espresso.matcher

import org.junit.Test
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class RegexMatcherTest {
    @Test
    fun `should work with string matching regex`() {
        val input = "Hello, world!"
        val regex = "/[A-Z][a-z]+, world!/"
        assertTrue(input.matchesJSRegex(regex))
    }

    @Test
    fun `should work with string not matching regex`() {
        val input = "Hello, world!"
        val regex = "/[A-Z]+, world!/"
        assertFalse(input.matchesJSRegex(regex))
    }

    @Test
    fun `should work with the 'i' flag`() {
        val input = "Hello, world!"
        val regex = "/[A-Z]+, woRlD!/i"
        assertTrue(input.matchesJSRegex(regex))
    }

    @Test
    fun `should work with the 's' flag`() {
        val input = "Hello,\nworld!"
        val regex = "/Hello,\\sworld!/s"
        assertTrue(input.matchesJSRegex(regex))
    }

    @Test
    fun `should work with the 'm' flag`() {
        val input = "Hello,\nworld!"
        val regex = "/^Hello,\\s.*!$/m"
        assertTrue(input.matchesJSRegex(regex))
    }

    @Test
    fun `should work with multiple flags, ignore casing`() {
        val input = "Hello,\nworld!"
        val regex = "/^heLLo,\\swOrld!/ISM"
        assertTrue(input.matchesJSRegex(regex))
    }
}
