const Buffer = require("safe-buffer").Buffer;
const Keygrip = require("keygrip");
const keys = require("../../config/keys");

const keygrip = new Keygrip([keys.cookieKey]);

module.exports = (user) => {

  let sessionObject;
  try
  {
    sessionObject = {
      passport: {
        user: user._id.toString()
      }
    }
  }
  catch(error)
  {
    throw new Error("First Argument required and should be a mongoDB model")
  }

  const session = Buffer.from(
    JSON.stringify(sessionObject)
  ).toString("base64");

  const sig = keygrip.sign("session=" + session);

  return { session, sig };
}