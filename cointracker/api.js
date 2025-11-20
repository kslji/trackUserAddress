require("dotenv").config({ path: "../.env" });

const express = require("express");

const mongoLib = require("../lib/mongo.lib.js");
const transactionRouter = require("../cointracker/route/transaction.route.api.js");

const app = express();
const port = process.env.PORT;

(async () => {
  try {
    await mongoLib.connect(process.env.MONGO_URL);
    app.use(express.static("public"));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use("/cointracker", transactionRouter);

    app.get("/status", (req, res) => {
      res.status(200).json({
        status: "ok ✅",
        service: "CoinTracker API",
        timestamp: new Date(),
      });
    });

    app.listen(port, () => {
      console.log(`CoinTracker API running on port: ${port}`);
    });

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();
