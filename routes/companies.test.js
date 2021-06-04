//set DB environment to test
process.env.NODE_ENV = 'test';
// require supertest
const request = require('supertest');
// app imports
const app = require('../app');
const db = require('../db');

let testCompany1;
let testCompany2;

beforeEach(async () => {
    //create a couple of test companies
    let result1 = await db.query(`INSERT INTO companies (code, name, description)
    VALUES ('amazon', 'Amazon', 'The world largest online retailer and cloud computing company.')
    RETURNING *`);
    testCompany1 = result1.rows[0];

    let result2 = await db.query(`INSERT INTO companies (code, name, description)
    VALUES ('microsoft', 'Microsoft', 'The Windows OS computer company.')
    RETURNING *`);
    testCompany2 = result2.rows[0];
});

afterEach(async () => {
    //delete test data from the DB
    await db.query('DELETE FROM companies');
});

afterAll(async () => {
    //close db connection
    await db.end();
});

describe('GET /companies', () => {

    test('Returns all companies', async () => {
        const res = await request(app).get('/companies');
        expect(res.statusCode).toEqual(200);
        expect(res.body.companies).toEqual([{code: 'amazon', name: 'Amazon'}, 
            {code: 'microsoft', name: 'Microsoft'}
        ]);
    });
});

describe('GET /companies/code', () => {

    test('Returns company with matching company code.', async () => {
        const res = await request(app).get(`/companies/${testCompany1.code}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body.company.name).toEqual('Amazon');
    });
    
    test('Returns 404 for company code that does not exist.', async () => {
        const res = await request(app).get(`/companies/0`);
        expect(res.statusCode).toEqual(404);
    });
});

describe('POST /companies', () => {

    test('Creates a new company.', async () => {
        const res = await request(app)
        .post('/companies')
        .send({"name": "IBM", "description": "That other computer company."});

        expect(res.statusCode).toEqual(201);
        expect(res.body).toEqual({ company: {
            code: 'ibm',
            name: 'IBM',
            description: 'That other computer company.'}
        });
    });
});

describe('PUT /companies/code', () => {

    test('Updates an existing company.', async () => {
        const res = await request(app)
        .put(`/companies/${testCompany2.code}`)
        .send({"name": "Microsoft", "description": "Windows Computers!!"});

        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({ company: {
            code: 'microsoft',
            name: 'Microsoft',
            description: 'Windows Computers!!'}
        });
    });

    test('Returns 404 if the company code does not exist.', async () => {
        const res = await request(app)
        .put(`/companies/0`)
        .send({"name": "Microsoft", "description": "Windows Computers!!"});
        expect(res.statusCode).toEqual(404);
    });
});

describe('DELETE /companies/code', () => {

    test('Deletes an existing company.', async () => {
        const res = await request(app)
        .delete(`/companies/${testCompany1.code}`)

        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({ status: 'Amazon deleted.' });
    });

    test('Returns 404 if the company code does not exist.', async () => {
        const res = await request(app)
        .delete(`/companies/0`)
        expect(res.statusCode).toEqual(404);
    });
});