const Ajv = require('ajv');

const DetoxInternalError = require('../../errors/DetoxInternalError');
const statusSchema = require('../actions/SyncStatusSchema.json');


const ajv = new Ajv();
const isValidJSONStatus = ajv.compile(statusSchema);

function formatJSONStatus(jsonStatus) {
  if (!isValidJSONStatus(jsonStatus)) {
    const errorMessages = isValidJSONStatus.errors.map(
      error => `• ${error.message} in path "${error.schemaPath}" with params: ${JSON.stringify(error.params)}`
    );
    throw new DetoxInternalError(`Given sync status is not compatible with the status schema (\`SyncStatusSchema.js\`), ` +
      `given status: ${JSON.stringify(jsonStatus)}.\nWith reasons:\n${errorMessages.join('\n')}\n`);
  }

  if (isAppIdle(jsonStatus)) {
    return 'The app seems to be idle';
  }

  const resourcesDescriptions = resourcesDescriptionsFromJSON(jsonStatus.busy_resources);
  return `The app is busy with the following tasks:\n${resourcesDescriptions.join('\n')}`;
}

function isAppIdle(jsonStatus) {
  return jsonStatus.app_status === 'idle';
}

function resourcesDescriptionsFromJSON(jsonDescriptions) {
  let descriptions = [];
  for (const jsonDescription of jsonDescriptions) {
    const description = resourceDescriptionFromJSON(jsonDescription);
    descriptions.push(description);
  }

  return descriptions;
}

const resourceFormatters = {
  delayed_perform_selector: delayedPerformSelectorResourceDescriptionFromProperties,
  dispatch_queue: dispatchQueueResourceDescriptionFromProperties,
  run_loop: runLoopResourceDescriptionFromProperties,
  one_time_events: oneTimeEventDescriptionFromProperties,
  timers: timersResourceDescriptionFromProperties,
  ui: uiResourceDescriptionFromProperties,
  js_timers: jsTimersResourceDescriptionFromProperties,
  network: networkResourceDescriptionFromProperties,
  looper: looperResourceDescriptionFromProperties,
  io: () => { return resourceTitle(`Disk I/O activity.`); },
  unknown: unknownResourceDescriptionFromProperties,
};

function resourceDescriptionFromJSON(jsonDescription) {
  const resourceName = jsonDescription.name;
  const formatter = resourceFormatters[resourceName];
  const properties = jsonDescription.description;
  return formatter(properties);
}

function delayedPerformSelectorResourceDescriptionFromProperties(properties) {
  return resourceTitle(`There are ${properties.pending_selectors} pending delayed selectors to be ` +
    `performed.`);
}

function resourceTitle(string) {
  return `• ${string}`;
}

function dispatchQueueResourceDescriptionFromProperties(properties) {
  return resourceTitle(`There are ${properties.works_count} work items pending on the ` +
    `dispatch queue: "${properties.queue}".`);
}

function runLoopResourceDescriptionFromProperties(properties) {
  return resourceTitle(`Run loop "${properties.name}" is awake.`);
}

function oneTimeEventDescriptionFromProperties(properties) {
  const objectName = properties.object;

  return resourceTitle(`The event "${properties.event}" is taking place` +
    `${(objectName === undefined) ? `.` : ` with object: "${objectName}".`}`);
}

function timersResourceDescriptionFromProperties(properties) {
  if (properties === undefined) {
    return resourceTitle(`There are enqueued timers.`);
  }

  let timerCount = 0;
  let timersDescriptions = [];
  for (const timer of properties.timers) {
    timerCount++;
    timersDescriptions.push(timerDescriptionFromTimer(timer, timerCount));
  }

  return `${resourceTitle(`${timerCount} enqueued native timers:`)}` +
    `\n${timersDescriptions.join('\n')}`;
}

function timerDescriptionFromTimer(timer, timerCount) {
  return `${resourceSubTitle(`Timer #${timerCount}:`)}\n` +
    `${resourceSubSubTitle(`Fire date: ${timer.fire_date}`)}.\n` +
    `${resourceSubSubTitle(`Time until fire: ${timer.time_until_fire.toFixed(3)}`)}.\n` +
    `${resourceSubSubTitle(`Repeat interval: ${timer.repeat_interval}`)}.\n` +
    `${resourceSubSubTitle(`Is recurring: ${timer.is_recurring ? `YES` : `NO`}`)}.`;
}

function resourceSubTitle(string) {
  return `  - ${string}`;
}

function resourceSubSubTitle(string) {
  return `    + ${string}`;
}

const uiResourceCounterNameMapping = {
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

function uiResourceDescriptionFromProperties(properties) {
  let countersDescriptions = [];
  for (const [key, value] of Object.entries(properties)) {
    countersDescriptions.push(resourceSubTitle(`${uiResourceCounterNameMapping[key]}: ${value}`));
  }

  return `${resourceTitle(`UI elements are busy:`)}\n${countersDescriptions.join('.\n')}.`;
}

function jsTimersResourceDescriptionFromProperties(properties) {
  let timerCount = 0;
  let timersDescriptions = [];
  for (const timer of properties.timers) {
    timerCount++;
    timersDescriptions.push(jsTimerDescriptionFromTimer(timer, timerCount));
  }

  return `${resourceTitle(`${timerCount} enqueued JavaScript timers:`)}` +
    `\n${timersDescriptions.join('\n')}`;
}

function jsTimerDescriptionFromTimer(timer, timerCount) {
  return `${resourceSubTitle(`Timer #${timerCount}:`)}\n` +
    `${resourceSubSubTitle(`JS timer ID: ${timer.timer_id}`)}.\n` +
    `${resourceSubSubTitle(`Duration: ${timer.duration}`)}.\n` +
    `${resourceSubSubTitle(`Is recurring: ${timer.is_recurring ? `YES` : `NO`}`)}.`;
}

function networkResourceDescriptionFromProperties(properties) {
  let urlCount = 0;
  let urlsDescriptions = [];
  for (const url of properties.urls) {
    urlCount++;
    urlsDescriptions.push(urlDescriptionFromURL(url, urlCount));
  }

  return `${resourceTitle(`${urlCount} network requests with URLs:`)}` +
    `\n${urlsDescriptions.join('\n')}`;
}

function urlDescriptionFromURL(url, urlCount) {
  return resourceSubTitle(`URL #${urlCount}: ${url}.`);
}

function looperResourceDescriptionFromProperties(properties) {
  const executionType = properties.execution_type;
  return resourceTitle(`${properties.thread} is executing` +
    `${executionType !== undefined ? ` (${executionType}).` : `.`}`);
}

function unknownResourceDescriptionFromProperties(properties) {
  return resourceTitle(`Resource "${properties.identifier}" is busy.`);
}

module.exports = { formatJSONStatus };
