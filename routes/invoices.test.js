//set DB environment to test
process.env.NODE_ENV = 'test';
// require supertest
const request = require('supertest');
// app imports
const app = require('../app');
const db = require('../db');

let testCompany1;
let testCompany2;
let invoice1;
let invoice2;

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

    //create some test invoices
    let result3 = await db.query(`INSERT INTO invoices (comp_code, amt)
    VALUES ('amazon', 10000)
    RETURNING *`);
    invoice1 = result3.rows[0];

    let result4 = await db.query(`INSERT INTO invoices (comp_code, amt)
    VALUES ('microsoft', 6000)
    RETURNING *`);
    invoice2 = result4.rows[0];
});

afterEach(async () => {
    //delete test data from the DB
    await db.query('DELETE FROM companies');
    await db.query('DELETE FROM invoices');
});

afterAll(async () => {
    //close db connection
    await db.end();
});

describe('GET /invoices', () => {

    test('Returns all invoices.', async () => {
        const res = await request(app).get('/invoices');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({ invoices: [
            {"id": invoice1.id, "comp_code": invoice1.comp_code},
            {"id": invoice2.id, "comp_code": invoice2.comp_code}
        ]});
    });
});

describe('GET /invoices/id', () => {

    test('Returns invoice with matching id.', async () => {
        const res = await request(app).get(`/invoices/${invoice1.id}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({ invoice: {
            id: invoice1.id,
            amt: invoice1.amt,
            paid: invoice1.paid,
            add_date: invoice1.add_date.toISOString(),
            paid_date: invoice1.paid_date,
            company: {
                code: testCompany1.code,
                name: testCompany1.name,
                description: testCompany1.description }
            }
        });
    });

    test('Returns 404 for invoice that does not exist.', async () => {
        const res = await request(app).get('/invoices/0');
        expect(res.statusCode).toEqual(404);
    });
});

describe('POST /invoices/id', () => {

    test('Creates a new invoice.', async () => {
        const res = await request(app)
        .post('/invoices')
        .send({"comp_code": 'microsoft', "amt": 400});
        expect(res.statusCode).toEqual(201);
        expect(res.body.invoice.comp_code).toEqual('microsoft');
        expect(res.body.invoice.amt).toEqual(400);
        expect(res.body.invoice.paid).toEqual(false);
    });
});

describe('PUT /invoices/id', () => {

    test('Updates an invoice payment by id.', async () => {
        const res = await request(app)
        .put(`/invoices/${invoice1.id}`)
        .send({"amt": 500});
        expect(res.statusCode).toEqual(200);
        expect(res.body.invoice.amt).toEqual(9500);
        expect(res.body.invoice.paid).toEqual(false);
    });

    test('Returns 404 for invoice that does not exist.', async () => {
        const res = await request(app)
        .put('/invoices/0')
        .send({"amt": 500});
        expect(res.statusCode).toEqual(404);
    });

    test('Returns 400 for invalid amt.', async () => {
        const res = await request(app)
        .put(`/invoices/${invoice1.id}`)
        .send({"amt": 'money!!!'});
        expect(res.statusCode).toEqual(400);
    });
});

describe('DELETE /invoices/id', () => {

    test('Deletes an invoice by id.', async () => {
        const res = await request(app).delete(`/invoices/${invoice1.id}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({ status: `Invoice ${invoice1.id} deleted.` });
    });

    test('Returns 404 for invoice id that does not exist.', async () => {
        const res = await request(app).delete('/invoices/0');
        expect(res.statusCode).toEqual(404);
    });
});