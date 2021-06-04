\c biztime

DROP TABLE IF EXISTS company_industry;
DROP TABLE IF EXISTS industries;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS companies;

CREATE TABLE companies (
    code text PRIMARY KEY,
    name text NOT NULL UNIQUE,
    description text
);

CREATE TABLE invoices (
    id serial PRIMARY KEY,
    comp_code text NOT NULL REFERENCES companies ON DELETE CASCADE,
    amt float NOT NULL,
    paid boolean DEFAULT false NOT NULL,
    add_date date DEFAULT CURRENT_DATE NOT NULL,
    paid_date date,
    CONSTRAINT invoices_amt_check CHECK ((amt > (0)::double precision))
);

CREATE TABLE industries (
  code text PRIMARY KEY,
  industry text NOT NULL UNIQUE
);

CREATE TABLE company_industry (
  id serial PRIMARY KEY,
  ind_code text NOT NULL REFERENCES industries,
  comp_code text NOT NULL REFERENCES companies
);

INSERT INTO companies
  VALUES ('apple', 'Apple Computer', 'Maker of OSX.'),
         ('ibm', 'IBM', 'Big blue.');

INSERT INTO invoices (comp_Code, amt, paid, paid_date)
  VALUES ('apple', 100, false, null),
         ('apple', 200, false, null),
         ('apple', 300, true, '2018-01-01'),
         ('ibm', 400, false, null);

INSERT INTO industries (code, industry)
  VALUES ('tech', 'Technology'),
         ('acct', 'Accounting'),
         ('ret', 'Retail'),
         ('data', 'Data'),
         ('hum', 'Humanitarian');

INSERT INTO company_industry (ind_code, comp_code)
  VALUES ('tech', 'ibm'),
         ('tech', 'apple'),
         ('data', 'ibm'),
         ('data', 'apple'),
         ('ret', 'apple'),
         ('acct', 'ibm');

SELECT i.industry, c.code FROM industries AS i
JOIN company_industry AS ci ON i.code = ci.ind_code
JOIN companies AS c ON c.code = ci.comp_code;