const bunyan = require("bunyan"),
  bformat = require("bunyan-format"),
  formatOut = bformat({ outputMode: "short" }),
  { LoggingBunyan } = require("@google-cloud/logging-bunyan");

const loggingBunyan = new LoggingBunyan();

const logger = bunyan.createLogger({
  name: "lelouch",
  streams: [
    {
      level: "info",
      stream: formatOut,
    },
    loggingBunyan.stream("info"),
  ],
});

module.exports = logger;
