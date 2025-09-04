import morgan from 'morgan'

const logger = morgan('combined', {
  skip: (req, res) => res.statusCode < 400,
  stream: {
    write: (message) => {
      console.log(message.trim());
    },
  },
});

export default logger;
