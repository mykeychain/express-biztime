/** Database setup for BizTime. */

const { Client } = require("pg");

const DB_URI = process.env.NODE_ENV === "test"
    ? "postgresql:///biztime_test"
    : "postgresql:///biztime";
    //: "postgresql://ragglesoft:password@localhost:5432/biztime";

let db = new Client({
  connectionString: DB_URI
});

db.connect();

module.exports = db;
