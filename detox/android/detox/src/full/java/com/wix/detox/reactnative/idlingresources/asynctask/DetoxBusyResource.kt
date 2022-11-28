package com.wix.detox.reactnative.idlingresources.asynctask

class DetoxBusyResource(var name: String, var reason: String) {
    override fun toString(): String {
        return "DetoxBusyResource(name='$name', reason='$reason')"
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as DetoxBusyResource

        if (name != other.name) return false
        if (reason != other.reason) return false

        return true
    }

    override fun hashCode(): Int {
        var result = name.hashCode()
        result = 31 * result + reason.hashCode()
        return result
    }
}