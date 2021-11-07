const Ajv = require('ajv');

const DetoxRuntimeError = require('../../errors/DetoxRuntimeError');

class SyncStatusFormatter {
  static formatJSONStatus(jsonStatus) {
    if (!SyncStatusFormatter.isValidJSONStatus(jsonStatus)) {
      throw new DetoxRuntimeError(`Given sync status is not compatible with the status schema, ` +
        `given status: ${JSON.stringify(jsonStatus)}`);
    }

    if (SyncStatusFormatter.isAppIdle(jsonStatus)) {
      return 'The app seems to be idle';
    }

    if (jsonStatus.busy_resources === undefined) {
      throw new DetoxRuntimeError(`Given sync status is invalid, app is busy but busy-resources are not defined`);
    }
    const resourcesDescriptions = SyncStatusFormatter.resourcesDescriptionsFromJSON(jsonStatus.busy_resources);
    return `The app is busy with the following tasks:\n${resourcesDescriptions.join('\n')}`;
  }

  static isValidJSONStatus(jsonStatus) {
    const ajv = new Ajv();
    const isValidStatus = ajv.compile(SyncStatusFormatter.jsonStatusSchema());
    return isValidStatus(jsonStatus);
  }

  static jsonStatusSchema() {
    return {
      type: 'object',
      properties: {
        app_status: { 'enum': ['busy', 'idle'] },
        busy_resources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { 'type': 'string' },
              description: {
                type: 'object',
                additionalProperties: true
              }
            },
            required: ['name'],
            additionalProperties: false
          }
        }
      },
      required: ['app_status'],
      additionalProperties: false
    };
  }

  static isAppIdle(jsonStatus) {
    return jsonStatus.app_status === 'idle' ||
      (jsonStatus.busy_resources !== undefined && !jsonStatus.busy_resources.length);
  }

  static resourcesDescriptionsFromJSON(jsonDescriptions) {
    let descriptions = [];
    for (const jsonDescription of jsonDescriptions) {
      const description = SyncStatusFormatter.resourceDescriptionFromJSON(jsonDescription);
      descriptions.push(description);
    }

    return descriptions;
  }

  static resourceDescriptionFromJSON(jsonDescription) {
    const resourceName = jsonDescription.name;
    const properties = jsonDescription.description;

    switch (resourceName) {
      case 'delayed_perform_selector':
        return SyncStatusFormatter.delayedPerformSelectorResourceDescriptionFromProperties(properties);

      case 'dispatch_queue':
        return SyncStatusFormatter.dispatchQueueResourceDescriptionFromProperties(properties);

      case 'run_loop':
        return SyncStatusFormatter.runLoopResourceDescriptionFromProperties(properties);

      case 'one_time_events':
        return SyncStatusFormatter.oneTimeEventDescriptionFromProperties(properties);

      case 'timers':
        return SyncStatusFormatter.timersResourceDescriptionFromProperties(properties);

      case 'ui':
        return SyncStatusFormatter.uiResourceDescriptionFromProperties(properties);

      case 'js_timers':
        return SyncStatusFormatter.jsTimersResourceDescriptionFromProperties(properties);

      case 'network':
        return SyncStatusFormatter.networkResourceDescriptionFromProperties(properties);

      case 'looper':
        return SyncStatusFormatter.looperResourceDescriptionFromProperties(properties);

      case 'io':
        return SyncStatusFormatter.resourceTitle(`Disk I/O activity.`);

      case 'unknown':
        return SyncStatusFormatter.unknownResourceDescriptionFromProperties(properties);

      default:
        throw new DetoxRuntimeError(`Given sync status is invalid, cannot find resource name: \`${resourceName}\``);
    }
  }

  static delayedPerformSelectorResourceDescriptionFromProperties(properties) {
    const pendingSelectors = SyncStatusFormatter.getPropertyFromObject('pending_selectors', properties);
    return SyncStatusFormatter.resourceTitle(`There are ${pendingSelectors} pending delayed selectors to be ` +
      `performed.`);
  }

  static getPropertyFromObject(propertyName, object) {
    const property = object[propertyName];
    if (property === undefined) {
      throw new DetoxRuntimeError(`Given sync status is invalid. Cannot find \`${propertyName}\` property for ` +
        `resource description`);
    }

    return property;
  }

  static resourceTitle(string) {
    return `• ${string}`;
  }

  static dispatchQueueResourceDescriptionFromProperties(properties) {
    const workItemsCount = SyncStatusFormatter.getPropertyFromObject('works_count', properties);
    const queue = SyncStatusFormatter.getPropertyFromObject('queue', properties);
    return SyncStatusFormatter.resourceTitle(`There are ${workItemsCount} work items pending on the ` +
      `dispatch queue: "${queue}".`);
  }

  static runLoopResourceDescriptionFromProperties(properties) {
    const runLoopName = SyncStatusFormatter.getPropertyFromObject('name', properties);
    return SyncStatusFormatter.resourceTitle(`Run loop "${runLoopName}" is awake.`);
  }

  static oneTimeEventDescriptionFromProperties(properties) {
    const eventName = SyncStatusFormatter.getPropertyFromObject('event', properties);
    const objectName = properties['object'];

    return SyncStatusFormatter.resourceTitle(`The event "${eventName}" is taking place` +
      `${(objectName === null) ? `.` : ` with object: "${objectName}".`}`);
  }

  static timersResourceDescriptionFromProperties(properties) {
    if (properties === undefined) {
      return SyncStatusFormatter.resourceTitle(`There are enqueued timers.`);
    }

    const timers = SyncStatusFormatter.getPropertyFromObject('timers', properties);

    let timerCount = 0;
    let timersDescriptions = [];
    for (const timer of timers) {
      timerCount++;
      timersDescriptions.push(SyncStatusFormatter.timerDescriptionFromTimer(timer, timerCount));
    }

    return `${SyncStatusFormatter.resourceTitle(`${timerCount} enqueued native timers:`)}` +
      `\n${timersDescriptions.join('\n')}`;
  }

  static timerDescriptionFromTimer(timer, timerCount) {
    const fireDate = SyncStatusFormatter.getPropertyFromObject('fire_date', timer);
    const timeUntilFire = SyncStatusFormatter.getPropertyFromObject('time_until_fire', timer);
    const repeatInterval = SyncStatusFormatter.getPropertyFromObject('repeat_interval', timer);
    const isRecurring = SyncStatusFormatter.getPropertyFromObject('is_recurring', timer);
    return `${SyncStatusFormatter.resourceSubTitle(`Timer #${timerCount}:`)}\n` +
      `${SyncStatusFormatter.resourceSubSubTitle(`Fire date: ${fireDate}`)}.\n` +
      `${SyncStatusFormatter.resourceSubSubTitle(`Time until fire: ${timeUntilFire.toFixed(3)}`)}.\n` +
      `${SyncStatusFormatter.resourceSubSubTitle(`Repeat interval: ${repeatInterval}`)}.\n` +
      `${SyncStatusFormatter.resourceSubSubTitle(`Is recurring: ${isRecurring === true ? `YES` : `NO`}`)}.`;
  }

  static resourceSubTitle(string) {
    return `  - ${string}`;
  }

  static resourceSubSubTitle(string) {
    return `    + ${string}`;
  }

  static uiResourceDescriptionFromProperties(properties) {
    let countersDescriptions = [];
    for (const [key, value] of Object.entries(properties)) {
      const counterName = SyncStatusFormatter.uiResourceCounterNameMapping()[key];
      if (counterName === undefined) {
        throw new DetoxRuntimeError(`Given sync status is invalid. Cannot find \`${key}\` property for UI ` +
          `resource description`);
      }

      countersDescriptions.push(SyncStatusFormatter.resourceSubTitle(`${counterName}: ${value}`));
    }

    return `${SyncStatusFormatter.resourceTitle(`UI elements are busy:`)}\n${countersDescriptions.join('.\n')}.`;
  }

  static uiResourceCounterNameMapping() {
    return {
      'layer_animation_pending_count':  `Layer animations pending`,
      'layer_needs_display_count': `Layers needs display`,
      'layer_needs_layout_count': `Layers needs layout`,
      'layer_pending_animation_count': `Layers pending animations`,
      'view_animation_pending_count': `View animations pending`,
      'view_controller_will_appear_count': `View controllers will appear`,
      'view_controller_will_disappear_count': `View controllers will disappear`,
      'view_needs_display_count': `View needs display`,
      'view_needs_layout_count': `View needs layout`,
      'reason': `Reason`
    };
  }

  static jsTimersResourceDescriptionFromProperties(properties) {
    const timers = SyncStatusFormatter.getPropertyFromObject('timers', properties);

    let timerCount = 0;
    let timersDescriptions = [];
    for (const timer of timers) {
      timerCount++;
      timersDescriptions.push(SyncStatusFormatter.jsTimerDescriptionFromTimer(timer, timerCount));
    }

    return `${SyncStatusFormatter.resourceTitle(`${timerCount} enqueued JavaScript timers:`)}` +
      `\n${timersDescriptions.join('\n')}`;
  }

  static jsTimerDescriptionFromTimer(timer, timerCount) {
    const timerID = SyncStatusFormatter.getPropertyFromObject('timer_id', timer);
    const duration = SyncStatusFormatter.getPropertyFromObject('duration', timer);
    const isRecurring = SyncStatusFormatter.getPropertyFromObject('is_recurring', timer);
    return `${SyncStatusFormatter.resourceSubTitle(`Timer #${timerCount}:`)}\n` +
      `${SyncStatusFormatter.resourceSubSubTitle(`JS timer ID: ${timerID}`)}.\n` +
      `${SyncStatusFormatter.resourceSubSubTitle(`Duration: ${duration}`)}.\n` +
      `${SyncStatusFormatter.resourceSubSubTitle(`Is recurring: ${isRecurring === true ? `YES` : `NO`}`)}.`;
  }

  static networkResourceDescriptionFromProperties(properties) {
    const urls = SyncStatusFormatter.getPropertyFromObject('urls', properties);

    let urlCount = 0;
    let urlsDescriptions = [];
    for (const url of urls) {
      urlCount++;
      urlsDescriptions.push(SyncStatusFormatter.urlDescriptionFromURL(url, urlCount));
    }

    return `${SyncStatusFormatter.resourceTitle(`${urlCount} network requests with URLs:`)}` +
      `\n${urlsDescriptions.join('\n')}`;
  }

  static urlDescriptionFromURL(url, urlCount) {
    return SyncStatusFormatter.resourceSubTitle(`URL #${urlCount}: ${url}.`);
  }

  static looperResourceDescriptionFromProperties(properties) {
    const thread = SyncStatusFormatter.getPropertyFromObject('thread', properties);
    const executionType = properties['execution_type'];

    return SyncStatusFormatter.resourceTitle(`${thread} is executing` +
      `${executionType !== undefined ? ` (${executionType}).` : `.`}`);
  }

  static unknownResourceDescriptionFromProperties(properties) {
    const identifier = SyncStatusFormatter.getPropertyFromObject('identifier', properties);
    return SyncStatusFormatter.resourceTitle(`Resource "${identifier}" is busy.`);
  }
}

module.exports = SyncStatusFormatter;
