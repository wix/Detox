const Ajv = require('ajv');

const DetoxInternalError = require('../../../errors/DetoxInternalError');
const statusSchema = require('../SyncStatusSchema.json');

const delayedPerformSelectorFormatter = require('./sync-resources/DelayedPerformSelectorFormatter');
const dispatchQueueFormatter = require('./sync-resources/DispatchQueueFormatter');
const jsTimersFormatter = require('./sync-resources/JavaScriptTimersFormatter');
const looperFormatter = require('./sync-resources/LooperFormatter');
const networkFormatter = require('./sync-resources/NetworkFormatter');
const oneTimeEventsFormatter = require('./sync-resources/OneTimeEventsFormatter');
const runLoopFormatter = require('./sync-resources/RunLoopFormatter');
const timersFormatter = require('./sync-resources/TimersFormatter');
const uiFormatter = require('./sync-resources/UIFormatter');
const unknownResourceFormatter = require('./sync-resources/UnknownResourceFormatter');
const { makeResourceTitle } = require('./sync-resources/utils');

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
  delayed_perform_selector: delayedPerformSelectorFormatter,
  dispatch_queue: dispatchQueueFormatter,
  run_loop: runLoopFormatter,
  one_time_events: oneTimeEventsFormatter,
  timers: timersFormatter,
  ui: uiFormatter,
  js_timers: jsTimersFormatter,
  network: networkFormatter,
  looper: looperFormatter,
  io: () => { return makeResourceTitle(`Disk I/O activity.`); },
  unknown: unknownResourceFormatter,
};

function resourceDescriptionFromJSON(jsonDescription) {
  const resourceName = jsonDescription.name;
  const formatter = resourceFormatters[resourceName];
  const properties = jsonDescription.description;
  return formatter(properties);
}

module.exports = formatJSONStatus;
