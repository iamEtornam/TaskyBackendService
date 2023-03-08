const admin = require("firebase-admin");

module.exports.verifyToken = async function verifyToken(authorization) {
  console.log(authorization, "authorization");
  try {
    if (authorization === undefined) {
      return;
    }

    const result = authorization.split(" ");
    return await admin.auth().verifyIdToken(result[1]);
  } catch (error) {
    console.log(error, "token error");
    return;
  }
}

module.exports.updateOrCreate = function updateOrCreate(model, values, condition) {
  return model
    .findOne({
      where: condition,
    })
    .then(function (obj) {
      // update
      if (obj) return obj.update(values);
      // insert
      return model.create(values);
    });
}



module.exports.generateTempFile = function tempFile(
  name = "temp_file",
  data = "",
  encoding = "utf8"
) {
  const fs = require("fs");
  const os = require("os");
  const path = require("path");

  return new Promise((resolve, reject) => {
    const tempPath = path.join(os.tmpdir(), "foobar-");
    fs.mkdtemp(tempPath, (err, folder) => {
      if (err) return reject(err);

      const file_name = path.join(folder, name);

      fs.writeFile(file_name, data, encoding, (error_file) => {
        if (error_file) return reject(error_file);

        resolve(file_name);
      });
    });
  });
};