const smpp = require("smpp");
const logger = require("../core/logger");
const config = require("../config/index");

const server = smpp.createServer((session) => {
  session.on("bind_transceiver", function (pdu) {
    session.pause();
    checkAsyncUserPass(pdu.system_id, pdu.password, function (err) {
      if (err) {
        session.send(
          pdu.response({
            command_status: smpp.ESME_RBINDFAIL,
          })
        );
        session.close();
        return;
      }
      session.send(pdu.response());
      session.resume();
    });
  });

  session.on("submit_sm", function (pdu) {
    const {
      short_message: { message },
      destination_addr,
    } = pdu;
    session.send(pdu.response());
    setTimeout(() => {
      session.deliver_sm({
        source_addr: destination_addr,
        short_message: message + "!?",
      });
    }, 1000);
  });
});

const checkAsyncUserPass = async (id, password, callback) =>
  callback(Number(id !== config.systemId || password !== config.password));

server.listen(config.port);

logger.info("SMSC server started successfully!");
logger.info(`Listening on port ${config.port}...`);
