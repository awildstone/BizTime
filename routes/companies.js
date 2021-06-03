/** BizTime Companies Routes */

const express = require('express');
const ExpressError = require('../expressError')
const router = new express.Router();
const db = require('../db');
const app = require('../app');

/** GET /companies 
 * Returns list of companies, like {companies: [{code, name}, ...]}
*/

router.get('/', async function(req, res, next) {
    try {
        const response = await db.query('SELECT code, name FROM companies');
        return res.json({ companies: response.rows })
    } catch (e) {
        return next(e)
    }
});

/** GET /companies/[code] 
 * Return obj of company: {company: {code, name, description, invoices: [id, ...]}}
 * If the company given cannot be found, this should return a 404 status response.
*/

router.get('/:code', async function(req, res, next) {
    try {
        const companyRes = await db.query('SELECT * FROM companies WHERE code=$1', [req.params.code]);
        const invoiceRes = await db.query('SELECT * FROM invoices WHERE comp_code=$1', [req.params.code])
        // if the company code doesn't exist throw an error.
        if (companyRes.rows.length === 0) {
            throw new ExpressError(`${req.params.code} does't exist!`, 404)
        }
        let company = companyRes.rows[0];
        let invoices = invoiceRes.rows;
        company.invoices = invoices.map(invoice => invoice.id) ;
        return res.json({ company: company })
    } catch (e) {
        return next(e)
    }
});

/** POST /companies 
 * Adds a company.
 * Needs to be given JSON like: {code, name, description}
 * Returns obj of new company: {company: {code, name, description}}
*/

router.post('/', async function(req, res, next) {
    try {
        const response = await db.query(`INSERT INTO companies (code, name, description) 
        VALUES ($1, $2, $3)
        RETURNING *`, [req.body.code, req.body.name, req.body.description]);
        return res.status(201).json({ company: response.rows[0] })
    } catch (e) {
        return next(e)
    }
});

/** PUT /companies/[code] 
 * Edit existing company.
 * Should return 404 if company cannot be found.
 * Needs to be given JSON like: {name, description}
 * Returns update company object: {company: {code, name, description}}
*/

router.put('/:code', async function(req, res, next) {
    try {
        const response = await db.query(`UPDATE companies
        SET name=$1, description=$2
        WHERE code=$3
        RETURNING *`, [req.body.name, req.body.description, req.params.code]);
        // if the company code doesn't exist throw an error.
        if (response.rows.length === 0) {
            throw new ExpressError(`${req.params.code} does't exist!`, 404);
        }
        return res.json({ company: response.rows[0] })
    } catch(e) {
        return next(e)
    }
});

/** DELETE /companies/[code] 
 * Deletes company.
 * Should return 404 if company cannot be found.
 * Returns {status: "deleted"}
*/

router.delete('/:code', async function(req, res, next) {
    try {
        const result = await db.query(`DELETE FROM companies
        WHERE code=$1 
        RETURNING code`, [req.params.code]);
        // if the company code doesn't exist throw an error.
        if (result.rows.length === 0) {
            throw new ExpressError(`${req.params.code} does't exist!`, 404);
        }
        return res.json({ status: `${result.rows[0].code} deleted.` })

    } catch (e) {
        return next(e)
    }
});

module.exports = router;