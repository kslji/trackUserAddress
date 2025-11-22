const mongoose = require("mongoose");
const dbEnum = require("../enum/db.enum");
const collectionEnum = require("../enum/db.collection.enum");
const categoryEnum = require("../enum/category.type.enum");

const syncSchema = new mongoose.Schema(
  {
    address: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: Object.values(categoryEnum),
    },
    userLogType: {
      type: String,
      required: true,
    },
    lastBlockProcessed: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);
syncSchema.index({ address: 1, category: 1, userLogType: 1 }, { unique: true });
module.exports = mongoose.connection
  .useDb(dbEnum.SYNC)
  .model(collectionEnum.SYNC, syncSchema);
