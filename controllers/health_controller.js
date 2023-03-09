const checkHealth = async (req, res) => {
  const data = {
    uptime: process.uptime(),
    message: "Ok",
    date: new Date(),
  };

  try {
    return res.status(200).send(data);
  } catch (error) {
    console.log(error);
    data.message = error;
    return res.status(503).send(data);
  }
};


module.exports = {
  checkHealth,
};