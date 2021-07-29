"use strict"

const express = require("express");
const app = require("../app.js");
const db = require("../db.js");

const router = new express.Router();


/** Queries db for list of companies and returns in JSON:
 *      {
 *          "companies": [
 *              {
 *               "code": "apple",
 *               "name": "Apple Computer",
 *               "description": "Maker of OSX."
 *              }
 *          ]
 *      }
 */
router.get("/", async function(req, res, next){
    const results = await db.query(
        `SELECT code, name, description
            FROM companies`
    );

    return res.json({ companies: results.rows });
})


/** Queries db for a specific company and returns in JSON:
 *      {company: {code, name, description}}
 */
router.get("/:code", async function(req, res, next){
    const code = req.params.code;

    const results = await db.query(
        `SELECT code, name, description
            FROM companies
            WHERE code = $1`, [code]);
    
    return res.json({company: results.rows[0]});
})


/** Adds company to database, returns added company in JSON 
 *      Input: {code, name, description}
 *      Output: {company: {code, name, description}}
*/
router.post("/", async function(req, res, next){
    const {code, name, description} = req.body;

    const results = await db.query(
        `INSERT INTO companies (code, name, description)
            VALUES ($1, $2, $3)
            RETURNING code, name, description`, 
        [code, name, description]
    );

    return res.status(201).json({company: results.rows[0]});
});


/** Edit existing company and returns updated company in JSON: 
 *      Input: {name, description}
 *      Output: {company: {code, name, description}}
*/
router.patch('/:code', async function(req, res, next){
    // validate code --- todo
    
    const code = req.params.code;
    const {name, description} = req.body;
    const results = await db.query(
        `UPDATE companies 
            SET name=$1,
                description=$2
            WHERE code=$3
            RETURNING code, name, description`,
        [name, description, code],
    );
    
    return res.json({company: results.rows[0]});
});

/** Delete an existing company */
router.delete('/:code', async function(req, res, next){
    const code = req.params.code;
    
    await db.query(
        `DELETE FROM companies
        WHERE code=$1`,
        [code],
    );

    return res.json({status: "Deleted."});
})

module.exports = router;;
