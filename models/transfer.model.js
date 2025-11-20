const mongoose = require("mongoose");
const dbEnum = require("../enum/db.enum");
const collectionEnum = require("../enum/db.collection.enum");
const categoryEnum = require("../enum/category.type.enum");

const transferTxnsSchema = new mongoose.Schema(
  {
    address: {
      type: String,
      required: true,
    },
    blockNumber: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      enum: Object.values(categoryEnum),
      required: true,
    },
    txnHash: {
      type: String,
      required: true,
      unique: true,
    },
    userFlowType: {
      type: String,
      required: true,
    },
    metadata: {
      type: Object,
      required: true,
    },
  },
  { timestamps: true }
);

transferTxnsSchema.index({
  address: 1,
  category: 1,
  blockNumber: 1,
  userFlowType: 1,
});

module.exports = mongoose.connection
  .useDb(dbEnum.TRANSACTIONS)
  .model(collectionEnum.TRANSFERS, transferTxnsSchema);
