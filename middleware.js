"use strict"

const { NotFoundError } = require("./expressError");
const db = require("./db.js");


/** Checks for valid company code, returns 404 error if invalid */
async function codeValidator(req, res, next) {
    const code = req.params.code;

    const result = await db.query(
        `SELECT name
            FROM companies
            WHERE code=$1`, [code]);

    if (result.rowCount === 0) {
        //  doesn't work with throw, gets UnhandledPromiseRejectionWarning
        return next(new NotFoundError("Company not found"))
    } else {
        return next();
    };
}

module.exports = {codeValidator};