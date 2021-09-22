const DEVICE_LAUNCH_ARGS_DEPRECATION = `\
--device-launch-args is a deprecated name of this option.
Please change your scripts to use --device-boot-args instead.`;

const DEVICE_LAUNCH_ARGS_GENERIC_DEPRECATION = `\
--device-launch-args / $DETOX_DEVICE_LAUNCH_ARGS is a deprecated name of this option.
Please change your scripts to use --device-boot-args / $DETOX_DEVICE_BOOT_ARGS instead.`;

module.exports = {
  DEVICE_LAUNCH_ARGS_DEPRECATION,
  DEVICE_LAUNCH_ARGS_GENERIC_DEPRECATION,
};
