const chalk = require('chalk');

console.error(chalk.yellow(`
=========================  THE NEW JOURNEY BEGINS  =============================

        https://github.com/wix/Detox/blob/master/docs/Guide.Jest.md

             _.-;-._              Sorry, traveler from the lands of Detox 17!
            ;_.JL___;           
            F"-/\\_-7L             Detox 18 comes without old adapters for Jest.
            | a/ e | \\            You have to rearrange your init code before
           ,L,c;,.='/;,           you can continue your journey.
        _,-;;S:;:S;;:' '--._
       ;. \\;;s:::s;;: .'   /\\     Navigate to the link above and follow the
      /  \\  ;::::;;  /    /  \\    migration guide steps.
     / ,  k ;S';;'S.'    j __,l  
  ,---/| /  /S   /S '.   |'   ;   Sincerely yours,
 ,Ljjj |/|.' s .' s   \\  L    |   Detox team.
 LL,_ ]( \\    /    '.  '.||   ;
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
