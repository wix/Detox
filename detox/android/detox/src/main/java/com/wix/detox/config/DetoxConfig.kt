package com.wix.detox.config

class DetoxConfig {
    var idlePolicyConfig: DetoxIdlePolicyConfig? = DetoxIdlePolicyConfig()
    var rnContextLoadTimeoutSec = 60

    fun apply() {
        idlePolicyConfig?.apply()
    }

    companion object {
        lateinit var CONFIG: DetoxConfig
    }
}
