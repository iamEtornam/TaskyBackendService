async function verifyToken(authorization) {
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

function updateOrCreate(model, values, condition) {
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
