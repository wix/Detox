package com.wix.detox.config

class DetoxConfig {
    @JvmField var idlePolicyConfig: DetoxIdlePolicyConfig = DetoxIdlePolicyConfig()
    @JvmField var rnContextLoadTimeoutSec = 60

    fun apply() {
        idlePolicyConfig.apply()
    }

    companion object {
        lateinit var CONFIG: DetoxConfig
    }
}
