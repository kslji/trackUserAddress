require("dotenv").config("../.env");
const { Alchemy, Network } = require("alchemy-sdk");

const mongolib = require("./mongo.lib.js");
const web3Lib = require("./web3.lib.js");
const helperUtils = require("../util/helper.util.js");

const syncModel = require("../models/sync.model.js");
const transferModel = require("../models/transfer.model.js");

const userTypeEnum = require("../enum/user.type.enum");
const categoryEnum = require("../enum/category.type.enum");
const globalConfig = require("../config/global.config.json");

function initializeAlchemy(config = {}) {
  config = {
    apiKey: process.env.ALCHEMY_API_KEY,
    network: Network.ETH_MAINNET,
  };
  return new Alchemy(config);
}

async function getCurrentGas(alchemy) {
  const gas = await alchemy.core.getGasPrice();
  return Number(gas) / 1e9; // Convert to Gwei
}

async function fetchTransfersFromMongoDB(
  address,
  categoryType,
  blockNumber,
  userFlowType
) {
  if (userFlowType === userTypeEnum.BOTH || categoryType === categoryEnum.ALL) {
    return await mongolib.findByQuery(transferModel, {
      address: address,
      blockNumber: { $lte: blockNumber },
    });
  }
  switch (categoryType) {
    case categoryEnum.ERC20:
    case categoryEnum.ERC721:
    case categoryEnum.EXTERNAL:
    case categoryEnum.INTERNAL:
      return await mongolib.findByQuery(transferModel, {
        address: address,
        category: categoryType,
        blockNumber: { $lte: blockNumber },
        userFlowType: userFlowType,
      });
    default:
      throw new Error(`Invalid categoryType: ${categoryType}`);
  }
}

async function transferSynced(address, category, blocknumber, userLogType) {
  // JUST TO HANDLE SOME EDGE CASES
  if (userLogType === userTypeEnum.BOTH) {
    userLogType = userTypeEnum.FROM;
  }
  const records = await mongolib.findByQuery(syncModel, {
    address: address,
    category: category,
    userLogType: userLogType,
  });
  if (records.length === 0) {
    return globalConfig.fromBlock;
  }
  const lastBlock = records[0].lastBlockProcessed;
  if (lastBlock >= blocknumber) {
    return true;
  }
  return lastBlock + 1;
}

async function fetchAlchemyTransferTypes(
  alchemy,
  address,
  userLogType = userTypeEnum.FROM,
  categoryType = categoryEnum.ALL,
  fromBlock = globalConfig.fromBlock,
  toBlock = globalConfig.toblock,
  batchLimit = globalConfig.batchLimit
) {
  try {
    let allTransfers = [];
    address = address.toLowerCase();

    if (toBlock === "latest") {
      toBlock = await web3Lib.getLatestBlockNumber(
        web3Lib.getWeb3Instance(process.env.INFURA_API_URL)
      );
    }

    const syncResult = await transferSynced(
      address,
      categoryType,
      toBlock,
      userLogType
    );

    if (syncResult === true) {
      console.log("Already synced:", address);
      const transferlogs = await fetchTransfersFromMongoDB(
        address,
        categoryType,
        toBlock,
        userLogType
      );
      return transferlogs;
    }

    const storedTransfers = await fetchTransfersFromMongoDB(
      address,
      categoryType,
      syncResult - 1,
      userLogType
    );
    
    if (userLogType === userTypeEnum.BOTH && storedTransfers.length === 0) {
      return [];
    }
    allTransfers.push(...storedTransfers);

    let addressFilter = {};
    if (userLogType === userTypeEnum.FROM) {
      addressFilter = { fromAddress: address };
    } else if (
      userLogType === userTypeEnum.TO ||
      userLogType === userTypeEnum.BOTH
    ) {
      addressFilter = { toAddress: address };
    }

    fromBlock = syncResult;

    let pageKey = undefined;
    let bulkOperations = [];

    const category = helperUtils.getCategoryTypes(categoryType);

    while (true) {
      const response = await alchemy.core.getAssetTransfers({
        fromBlock: fromBlock,
        toBlock: toBlock,
        category: category,
        withMetadata: globalConfig.withMetadata,
        maxCount: batchLimit,
        pageKey: pageKey,
        ...addressFilter,
      });

      allTransfers.push(...response.transfers);

      response.transfers.forEach((transfer) => {
        bulkOperations.push({
          updateOne: {
            filter: { txnHash: transfer.hash },
            update: {
              address: address,
              blockNumber: parseInt(transfer.blockNum, 16),
              category: transfer.category,

              metadata: transfer,
            },
            upsert: true,
          },
        });
      });

      await Promise.all([
        mongolib.bulkWrite(transferModel, bulkOperations),
        mongolib.findOneAndUpdate(
          syncModel,
          {
            address: address,
            category: categoryType,
            userLogType: userLogType,
          },
          { lastBlockProcessed: toBlock },
          { upsert: true }
        ),
      ]);

      bulkOperations = [];

      if (!response.pageKey) break;
      pageKey = response.pageKey;
    }

    console.log("Total Transfers Fetched:", allTransfers.length);
    return allTransfers;
  } catch (e) {
    throw e;
  }
}

module.exports = {
  fetchAlchemyTransferTypes: fetchAlchemyTransferTypes,
  getCurrentGas: getCurrentGas,
  initializeAlchemy: initializeAlchemy,
};
