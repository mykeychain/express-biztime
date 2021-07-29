"use strict"

const express = require("express");
const app = require("../app.js");
const db = require("../db.js");
const { NotFoundError, BadRequestError } = require("../expressError.js");

const router = new express.Router();


/** Queries db for list of invoices and returns in JSON:
 *      {
 *          "invoices": [
 *              {
 * 				 "id" : "1"
 *               "comp_code": "apple",
 *              }
 *          ]
 *      }
 */
router.get("/", async function(req, res, next){
    const results = await db.query(
        `SELECT id, comp_code
            FROM invoices`
    );

    return res.json({ invoices: results.rows });
})


/** Queries db for a specific company and returns in JSON:
 *      {invoices: { id,
 * 					 amt,
 * 					 paid,
 * 					 add_date,
 * 					 paid_date,
 * 					 company: {
 * 								code,
 * 								name,
 * 								description
 * 										}
 * 					 }
 */
router.get("/:id", async function(req, res, next){
    const invId = req.params.id;

	const invResults = await db.query(
        `SELECT id, amt, paid, add_date, paid_date, comp_code
            FROM invoices
            WHERE id = $1`, [invId]);
            
    let {comp_code, ...invoice} = invResults.rows[0];

    const compResults = await db.query(
        `SELECT code, name, description
            FROM companies
            WHERE code = $1`, [comp_code]);

    if (!invoice) {return next(new NotFoundError('Invoice not found.'))};

    invoice.company = compResults.rows[0];

    return res.json({ invoice });
});

/** Adds invoices to database, returns added invoices in JSON 
 *      Input:{compCode, amt}
 *      Output:{invoice: {id, comp_code, amt, paid, add_date, paid_date}}
*/
router.post("/", async function(req, res, next){
    const {compCode, amt} = req.body;

    try {
        const results = await db.query(
            `INSERT INTO invoices (comp_code, amt)
                VALUES ($1, $2)
                RETURNING id, comp_code, amt, paid, add_date, paid_date`, 
            [compCode, amt]
        );
        
        return res.status(201)
                    .json({invoice: results.rows[0]});
    } catch(error) {
        return next(new BadRequestError("Company code does not exist."));
    }
});


/** Edit existing invoice and returns updated invoice in JSON: 
 *      Input: {amt}
 *      Output: {invoices: {id, comp_code, amt, paid, add_date, paid_date}}
*/
router.patch('/:id', async function(req, res, next){    
    const id = req.params.id;
    const {amt} = req.body;
    const results = await db.query(
        `UPDATE invoices 
            SET amt=$1
            WHERE id=$2
            RETURNING id, comp_code, amt, paid, add_date, paid_date`,
        [amt, id],
    );
    const invoice = results.rows[0];
    
    if (!invoice) {return next(new NotFoundError("Invoice not found."))};
    return res.json({ invoice });
});


/** Delete an existing invoices given invoices code */
router.delete('/:id', async function(req, res, next){
    const id = req.params.id;
    
    const results = await db.query(
        `DELETE FROM invoices
            WHERE id=$1
            RETURNING amt`,
        [id],
    );

    if (!results.rows[0]) {return next(new NotFoundError("Cannot delete invoice that doesn't exist"))};

    return res.json({status: "Deleted."});
})

module.exports = router;