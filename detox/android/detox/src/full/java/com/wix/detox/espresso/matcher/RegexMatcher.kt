package com.wix.detox.espresso.matcher

// Returns whether the whole string matches the given `jsRegex`.
// JS flags has the format of `/<pattern>/<flags>`.
// Flags can be either:
// - i: With this flag the search is case-insensitive: no difference between A and a (see the example below).
// - s: Enables “dotall” mode, that allows a dot . to match newline character \n (covered in the chapter Character classes).
// - m: Multiline mode (covered in the chapter Multiline mode of anchors ^ $, flag "m").
// Other flags (e.g. g,u,s) are not supported as they do not have equivalents in Kotlin.
//
// - See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
fun String.isMatch(jsRegex: String): Boolean {
    val flagsChars = getRegexFlags(jsRegex)
    val options = getRegexOptions(flagsChars)
    val pattern = getRegexPattern(jsRegex)
    return Regex(pattern, options).matches(this)
}

fun getRegexFlags(jsRegex: String): CharSequence {
    return jsRegex.substringAfterLast("/")
}

fun getRegexPattern(jsRegex: String): String {
    val pattern = jsRegex.substringAfter("/")
    return pattern.substringBeforeLast("/")
}

fun getRegexOptions(flagsChars: CharSequence): MutableSet<RegexOption> {
    val options = mutableSetOf<RegexOption>()

    if (flagsChars.contains('i', ignoreCase = true)) {
        options.add(RegexOption.IGNORE_CASE)
    }
    if (flagsChars.contains('s', ignoreCase = true)) {
        options.add(RegexOption.DOT_MATCHES_ALL)
    }
    if (flagsChars.contains('m', ignoreCase = true)) {
        options.add(RegexOption.MULTILINE)
    }

    return options
}
