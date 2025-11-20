const { Parser } = require("json2csv");
const fs = require("fs");
const path = require("path");

function ensureDirectoryExists(filePath) {
  const dirname = path.dirname(filePath);

  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
}

function buildCsvRows(data, gasFee) {
  return data.map((tx) => {
    return {
      transactionHash: tx.hash || tx.txnHash || "",
      dateTime:
        tx?.metadata?.blockTimestamp ||
        tx.metadata.metadata.blockTimestamp ||
        "",
      fromAddress: tx.from || tx.metadata.from || "",
      toAddress: tx.to || tx.metadata.to || "",
      transactionType: tx.category || tx.metadata.category || "",
      assetContractAddress:
        tx.rawContract?.address || tx.metadata.rawContract?.address || "",
      assetSymbol: tx.asset || tx.metadata.asset || "",
      tokenId:
        tx.tokenId ||
        tx.erc721TokenId ||
        tx.metadata.tokenId ||
        tx.metadata.erc721TokenId ||
        "",
      value: tx.value || tx.metadata.value || "",
      currentGasFee: parseFloat(gasFee) || 0,
    };
  });
}

function convertRowsToCsv(rows) {
  const fields = [
    "transactionHash",
    "dateTime",
    "fromAddress",
    "toAddress",
    "transactionType",
    "assetContractAddress",
    "assetSymbol",
    "tokenId",
    "value",
    "currentGasFee",
  ];

  const parser = new Parser({ fields });
  return parser.parse(rows);
}
module.exports = {
  buildCsvRows: buildCsvRows,
  convertRowsToCsv: convertRowsToCsv,
  ensureDirectoryExists: ensureDirectoryExists,
};
