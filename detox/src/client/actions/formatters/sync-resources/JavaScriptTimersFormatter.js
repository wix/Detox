const { makeResourceTitle, makeResourceSubTitle, makeResourceSubSubTitle } = require('./utils');

function makeTimerDescription(timer, timerCount) {
  return `${makeResourceSubTitle(`Timer #${timerCount}:`)}\n` +
    `${makeResourceSubSubTitle(`JS timer ID: ${timer.timer_id}`)}.\n` +
    `${makeResourceSubSubTitle(`Duration: ${timer.duration}`)}.\n` +
    `${makeResourceSubSubTitle(`Is recurring: ${timer.is_recurring ? `YES` : `NO`}`)}.`;
}

module.exports = function(properties) {
  let timerCount = 0;
  let timersDescriptions = [];

  for (const timer of properties.timers) {
    timerCount++;
    timersDescriptions.push(makeTimerDescription(timer, timerCount));
  }

  return `${makeResourceTitle(`${timerCount} enqueued JavaScript timers:`)}\n${timersDescriptions.join('\n')}`;
};
