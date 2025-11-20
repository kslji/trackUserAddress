const chai = require("chai");
const expect = chai.expect;
const chaiHttp = require("chai-http");
chai.use(chaiHttp);
const express = require("express");
const fs = require("fs");
const path = require("path");
const Web3 = require("web3");
const mongoose = require("mongoose");

const mongoLib = require("../lib/mongo.lib");
const alchemyLib = require("../lib/achemy.lib")
const web3Lib = require("../lib/web3.lib");
const errorUtil = require("../util/error.util");
const helperUtil = require("../util/helper.util");
const fileUtil = require("../util/file.util");
const categoryEnum = require("../enum/category.type.enum");
const userTypeEnum = require("../enum/user.type.enum")
const transactionRouter =require("../cointracker/route/transaction.route.api")

describe("Category Utils", () => {
  describe("getCategoryTypes", () => {
    it("should return all categories when input is ALL", () => {
      const result = helperUtil.getCategoryTypes(categoryEnum.ALL);
      expect(result).to.deep.equal([
        categoryEnum.ERC20,
        categoryEnum.ERC721,
        categoryEnum.EXTERNAL,
        categoryEnum.INTERNAL,
      ]);
    });

    it("should return single category when input is a specific category", () => {
      const result = helperUtil.getCategoryTypes(categoryEnum.ERC20);
      expect(result).to.deep.equal([categoryEnum.ERC20]);
    });

    it("should return single category for unknown category (fallback behavior)", () => {
      const result = helperUtil.getCategoryTypes("UNKNOWN");
      expect(result).to.deep.equal(["UNKNOWN"]);
    });
  });
});

describe("CSV Utils", () => {
  describe("ensureDirectoryExists", () => {
    const testDir = path.join(__dirname, "tempDir/test.csv");

    afterEach(() => {
      if (fs.existsSync(path.dirname(testDir))) {
        fs.rmdirSync(path.dirname(testDir), { recursive: true });
      }
    });

    it("should create directory if it does not exist", () => {
      expect(fs.existsSync(path.dirname(testDir))).to.be.false;
     fileUtil.ensureDirectoryExists(testDir);
      expect(fs.existsSync(path.dirname(testDir))).to.be.true;
    });

    it("should not throw if directory already exists", () => {
      fs.mkdirSync(path.dirname(testDir), { recursive: true });
      expect(() => fileUtil.ensureDirectoryExists(testDir)).to.not.throw();
    });
  });

  describe("buildCsvRows", () => {
    it("should build CSV row objects from transactions", () => {
      const data = [
        {
          hash: "0x123",
          metadata: { blockTimestamp: "2025-11-21T00:00:00Z", from: "0xabc", to: "0xdef", category: "ERC20", rawContract: { address: "0xcontract" }, asset: "TOKEN", tokenId: "1", value: "100" },
          from: "0xabc",
          to: "0xdef",
          asset: "TOKEN",
          tokenId: "1",
          value: "100",
        },
      ];
      const gasFee = "0.01";

      const result = fileUtil.buildCsvRows(data, gasFee);
      expect(result).to.be.an("array").with.lengthOf(1);
      expect(result[0]).to.include({
        transactionHash: "0x123",
        fromAddress: "0xabc",
        toAddress: "0xdef",
        transactionType: "ERC20",
        assetContractAddress: "0xcontract",
        assetSymbol: "TOKEN",
        tokenId: "1",
        value: "100",
        currentGasFee: 0.01,
      });
      expect(result[0].dateTime).to.equal("2025-11-21T00:00:00Z");
    });
  });
});

describe("Error Utils", () => {
  describe("throwErr", () => {
    it("should throw an error with message and JSON data", () => {
      const message = "Something went wrong";
      const data = { key: "value" };

      expect(() => errorUtil.throwErr(message, data)).to.throw(Error, message)
        .with.property("data", JSON.stringify(data));
    });

    it("should throw an error with empty JSON data if none provided", () => {
      const message = "Error without data";

      expect(() => errorUtil.throwErr(message)).to.throw(Error, message)
        .with.property("data", JSON.stringify({}));
    });
  });
});
describe("Web3 Utils", () => {

  describe("getWeb3Instance", () => {
    it("should throw an error if URL is empty", () => {
      try {
        web3Lib.getWeb3Instance("");
      } catch (err) {
        expect(err).to.be.instanceOf(Error);
        expect(err.message).to.equal("url empty");
      }
    });

    it("should create a Web3 instance with a valid URL", () => {
      const url = "http://localhost:8545";
      const web3Instance = web3Lib.getWeb3Instance(url);
      expect(web3Instance).to.be.instanceOf(Web3);
      expect(web3Instance.currentProvider.host).to.equal(url);
    });
  });

  describe("checkValidAddress", () => {
    const web3 = new Web3();

    it("should return true for a valid Ethereum address", () => {
      const validAddress = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
      const result = web3Lib.checkValidAddress(web3, validAddress);
      expect(result).to.be.true;
    });

    it("should return false for an invalid Ethereum address", () => {
      const invalidAddress = "0xINVALIDADDRESS";
      const result = web3Lib.checkValidAddress(web3, invalidAddress);
      expect(result).to.be.false;
    });

    it("should return false if web3.utils.isAddress throws an error", () => {
      // Monkey patch isAddress to throw an error
      const originalIsAddress = web3.utils.isAddress;
      web3.utils.isAddress = () => { throw new Error("boom"); };

      const result = web3Lib.checkValidAddress(web3, "0x123");
      expect(result).to.be.false;

      // Restore original method
      web3.utils.isAddress = originalIsAddress;
    });
  });

  describe("getLatestBlockNumber", () => {
    it("should return the latest block number", async () => {
      const web3 = new Web3('https://mainnet.infura.io/v3/de96e0798e3f462381fa61b8007c73ed');
      const blockNumber = await web3Lib.getLatestBlockNumber(web3);
      expect(blockNumber).to.be.a("number");
      expect(blockNumber).to.be.greaterThan(0);
    });

    it("should throw error if web3 instance is invalid", async () => {
      const invalidWeb3 = {};
      try {
        await web3Lib.getLatestBlockNumber(invalidWeb3);
      } catch (err) {
        expect(err).to.be.instanceOf(Error);
      }
    });
  });

});

describe("MongoDB Lib", () => {

  describe("isConnected", () => {
    it("should return true if mongoose is connected", () => {
      mongoose.connection.readyState = 1;

      const result = mongoLib.isConnected();
      expect(result).to.be.true;
    });

    it("should return false if mongoose is not connected", () => {
      mongoose.connection.readyState = 0;

      const result = mongoLib.isConnected();
      expect(result).to.be.false;
    });
  });

  describe("findByQuery", () => {

    it("should throw error if model or query is null", async () => {
      try {
        await mongoLib.findByQuery(null, {});
        throw new Error("Test failed — expected an error but none was thrown");
      } catch (err) {
        expect(err).to.be.instanceOf(Error);
      }
    });

    it("should return documents when model.find resolves", async () => {
      const mockDocs = [{ name: "doc1" }];

      const mockModel = {
        find: () => ({
          maxTimeMS: () => Promise.resolve(mockDocs),
        }),
      };

      const result = await mongoLib.findByQuery(mockModel, { name: "doc1" });

      expect(result).to.deep.equal(mockDocs);
    });
  });

  describe("findOneAndUpdate", () => {

    it("should throw error if model, filterQuery or updateQuery is null", async () => {
      try {
        await mongoLib.findOneAndUpdate(null, {}, {});
        throw new Error("Test failed — expected an error but none was thrown");
      } catch (err) {
        expect(err).to.be.instanceOf(Error);
      }
    });

    it("should update a document and return it", async () => {
      const mockDoc = { name: "updatedDoc" };

      const mockModel = {
        findOneAndUpdate: () => Promise.resolve(mockDoc),
      };

      const result = await mongoLib.findOneAndUpdate(
        mockModel,
        { name: "doc1" },
        { name: "updatedDoc" }
      );

      expect(result).to.deep.equal(mockDoc);
    });
  });

  describe("bulkWrite", () => {

    it("should throw error if model or operations is null", async () => {
      try {
        await mongoLib.bulkWrite(null, []);
        throw new Error("Test failed — expected an error but none was thrown");
      } catch (err) {
        expect(err).to.be.instanceOf(Error);
      }
    });

    it("should execute bulkWrite and return the result", async () => {
      const mockResult = { nModified: 2 };

      const mockModel = {
        bulkWrite: () => Promise.resolve(mockResult),
      };

      const result = await mongoLib.bulkWrite(
        mockModel,
        [{ updateOne: {} }]
      );

      expect(result).to.deep.equal(mockResult);
    });
  });
});

describe("Alchemy Lib", () => {

  describe("initializeAlchemy", () => {
    it("should return an Alchemy instance with correct config", () => {
      const alchemy = alchemyLib.initializeAlchemy();
      expect(alchemy).to.have.property("core");
    });
  });

  describe("getCurrentGas", () => {
    it("should return gas price in Gwei", async () => {
      const fakeAlchemy = {
        core: {
          getGasPrice: async () => 1000000000, 
        },
      };
      const gas = await alchemyLib.getCurrentGas(fakeAlchemy);
      expect(gas).to.equal(1);
    });
  });

  describe("fetchAlchemyTransferTypes", () => {
    const fakeAlchemy = {
      core: {
        getAssetTransfers: async (params) => ({
          transfers: [
            {
              hash: "0x123",
              blockNum: "0x10",
              category: categoryEnum.ERC20,
            },
          ],
        }),
      },
    };

    const fakeWeb3 = {
      eth: {
        getBlockNumber: async () => 20,
      },
      utils: {
        isAddress: (address) => true,
      },
    };

    before(() => {
      web3Lib.getWeb3Instance = () => fakeWeb3;
      web3Lib.getLatestBlockNumber = async () => 20;
      mongoLib.findByQuery = async () => [];
      mongoLib.bulkWrite = async () => ({});
      mongoLib.findOneAndUpdate = async () => ({});
      helperUtil.getCategoryTypes = (categoryType) => [categoryType];
    });

    it("should fetch transfers and return an array", async () => {
      const result = await alchemyLib.fetchAlchemyTransferTypes(
        fakeAlchemy,
        "0xabc",
        userTypeEnum.FROM,
        categoryEnum.ERC20,
        0,
        20,
        100
      );
      expect(result).to.be.an("array");
      expect(result[0]).to.have.property("hash", "0x123");
      expect(result[0]).to.have.property("category", categoryEnum.ERC20);
    });

    it("should handle userTypeEnum.BOTH correctly", async () => {
      const result = await alchemyLib.fetchAlchemyTransferTypes(
        fakeAlchemy,
        "0xabc",
        userTypeEnum.BOTH,
        categoryEnum.ALL,
        0,
        20,
        100
      );
      expect(result).to.be.an("array");
    });

    it("should throw error for invalid categoryType", async () => {
      try {
        await alchemyLib.fetchAlchemyTransferTypes(
          fakeAlchemy,
          "0xabc",
          userTypeEnum.FROM,
          "INVALID_CATEGORY",
          0,
          20,
          100
        );
      } catch (err) {
        expect(err).to.be.instanceOf(Error);
        expect(err.message).to.include("Invalid categoryType");
      }
    });
  });
});

describe("Transaction Controller API", () => {
  let app;

  before(() => {
    app = express();
    app.use(express.json());
    app.use("/cointracker", transactionRouter);
  });

  beforeEach(() => {
    web3Lib.getWeb3Instance = () => ({ utils: { isAddress: () => true } });
    web3Lib.checkValidAddress = () => true;

    alchemyLib.initializeAlchemy = () => ({ core: {} });
    alchemyLib.fetchAlchemyTransferTypes = async () => [
      { hash: "0x123", blockNum: "0x1", category: categoryEnum.ERC20 },
    ];
    alchemyLib.getCurrentGas = async () => 10;

    fileUtil.buildCsvRows = (transfers, gasFee) =>
      transfers.map((tx) => ({ ...tx, gasFee }));
    fileUtil.convertRowsToCsv = (rows) => "txHash,blockNum,category,gasFee\n0x123,1,ERC20,10";
    fileUtil.ensureDirectoryExists = () => {};
    fs.writeFileSync = () => {};
  });

  describe("GET /cointracker/report/:address", () => {
    it("should return 200 and download URL for valid address", (done) => {
      const address = "0x0eb8c82474f93fb9cccd3b8235af6cc8d87cdd45";
      chai
        .request(app)
        .get(`/cointracker/report/${address}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property("status", "success");
          expect(res.body).to.have.property("downloadUrl");
          expect(res.body).to.have.property("address", address.toLowerCase());
          done();
        });
    });

    it("should return 400 for invalid transactionType query", (done) => {
      const address = "0x0eb8c82474f93fb9cccd3b8235af6cc8d87cdd45";
      chai
        .request(app)
        .get(`/cointracker/report/${address}?categorytype=INVALID`)
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.have.property("error", "transactionType query must be enum type");
          expect(res.body).to.have.property("allowedTypes");
          done();
        });
    });

    it("should return 400 for invalid Ethereum address", (done) => {
      web3Lib.checkValidAddress = () => false;
      const address = "INVALID_ADDRESS";
      chai
        .request(app)
        .get(`/cointracker/report/${address}`)
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.have.property("error", "Invalid Ethereum address");
          done();
        });
    });

    it("should return 500 if controller throws an exception", (done) => {
      alchemyLib.fetchAlchemyTransferTypes = async () => { throw new Error("Test Error"); };
      const address = "0x0eb8c82474f93fb9cccd3b8235af6cc8d87cdd45";
      chai
        .request(app)
        .get(`/cointracker/report/${address}`)
        .end((err, res) => {
          expect(res).to.have.status(500);
          expect(res.body).to.have.property("error", "Internal server error");
          done();
        });
    });
  });
});