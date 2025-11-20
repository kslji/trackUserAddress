function throwErr(message, jsonData = {}) {
  const err = new Error(message)
  err.data = JSON.stringify(jsonData)
  throw err
}

module.exports = {
  throwErr: throwErr,
}
