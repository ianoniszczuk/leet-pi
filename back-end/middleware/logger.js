const morgan = require('morgan');

const logger = morgan('combined', {
  skip: (req, res) => res.statusCode < 400,
  stream: {
    write: (message) => {
      console.log(message.trim());
    },
  },
});

module.exports = logger;
