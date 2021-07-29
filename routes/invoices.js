"use strict"

const express = require("express");
const app = require("../app.js");
const db = require("../db.js");
const { NotFoundError, BadRequestError } = require("../expressError.js");

const router = new express.Router();



// id SERIAL PRIMARY KEY,
// comp_code TEXT NOT NULL REFERENCES companies ON DELETE CASCADE,
// amt NUMERIC(10, 2) NOT NULL CHECK (amt >= 0),
// paid BOOLEAN DEFAULT FALSE NOT NULL,
// add_date  DATE DEFAULT CURRENT_DATE NOT NULL,
// paid_date DATE


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

    const compResults = await db.query(
        `SELECT code, name, description
            FROM companies
            WHERE code = $1`, [invResults.comp_code]);

    if (!invResults.rows[0]) {return next(new NotFoundError('Invoice not found.'))};
    invResults.rows[0].company = compResults.rows[0];

    return res.json({ invoices: invResults.rows[0] });
});

/** Adds invoices to database, returns added invoices in JSON 
 *      Input:{comp_code, amt}
 *      Output:{invoice: {id, comp_code, amt, paid, add_date, paid_date}}
*/
router.post("/", async function(req, res, next){
    const {compCode, amt} = req.body;


        const results = await db.query(
            `INSERT INTO invoices (comp_code, amt)
                VALUES ($1, $2)
                RETURNING id, comp_code, amt, paid, add_date, paid_date`, 
            [compCode, amt]
        );
	    if(!results.rows[0]){ 
			return next(new BadRequestError("Company code does not exists."));
		}


		return res.status(201)
				  .json({invoices: results.rows[0]});
 

});


/** Edit existing invoices and returns updated invoices in JSON: 
 *      Input: {name, description}
 *      Output: {invoices: {code, name, description}}
*/
router.put('/:code', async function(req, res, next){
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
    
    if (!results.rows[0]) {return next(new NotFoundError("Company not found."))};
    return res.json({invoices: results.rows[0]});
});


/** Delete an existing invoices given invoices code */
router.delete('/:code', async function(req, res, next){
    const code = req.params.code;
    
    const results = await db.query(
        `DELETE FROM companies
            WHERE code=$1
            RETURNING name`,
        [code],
    );

    if (!results.rows[0]) {return next(new NotFoundError("Cannot delete invoices that doesn't exist"))};

    return res.json({status: "Deleted."});
})

module.exports = router;