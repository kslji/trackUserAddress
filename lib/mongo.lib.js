const mongoose = require("mongoose");
const globalConfig = require("../config/global.config.json");

async function connect(url) {
  try {
    mongoose.set("strictQuery", false);
    await mongoose.connect(url);
    console.log("MongoDB connected successfully!!");
  } catch (error) {
    throw error;
  }
}

function isConnected() {
  try {
    return mongoose.connection.readyState === 1;
  } catch (error) {
    throw error;
  }
}

async function findByQuery(
  model,
  query,
  option = {},
  timeout = globalConfig.mongoQueryTimeoutMS
) {
  try {
    if (query === null || model === null) {
      errorUtil.throwErr(`values of query  + ${query} +  model  + ${model}`);
    }
    const docs = await model.find(query, option).maxTimeMS(timeout);
    return docs;
  } catch (error) {
    throw error;
  }
}

async function findOneAndUpdate(
  model,
  filterQuery,
  updateQuery,
  options = {},
  timeout = globalConfig.mongoQueryTimeoutMS
) {
  try {
    if (model === null || filterQuery === null || updateQuery === null) {
      errorUtil.throwErr(
        `values of model  + ${model} + filterQuery + ${filterQuery}+ updateQuery + ${updateQuery}`
      );
    }
    const doc = await model.findOneAndUpdate(filterQuery, updateQuery, {
      ...options,
      maxTimeMS: timeout,
    });
    return doc;
  } catch (error) {
    throw error;
  }
}

async function bulkWrite(
  model,
  operations,
  options = {},
  timeout = globalConfig.mongoQueryTimeoutMS
) {
  try {
    if (model === null || operations === null) {
      errorUtil.throwErr(
        `values of model  + ${model} + operations + ${operations}`
      );
    }
    const bulkwriteObject = await model.bulkWrite(operations, {
      ...options,
      maxTimeMS: timeout,
    });
    return bulkwriteObject;
  } catch (err) {
    throw err;
  }
}

module.exports = {
  connect: connect,
  isConnected: isConnected,
  findByQuery: findByQuery,
  findOneAndUpdate: findOneAndUpdate,
  bulkWrite: bulkWrite,
};
