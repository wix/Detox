package com.wix.detox.common

import java.io.File

internal class TextFileReader(private val fileName: String) {
    fun read() = File(fileName).readText(Charsets.UTF_8)
}
