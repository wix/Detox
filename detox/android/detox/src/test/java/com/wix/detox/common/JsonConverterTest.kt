package com.wix.detox.common

import org.assertj.core.api.Assertions.assertThat
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.lang.IllegalArgumentException
import kotlin.test.assertFailsWith

@RunWith(RobolectricTestRunner::class)
class JsonConverterTest {

    @Test
    fun `should convert an empty json to an empty bundle`() {
        val uut = JsonConverter(JSONObject())
        assertThat(uut.toBundle().isEmpty).isTrue()
    }

    @Test
    fun `should convert a boolean`() {
        val json = aJsonWithAFlag()

        val uut = JsonConverter(json)
        assertThat(uut.toBundle().getBoolean("flag")).isEqualTo(true)
    }

    @Test
    fun `should convert a string`() {
        val json = aJsonWithAString()
        val uut = JsonConverter(json)
        assertThat(uut.toBundle().getString("test")).isEqualTo("mock")
    }

    @Test
    fun `should convert an integer`() {
        val json = aJsonWithAnInt()
        val uut = JsonConverter(json)
        assertThat(uut.toBundle().getInt("integer")).isEqualTo(1234)
    }

    @Test
    fun `should convert a long-int`() {
        val json = aJsonWithALongInt()
        val uut = JsonConverter(json)
        assertThat(uut.toBundle().getLong("longint")).isEqualTo(1234L)
    }

    @Test
    fun `should convert a double`() {
        val json = aJsonWithADouble()
        val uut = JsonConverter(json)
        assertThat(uut.toBundle().getDouble("double")).isEqualTo(1234.56)
    }

    @Test
    fun `should convert a complete child-object`() {
        val json = aJsonWithAChildObject()
        val uut = JsonConverter(json)

        val subBundle = uut.toBundle().getBundle("obj")
        assertThat(subBundle).isNotNull()

        subBundle!!
        assertThat(subBundle.get("test")).isEqualTo("777")
        assertThat(subBundle.get("double")).isEqualTo(1234.56)
        assertThat(subBundle.get("longint")).isEqualTo(2_222_222_222L)
    }

    @Test
    fun `should convert a strings array`() {
        val json = aJsonWithAStringsArray()
        val uut = JsonConverter(json)

        val array = uut.toBundle().getStringArrayList("arr")
        assertThat(array).isNotNull()

        array!!
        assertThat(array).isEqualTo(arrayListOf("rock", "paper", "scissors"))
    }

    @Test
    fun `should convert a primitives array`() {
        val json = aJsonWithPrimitiveArray()
        val uut = JsonConverter(json)

        val array = uut.toBundle().getStringArrayList("arr")
        assertThat(array).isNotNull()

        array!!
        assertThat(array).isEqualTo(arrayListOf("1234", "12.34", "1234", "true"))
    }

    @Test
    fun `should fail to convert a complex array`() {
        val json = aJsonWithComplexArray()
        val uut = JsonConverter(json)

        assertFailsWith<IllegalArgumentException> {
            uut.toBundle()
        }
    }
}

private fun aJsonWithAFlag() = JSONObject().put("flag", true)
private fun aJsonWithAString() = JSONObject().put("test", "mock")
private fun aJsonWithAnInt() = JSONObject().put("integer", 1234)
private fun aJsonWithALongInt() = JSONObject().put("longint", 1234L)
private fun aJsonWithADouble() = JSONObject().put("double", 1234.56)
private fun aJsonWithAChildObject(): JSONObject {
    val child = JSONObject("""{
        "flag": true,
        "test": "777",
        "integer": 1234,
        "longint": 2222222222,
        "double": 1234.56
    }""".trimIndent())
    return JSONObject().put("obj", child)
}
private fun aJsonWithAStringsArray() = JSONObject().apply {
    val array = JSONArray("""[
        "rock", "paper", "scissors"
    ]""".trimIndent())
    put("arr", array)
}
private fun aJsonWithPrimitiveArray() = JSONObject().apply {
    val array = JSONArray("""[
        1234, 12.34, "1234", true
    ]""".trimIndent())
    put("arr", array)
}
private fun aJsonWithComplexArray() = JSONObject().apply {
    val array = JSONArray("""[ 
        1234, { "sub": "obj" }
    ]""".trimIndent())
    put("arr", array)
}
