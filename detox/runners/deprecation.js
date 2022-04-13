const chalk = require('chalk');

console.error(chalk.yellow(`
=========================  THE NEW JOURNEY BEGINS  =============================

        https://github.com/wix/Detox/blob/master/docs/Guide.Jest.md

             _.-;-._              Sorry, traveler from the lands of Detox 19!
            ;_.JL___;
            F"-/\\_-7L             Detox 20 comes without old adapters for Jest
            | a/ e | \\            and Mocha test runners. You have to rearrange
           ,L,c;,.='/;,           your init code before you can continue your
        _,-;;S:;:S;;:' '--._      journey.
       ;. \\;;s:::s;;: .'   /\\
      /  \\  ;::::;;  /    /  \\    Navigate to the link above and follow the
     / ,  k ;S';;'S.'    j __,l   migration guide steps.
  ,---/| /  /S   /S '.   |'   ;
 ,Ljjj |/|.' s .' s   \\  L    |   Sincerely yours,
 LL,_ ]( \\    /    '.  '.||   ;   Detox team.
 ||\\ > /  ;-.'_.-.___\\.-'(|=="(
 JJ," /   |_  [   ]     _]|   /
  LL\\/   ,' '--'-'-----'  \\  (
  ||     ;      |          |  >
  JJ     |      |\\         |,/
   LL    |      ||       ' |
   ||    |      ||       . |
   JJ    /_     ||       ;_|
    LL   L "==='|i======='_|
    ||    i----' '-------';
    JJ    ';-----.------,-'
     LL     L_.__J,'---;'
     ||      |   ,|    (
     JJ     .'=  (|  ,_|
      LL   /    .'L_    \\
snd   ||   '---'    '.___>
Credit: "Gimli" by Shanaka Dias

        https://github.com/wix/Detox/blob/master/docs/Guide.Jest.md

=========================  THE NEW JOURNEY BEGINS  =============================

`));

throw Object.assign(new Error(
  '\n\nPlease follow the new Jest setup guide:\nhttps://github.com/wix/Detox/blob/master/docs/Guide.Jest.md\n\n'
), { stack: '' });
