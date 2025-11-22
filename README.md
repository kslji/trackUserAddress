# Track User Address and Download CSV

## Overview
This project **track Ethereum user addresses** and generate downloadable CSV reports of their on-chain activities. The system fetches transaction logs (ERC20, ERC721, internal, external) and ensures **cost-efficient access** by storing historical logs in MongoDB and using the Alchemy API only when needed.

---

## Tech Stack
- **Backend:** Node.js, Express.js  
- **Database:** MongoDB  
- **Blockchain API:** Alchemy SDK  
- **Testing:** Mocha & Chai  

---

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <project-directory>
   
2. Install dependencies:
   ```bash
   npm install
   
3. Set up environment variables in .env:
   ```bash
     MONGO_URL=<your_mongodb_connection_string>
    INFURA_API_URL=<your_infura_api_url>
    ALCHEMY_API_KEY=<your_alchemy_api_key>
    PORT=5001
4. Start the server:
   ```bash
   node cointracker/api.js
5. Run test cases:
   ```bash
    npm run test

# AIM

The system is designed to:
Track Ethereum transaction activity for a given address.
Generate CSV reports of transactions.
Minimize API calls by leveraging historical data stored in MongoDB.
Efficiently handle bulk users and large datasets.
Maintain idempotency using txnHash as a unique identifier.


# How It Works

1. Data Storage & Retrieval
If transaction logs for a given address already exist in MongoDB up to the current block number, data is served directly from the database.
If some logs are missing, the system fetches them from the Alchemy API, merges with existing data, and updates MongoDB.

2. Idempotency & Bulk Writes
Each transaction uses txnHash as a unique identifier to prevent duplicates.
MongoDB bulkWrite with updateOne operations ensures efficient upserts.
This guarantees fast writes and idempotent behavior, so repeated API calls won't create duplicate records.

3. Cost Efficiency
Reduces redundant calls to the Alchemy API.
Historical data is cached in MongoDB for quick retrieval.

4. Flexible Queries
Users can filter transactions by category: ERC20, ERC721, internal, external, or all.
Users can specify the user flow type: from, to, or both.

# Architecture Decisions

1. MongoDB: Flexible schema and scalability for historical logs.
2. Redis (Optional): In-memory caching for frequently queried addresses.
3. Alchemy API: Provides real-time blockchain transaction data.
4. BulkWrite + updateOne: Ensures idempotency and high-performance writes using txnHash.

# API Endpoints
GET /cointracker/report/:address
- Fetch and download a CSV report of a user's transactions.
- Query Parameters:
- userflowtype: "from", "to", or "both"
- categoryType: "erc20", "erc721", "internal", "external", "all"
(http://localhost:5001/cointracker/report/0xd620AADaBaA20d2af700853C4504028cba7C3333?userflowtype=both&categoryType=erc20)

# Key Features & Conclusion
1. Merges historical MongoDB data with real-time Alchemy API calls.
2. Minimizes API usage for cost efficiency.
3. Flexible queries by transaction category and user flow type.
4. Idempotent transaction storage using txnHash as the unique identifier.
5. Efficient bulk writes to handle large datasets and high user volumes.
