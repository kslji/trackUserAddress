const Web3 = require("web3");
const _ = require("lodash");
const errorUtil = require("../util/error.util");

function getWeb3Instance(url) {
  if (_.isEmpty(url)) {
    errorUtil.throwErr("url empty");
  }
  console.log("Creating Web3 instance ...");
  return new Web3(new Web3.providers.HttpProvider(url));
}

function checkValidAddress(web3, address) {
  try {
    return web3.utils.isAddress(address);
  } catch (error) {
    throw error;
  }
}

async function getLatestBlockNumber(web3) {
  try {
    const latestBlockNumber = await web3.eth.getBlockNumber();
    return latestBlockNumber;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  getWeb3Instance: getWeb3Instance,
  checkValidAddress: checkValidAddress,
  getLatestBlockNumber: getLatestBlockNumber,
};
