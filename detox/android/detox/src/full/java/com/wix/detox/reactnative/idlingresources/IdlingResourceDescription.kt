package com.wix.detox.reactnative.idlingresources

class IdlingResourceDescription private constructor(
  private val name: String,
  private val description: Map<String, Any>) {
    fun json(): Map<String, Any> = mutableMapOf<String, Any>("name" to name)
      .apply { if (description.isNotEmpty()) put("description", description) }

    override fun equals(other: Any?): Boolean = other is IdlingResourceDescription &&
        other.json() == this.json()

    data class Builder(
      var name: String = "unknown",
      var description: MutableMap<String, Any> = mutableMapOf()) {

        fun name(name: String) = apply { this.name = name }
        fun addDescription(key: String, value: Any) = apply { this.description[key] = value }
        fun build() = IdlingResourceDescription(name, description)
    }
}
