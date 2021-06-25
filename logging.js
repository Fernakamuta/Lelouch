const bunyan = require("bunyan"),
  bformat = require("bunyan-format"),
  formatOut = bformat({ outputMode: "short" });

const logger = bunyan.createLogger({
  name: "lelouch",
  streams: [
    {
      level: "info",
      stream: formatOut,
    },
  ],
});

module.exports = logger;
