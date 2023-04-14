const { makeResourceTitle, makeResourceSubTitle } = require('./utils');

const propertyToDescriptionMapping = {
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

module.exports = function(properties) {
  let countersDescriptions = [];
  for (const [key, value] of Object.entries(properties)) {
    countersDescriptions.push(makeResourceSubTitle(`${propertyToDescriptionMapping[key]}: ${value}`));
  }

  return `${makeResourceTitle(`UI elements are busy:`)}\n${countersDescriptions.join('.\n')}.`;
};
