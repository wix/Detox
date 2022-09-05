const chalk = require('chalk');

// @ts-ignore
console.error(chalk.yellow(`
=========================  THE NEW JOURNEY BEGINS  =============================

                  https://wix.github.io/Detox/docs/guide/jest

         Sorry to say that Detox 20 comes without old adapters for Jest.
    You have to rearrange your init code before you can continue your journey.

         Navigate to the link and follow the migration guide steps.

         Sincerely yours,
         Detox team.

                  https://wix.github.io/Detox/docs/guide/jest

=========================  THE NEW JOURNEY BEGINS  =============================

`));

throw Object.assign(new Error(
  '\n\nPlease follow the new Jest setup guide:\nhttps://wix.github.io/Detox/docs/guide/jest\n\n'
), { stack: '' });
