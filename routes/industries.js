/** BizTime Industries Routes */

const express = require('express');
const ExpressError = require('../expressError')
const router = new express.Router();
const db = require('../db');
const app = require('../app');

/** GET /industries
 * Returns list of industries and associated company codes for that industry
 * like {industries: [{industry, companies: [code, code...]}...]} 
 */

router.get('/', async (req, res, next) => {
    try {
        const result = await db.query(`SELECT i.industry, c.code FROM industries AS i
        LEFT JOIN company_industry AS ci ON i.code = ci.ind_code
        LEFT JOIN companies AS c ON c.code = ci.comp_code;`);
        return res.json({ industries: result.rows });
    } catch (e) {
        return next(e)
    }
});

/** POST /industries
 * Creates a new industry.
 * Returns { industry: { code, industry }}
 */

router.post('/', async (req, res, next) => {
    try {
        const result = await db.query(`INSERT INTO industries (code, industry)
        VALUES ($1, $2)
        RETURNING code, industry`, [req.body.code, req.body.industry]);
        return res.status(201).json({ industry: result.rows[0] })
    } catch (e) {
        return next(e)
    }
});

/** POST /industries/:code
 * Associate an industry with a company. The parameter is the industry code, 
 * and the required body { "code": code } is the company code.
 * Returns { company_industry: { ind_code, comp_code } }
 * If the company code or industry code don't exist return 404.
 */

router.post('/:code', async (req, res, next) => {
    try {
        const industry = await db.query('SELECT * FROM industries WHERE code=$1', [req.params.code]);
        if (industry.rows.length === 0) {
            throw new ExpressError(`Industry code (${req.params.code} does not exist!)`, 404);
        }
        const company = await db.query('SELECT * FROM companies WHERE code=$1', [req.body.code]);
        if (company.rows.length === 0) {
            throw new ExpressError(`Company code (${req.body.code} does not exist!)`, 404);
        }
        const result = await db.query(`INSERT INTO company_industry (ind_code, comp_code)
        VALUES ($1, $2)
        RETURNING ind_code, comp_code`, [req.params.code, req.body.code]);
        return res.status(201).json({ company_industry: result.rows[0] })
    } catch (e) {
        return next(e)
    }
});

module.exports = router;