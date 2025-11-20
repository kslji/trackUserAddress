const express = require("express");
const transactionRouterInterface = express.Router();

const transactionController = require("../controller/transaction.controller.api.js");

transactionRouterInterface.get("/report/:address", transactionController.fetchUserTransactions);

module.exports = transactionRouterInterface;