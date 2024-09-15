const pm2 = require('pm2');

pm2.connect((err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  pm2.start({
    script: 'index.js',
    name: 'bot',
  }, (err, apps) => {
    pm2.disconnect();
    if (err) {
      console.error(err);
    }
  });
});