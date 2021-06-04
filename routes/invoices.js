/** BizTime Invoices Routes */

const express = require('express');
const ExpressError = require('../expressError')
const router = new express.Router();
const db = require('../db');

/** GET /invoices
 * Return info on invoices: like {invoices: [{id, comp_code}, ...]} 
 * */

router.get('/', async function(req, res, next) {
    try {
        const allInvoices = await db.query('SELECT id, comp_code FROM invoices ORDER BY id');
        return res.json({ invoices: allInvoices.rows })
    } catch (e) {
        return next(e)
    }
});

/**  GET /invoices/[id]
 * Returns obj on given invoice.
 * If invoice cannot be found, returns 404.
 * Returns {invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}}}
 * */

router.get('/:id', async function(req, res, next) {
    try {
        const response = await db.query(`SELECT * FROM invoices
        INNER JOIN companies ON invoices.comp_code = companies.code
        WHERE id=$1`, [req.params.id]);
        // if the invoice is not found, throw an error
        if (response.rows.length === 0) {
            throw new ExpressError(`Invoice ${req.params.id} doesn't exist!`, 404);
        }
        //build the invoice from data
        const data = response.rows[0];
        let invoice = {
            id: data.id,
            amt: data.amt,
            paid: data.paid,
            add_date: data.add_date,
            paid_date: data.paid_date,
            company: {
                code: data.code,
                name: data.name,
                description: data.description
            }
        }
        return res.json({ invoice: invoice })
    } catch (e) {
        return next(e)
    }
});

/**  POST /invoices
 * Adds an invoice.
 * Needs to be passed in JSON body of: {comp_code, amt}
 * Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
 * */

router.post('/', async function(req, res, next) {
    try {
        const response = await db.query(`INSERT INTO invoices (comp_code, amt)
        VALUES ($1, $2)
        RETURNING *`, [req.body.comp_code, req.body.amt]);
        return res.status(201).json({ invoice: response.rows[0] })
    } catch (e) {
        return next(e)
    }
});

/**  PUT /invoices/[id]
 * Updates an invoice.
 * If invoice cannot be found, returns a 404.
 * Needs to be passed in a JSON body of {amt}
 * Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
 * */

router.put('/:id', async function(req, res, next) {
    try {
        //make sure valid amt is > 0 and is a number
        if (req.body.amt < 0 || isNaN(req.body.amt)) {
            throw new ExpressError(`${req.body.amt} is not a valid amount!`, 400);
        }
        //get the current invoice amount
        const currAmt = await db.query('SELECT amt FROM invoices WHERE id=$1', [req.params.id]);
        //if the invoice isn't found throw an error
        if (currAmt.rows.length === 0) {
            throw new ExpressError(`Invoice ${req.params.id} doesn't exist!`, 404);
        }
        //get the current date, this will be the new paid_date
        const today = new Date();
        //subtract the current payment from the current invoice amount, this will be the new invoice total
        let newAmt = currAmt.rows[0].amt - req.body.amt;
        //if the invoice still has an amt balance, set paid to false, else paid will be true
        let paid = null;
        newAmt > 0 ? paid = false : paid = true;
        const response = await db.query(`UPDATE invoices
        SET amt=$1, paid=$2, paid_date=$3
        WHERE id=$4
        RETURNING *`, [newAmt, paid, today, req.params.id]);
       return res.json({ invoice: response.rows[0] }) 
    } catch (e) {
        return next(e)
    }
});

/** DELETE /invoices/[id]
 * Deletes an invoice.
 * If invoice cannot be found, returns a 404.
 * Returns: {status: "deleted"}
 * */

router.delete('/:id', async function(req, res, next) {
    try {
        const response = await db.query(`DELETE FROM invoices
        WHERE id=$1
        RETURNING id`, [req.params.id]);
        //if the invoice isn't found throw an error
        if (response.rows.length === 0) {
            throw new ExpressError(`Invoice ${req.params.id} doesn't exist!`, 404);
        }
        res.json({ status: `Invoice ${response.rows[0].id} deleted.` })
    } catch (e) {
        return next(e)
    }
});

module.exports = router;