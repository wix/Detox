/**
 * `detox.DetoxConstants` — ported byte-for-byte from Detox 20's
 * `src/realms/DetoxConstants.js`. Pure data: the string identifiers the
 * frozen native side already matches on, so these values are not ours to
 * choose. `18.user-activities` reads all three groups
 * (`require('detox').DetoxConstants`).
 */
export const DetoxConstants = Object.freeze({
  userNotificationTriggers: Object.freeze({
    push: 'push',
    calendar: 'calendar',
    timeInterval: 'timeInterval',
    location: 'location',
  }),
  userActivityTypes: Object.freeze({
    searchableItem: 'com.apple.corespotlightitem',
    browsingWeb: 'NSUserActivityTypeBrowsingWeb',
  }),
  searchableItemActivityIdentifier: 'kCSSearchableItemActivityIdentifier',
});
