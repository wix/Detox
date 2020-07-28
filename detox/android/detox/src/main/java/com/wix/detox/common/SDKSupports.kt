package com.wix.detox.common

import android.os.Build

object SDKSupports {
    val API_19_KITKAT = (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT)
}
