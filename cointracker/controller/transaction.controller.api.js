require("dotenv").config("../.env");
const path = require("path");
const fs = require("fs");
const web3Lib = require("../../lib/web3.lib.js");
const alchemylib = require("../../lib/achemy.lib.js");
const fileUtil = require("../../util/file.util.js");

const categoryEnum = require("../../enum/category.type.enum.js");
const userTypeEnum = require("../../enum/user.type.enum.js");


async function fetchUserTransactions(req, res) {
  try {
    const transactionType = req.query.categorytype
      ? req.query.categorytype
      : categoryEnum.ALL;
    const userLogType = req.query.userflowtype || userTypeEnum.FROM;
    const address = req.params.address.toLowerCase();

    if (!Object.values(categoryEnum).includes(transactionType)) {
      return res.status(400).json({
        error: "transactionType query must be enum type",
        allowedTypes: Object.values(categoryEnum),
      });
    }

    if (
      !web3Lib.checkValidAddress(
        web3Lib.getWeb3Instance(process.env.INFURA_API_URL),
        address
      )
    ) {
      return res.status(400).json({ error: "Invalid Ethereum address" });
    }
    const alchemy = alchemylib.initializeAlchemy();
    const userTransfers = await alchemylib.fetchAlchemyTransferTypes(
      alchemy,
      address,
      userLogType,
      transactionType
    );
    if (userLogType === userTypeEnum.BOTH && userTransfers.length === 0) {
      return res.status(204).send();
    }
    const gasFees = await alchemylib.getCurrentGas(alchemy);
    const buildCsvData = fileUtil.buildCsvRows(userTransfers, gasFees);
    const csvData = fileUtil.convertRowsToCsv(buildCsvData);

    const fileName = `${transactionType}_${userLogType}_transactions_${address}.csv`;
    const filePath = path.join(__dirname, "../public/reports", fileName);
    fileUtil.ensureDirectoryExists(filePath);
    fs.writeFileSync(filePath, csvData);

    const fileUrl = `${req.protocol}://${req.get("host")}/reports/${fileName}`;
    return res.status(200).json({
      status: "success",
      msg: "Please find the transaction report download link below !!",
      address,
      downloadUrl: fileUrl,
    });
  } catch (e) {
    console.error("Error fetching user transfers:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  fetchUserTransactions: fetchUserTransactions,
};
