const bunyan = require("bunyan");
const { LoggingBunyan } = require("@google-cloud/logging-bunyan");

const loggingBunyan = new LoggingBunyan();

const logger = bunyan.createLogger({
  name: "suzaku",
  streams: [
    {
      level: "info",
      stream: process.stdout,
    },
    {
      level: "info",
      path: "logs/history.log",
    },
    loggingBunyan.stream("info"),
  ],
});

module.exports = logger;
