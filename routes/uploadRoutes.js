const AWS = require("aws-sdk");
const keys = require("../config/keys");
const requireLogin = require("../middlewares/requireLogin");
const uuid = require("uuid");

const s3 = new AWS.S3(keys.AWS.S3);

module.exports = app => {

  app.get("/api/upload", requireLogin, (req, res) => {
    const key = `${req.user.id}/${uuid()}.jpeg`;


    s3.getSignedUrl(
      "putObject",
      {
        Bucket: "advanced-node-stater",
        ContentType: "image/jpeg",
        Key: key
      }, (err, url) => {
        if (err) return res.status(405).send({err});

        return res.send({ key, url });
      });
  });
};