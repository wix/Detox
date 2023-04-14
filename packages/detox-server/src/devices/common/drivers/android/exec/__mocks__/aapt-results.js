const dumpBadingResult = `package: name='com.wix.detox.test' versionCode='1' versionName='1.0' platformBuildVersionName='7.1.1'
sdkVersion:'18'
targetSdkVersion:'25'
uses-permission: name='android.permission.INTERNET'
uses-permission: name='android.permission.SYSTEM_ALERT_WINDOW'
uses-permission: name='android.permission.WRITE_EXTERNAL_STORAGE'
uses-permission: name='android.permission.READ_PHONE_STATE'
uses-permission: name='android.permission.READ_EXTERNAL_STORAGE'
application-label:'Detox Test'
application-label-ca:'Detox Test'
application-label-da:'Detox Test'
application-label-fa:'Detox Test'
application-label-ja:'Detox Test'
application-label-nb:'Detox Test'
application-label-de:'Detox Test'
application-label-af:'Detox Test'
application-label-bg:'Detox Test'
application-label-th:'Detox Test'
application-label-fi:'Detox Test'
application-label-hi:'Detox Test'
application-label-vi:'Detox Test'
application-label-sk:'Detox Test'
application-label-uk:'Detox Test'
application-label-el:'Detox Test'
application-label-nl:'Detox Test'
application-icon-160:'res/mipmap-mdpi-v4/ic_launcher.png'
application-icon-240:'res/mipmap-hdpi-v4/ic_launcher.png'
application-icon-320:'res/mipmap-xhdpi-v4/ic_launcher.png'
application-icon-480:'res/mipmap-xxhdpi-v4/ic_launcher.png'
application-icon-640:'res/mipmap-xxhdpi-v4/ic_launcher.png'
application: label='Detox Test' icon='res/mipmap-mdpi-v4/ic_launcher.png'
launchable-activity: name='com.example.MainActivity'  label='Detox Test' icon=''
feature-group: label=''
  uses-feature: name='android.hardware.touchscreen'
  uses-implied-feature: name='android.hardware.touchscreen' reason='default feature for all apps'
main
other-activities
supports-screens: 'small' 'normal' 'large' 'xlarge'
supports-any-density: 'true'
locales: '--_--' 'ca' 'da' 'fa' 'ja' 'nb' 'de' 'af' 'bg' 'th' 'fi' 'hi' 'vi' 'sk' 'uk' 'el' 'nl' 'pl' 'sl' 'tl' 'am' 'in' 'ko' 'ro' 'ar' 'fr' 'hr' 'sr' 'sr-Latn' 'tr' 'cs' 'es' 'it' 'lt' 'pt' 'hu' 'ru' 'zu' 'lv' 'sv' 'iw' 'sw' 'bs-BA' 'fr-CA' 'lo-LA' 'en-GB' 'bn-BD' 'et-EE' 'ka-GE' 'ky-KG' 'km-KH' 'zh-HK' 'si-LK' 'mk-MK' 'ur-PK' 'sq-AL' 'hy-AM' 'my-MM' 'zh-CN' 'pa-IN' 'ta-IN' 'te-IN' 'ml-IN' 'en-IN' 'kn-IN' 'mr-IN' 'gu-IN' 'mn-MN' 'ne-NP' 'pt-BR' 'gl-ES' 'eu-ES' 'is-IS' 'es-US' 'pt-PT' 'en-AU' 'zh-TW' 'be-BY' 'ms-MY' 'az-AZ' 'kk-KZ' 'uz-UZ'
densities: '160' '240' '320' '480' '640'
native-code: 'armeabi-v7a' 'x86'`;

const dumpXmlStringsResultTestAPK = `String pool of 59 unique UTF-16 non-sorted strings, 59 entries and 0 styles using 3144 bytes:
String #0: theme
String #1: label
String #2: name
String #46: instrumentation
String #57: uses-permission
String #58: uses-sdk`;

const dumpXmlStringResultProdAPK = `String pool of 59 unique UTF-16 non-sorted strings, 59 entries and 0 styles using 3144 bytes:
String #0: theme
String #1: label
String #2: name
String #57: uses-permission
String #58: uses-sdk`;

module.exports = {
  dumpBadging: dumpBadingResult,
  dumpXmlStrings: {
    prodApk: dumpXmlStringResultProdAPK,
    testApk: dumpXmlStringsResultTestAPK,
  },
};
