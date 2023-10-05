package com.wix.detox.inquiry

class DetoxBusyResourceDescription private constructor(
    private val name: String,
    private val description: Map<String, Any>) {

    fun json(): Map<String, Any> =
        mutableMapOf<String, Any>("name" to name)
          .apply {
            if (description.isNotEmpty()) put("description", description)
          }

    override fun equals(other: Any?) =
      (other is DetoxBusyResourceDescription && other.json() == this.json())

    override fun hashCode(): Int =
      (31 * name.hashCode() + description.hashCode())

    data class Builder(
        var name: String = "unknown",
        var description: MutableMap<String, Any> = mutableMapOf()) {
            fun name(value: String) = apply { name = value }
            fun addDescription(key: String, value: Any) = apply { description[key] = value }
            fun build() = DetoxBusyResourceDescription(name, description)
      }
}
