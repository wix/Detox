function handler(name) {
  return () => {
    console.error(`Prevented ${name}`);
    setTimeout(() => {
      console.error(`Exiting...`);
      process.exit(0);
    }, 1000);
  };
}

process.on('SIGINT', handler('SIGINT'));
process.on('SIGTERM', handler('SIGTERM'));

console.log('Demo started', new Date());
setInterval(() => {
  console.log('Still running', new Date());
}, 1000);
