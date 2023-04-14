const { makeResourceTitle, makeResourceSubTitle, makeResourceSubSubTitle } = require('./utils');

function makeTimerDescription(timer, timerCount) {
  return `${makeResourceSubTitle(`Timer #${timerCount}:`)}\n` +
    `${makeResourceSubSubTitle(`Fire date: ${timer.fire_date}`)}.\n` +
    `${makeResourceSubSubTitle(`Time until fire: ${timer.time_until_fire.toFixed(3)}`)}.\n` +
    `${makeResourceSubSubTitle(`Repeat interval: ${timer.repeat_interval}`)}.\n` +
    `${makeResourceSubSubTitle(`Is recurring: ${timer.is_recurring ? `YES` : `NO`}`)}.`;
}

module.exports = function(properties) {
  if (properties === undefined) {
    return makeResourceTitle(`There are enqueued timers.`);
  }

  let timerCount = 0;
  let timersDescriptions = [];
  for (const timer of properties.timers) {
    timerCount++;
    timersDescriptions.push(makeTimerDescription(timer, timerCount));
  }

  return `${makeResourceTitle(`${timerCount} enqueued native timers:`)}\n${timersDescriptions.join('\n')}`;
};
