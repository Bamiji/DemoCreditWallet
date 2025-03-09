import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, test } from 'vitest';

import knex from '../../db/db.js';
import { app } from '../app.js';

describe('walletDeposit function', () => {
    const endpoint = '/api/v1/wallet/deposit';
    const loginEndpoint = '/api/v1/user/login';

    test.each([{}, { authorization: '' }, { authorization: 'wrong' }])(
        "confirm it's a protected endpoint: %s",
        async (authObj) => {
            const res = await request(app).post(endpoint).set(authObj);

            expect(res.status).toBe(401);
            expect(res.body).toEqual({ error: 'Unauthorized' });
        },
    );

    test('nonexistent user', async () => {
        const seedUser = { email: 'notaseed@mail.com' };
        const reqBody = {
            amount: '1000',
        };
        const resBody = { error: 'Invalid credentials' };

        const res = await request(app)
            .post(endpoint)
            .set({ authorization: jwt.sign({ email: seedUser.email }, process.env.TOKEN_SECRET) })
            .send(reqBody);

        expect(res.status).toBe(401);
        expect(res.body).toEqual(resBody);
    });

    test.each([{}, { amount: '0' }, { amount: 'english' }, { amount: '-1' }, { amount: '' }])(
        'invalid amount: %s',
        async (amountObj) => {
            const seedUser = { email: 'seed@mail.com', id: 1, password: 'password' };
            const loginRes = await request(app).post(loginEndpoint).send(seedUser);
            const token = loginRes.body.token;

            const reqBody = amountObj;
            const resBody = { errors: ['Invalid amount'] };

            const res = await request(app).post(endpoint).set({ authorization: token }).send(reqBody);

            expect(res.status).toBe(400);
            expect(res.body).toEqual(resBody);
        },
    );

    test('successful deposit', async () => {
        const seedUser = { email: 'seed@mail.com', id: 1, password: 'password' };
        const loginRes = await request(app).post(loginEndpoint).send(seedUser);
        const token = loginRes.body.token;

        const reqBody = {
            amount: '1000',
        };
        const resBody = { message: 'Deposited successfully' };

        let wallet = await knex('wallets')
            .where({
                fk_user_id: seedUser.id,
            })
            .select('balance')
            .first();
        expect(wallet.balance).toBe('0.0000');

        const res = await request(app).post(endpoint).set({ authorization: token }).send(reqBody);

        expect(res.status).toBe(200);
        expect(res.body).toEqual(resBody);

        wallet = await knex('wallets')
            .where({
                fk_user_id: seedUser.id,
            })
            .select('balance')
            .first();
        expect(wallet.balance).toBe('1000.0000');
    });

    test('excessive deposit', async () => {
        const seedUser = { email: 'seed@mail.com', password: 'password' };
        const loginRes = await request(app).post(loginEndpoint).send(seedUser);
        const token = loginRes.body.token;

        const reqBody = {
            amount: '9999999999999999.9999',
        };
        const resBody = { error: 'Deposit would exceed account limit' };

        const res = await request(app).post(endpoint).set({ authorization: token }).send(reqBody);

        expect(res.status).toBe(400);
        expect(res.body).toEqual(resBody);
    });
});

describe('walletWithdraw function', () => {
    const endpoint = '/api/v1/wallet/withdraw';
    const loginEndpoint = '/api/v1/user/login';

    test.each([{}, { authorization: '' }, { authorization: 'wrong' }])(
        "confirm it's a protected endpoint: %s",
        async (authObj) => {
            const res = await request(app).post(endpoint).set(authObj);

            expect(res.status).toBe(401);
            expect(res.body).toEqual({ error: 'Unauthorized' });
        },
    );

    test('nonexistent user', async () => {
        const seedUser = { email: 'notaseed@mail.com' };
        const reqBody = {
            amount: '1000',
        };
        const resBody = { error: 'Invalid credentials' };

        const res = await request(app)
            .post(endpoint)
            .set({ authorization: jwt.sign({ email: seedUser.email }, process.env.TOKEN_SECRET) })
            .send(reqBody);

        expect(res.status).toBe(401);
        expect(res.body).toEqual(resBody);
    });

    test.each([{}, { amount: '0' }, { amount: 'english' }, { amount: '-1' }, { amount: '' }])(
        'invalid amount: %s',
        async (amountObj) => {
            const seedUser = { email: 'seed@mail.com', id: 1, password: 'password' };
            const loginRes = await request(app).post(loginEndpoint).send(seedUser);
            const token = loginRes.body.token;

            const reqBody = amountObj;
            const resBody = { errors: ['Invalid amount'] };

            const res = await request(app).post(endpoint).set({ authorization: token }).send(reqBody);

            expect(res.status).toBe(400);
            expect(res.body).toEqual(resBody);
        },
    );

    test('successful withdrawal', async () => {
        const seedUser = { email: 'seed2@mail.com', id: 2, password: 'password2' };
        const loginRes = await request(app).post(loginEndpoint).send(seedUser);
        const token = loginRes.body.token;

        const reqBody = {
            amount: '10000',
        };
        const resBody = { message: 'Withdrawn successfully' };

        let wallet = await knex('wallets')
            .where({
                fk_user_id: seedUser.id,
            })
            .select('balance')
            .first();
        expect(wallet.balance).toBe('100000.0000');

        const res = await request(app).post(endpoint).set({ authorization: token }).send(reqBody);

        expect(res.status).toBe(200);
        expect(res.body).toEqual(resBody);

        wallet = await knex('wallets')
            .where({
                fk_user_id: seedUser.id,
            })
            .select('balance')
            .first();
        expect(wallet.balance).toBe('90000.0000');
    });

    test('insufficient balance', async () => {
        const seedUser = { email: 'seed2@mail.com', password: 'password2' };
        const loginRes = await request(app).post(loginEndpoint).send(seedUser);
        const token = loginRes.body.token;

        const reqBody = {
            amount: '999999999999999.9999',
        };
        const resBody = { error: 'Insufficient balance for withdrawal' };

        const res = await request(app).post(endpoint).set({ authorization: token }).send(reqBody);

        expect(res.status).toBe(400);
        expect(res.body).toEqual(resBody);
    });
});

describe('walletGet function', () => {
    const endpoint = '/api/v1/wallet';
    const loginEndpoint = '/api/v1/user/login';

    test.each([{}, { authorization: '' }, { authorization: 'wrong' }])(
        "confirm it's a protected endpoint: %s",
        async (authObj) => {
            const res = await request(app).get(endpoint).set(authObj);

            expect(res.status).toBe(401);
            expect(res.body).toEqual({ error: 'Unauthorized' });
        },
    );

    test('nonexistent user', async () => {
        const seedUser = { email: 'notaseed@mail.com' };
        const resBody = { error: 'Invalid credentials' };

        const res = await request(app)
            .get(endpoint)
            .set({ authorization: jwt.sign({ email: seedUser.email }, process.env.TOKEN_SECRET) });

        expect(res.status).toBe(401);
        expect(res.body).toEqual(resBody);
    });

    test('accurate checks', async () => {
        const seedUsers = [
            { email: 'seed@mail.com', id: 1, password: 'password' },
            { email: 'seed2@mail.com', id: 2, password: 'password2' },
        ];

        const balances = [];
        for (const seedUser of seedUsers) {
            const loginRes = await request(app).post(loginEndpoint).send(seedUser);
            const token = loginRes.body.token;

            let balance = await knex('wallets')
                .where({
                    fk_user_id: seedUser.id,
                })
                .first('balance');

            balance = Number(balance.balance).toFixed(2);
            balances.push(balance);

            const resBody = { balance };

            const res = await request(app).get(endpoint).set({ authorization: token });

            expect(res.status).toBe(200);
            expect(res.body).toEqual(resBody);
        }
        expect(balances[0]).not.toBe(balances[1]);
    });
});

describe('walletTransfer function', () => {
    const endpoint = '/api/v1/wallet/transfer';
    const loginEndpoint = '/api/v1/user/login';

    test.each([{}, { authorization: '' }, { authorization: 'wrong' }])(
        "confirm it's a protected endpoint: %s",
        async (authObj) => {
            const res = await request(app).post(endpoint).set(authObj);

            expect(res.status).toBe(401);
            expect(res.body).toEqual({ error: 'Unauthorized' });
        },
    );

    test('nonexistent user', async () => {
        const seedUser = { email: 'notaseed@mail.com' };
        const reqBody = {
            amount: '1000',
            recipientEmail: 'recipient@emai.com',
        };
        const resBody = { error: 'Invalid credentials' };

        const res = await request(app)
            .post(endpoint)
            .set({ authorization: jwt.sign({ email: seedUser.email }, process.env.TOKEN_SECRET) })
            .send(reqBody);

        expect(res.status).toBe(401);
        expect(res.body).toEqual(resBody);
    });

    test.each([
        [{}, ['Invalid amount', 'Invalid recipient email address']],
        [{ amount: '0' }, ['Invalid amount', 'Invalid recipient email address']],
        [{ amount: 'english' }, ['Invalid amount', 'Invalid recipient email address']],
        [{ amount: '-1' }, ['Invalid amount', 'Invalid recipient email address']],
        [{ amount: '' }, ['Invalid amount', 'Invalid recipient email address']],
        [{ amount: '9.0', recipientEmail: '' }, ['Invalid recipient email address']],
        [{ amount: '9.0', recipientEmail: 'rmail' }, ['Invalid recipient email address']],
    ])('invalid transfer: %s', async (transferObj, errorList) => {
        const seedUser = { email: 'seed@mail.com', id: 1, password: 'password' };
        const loginRes = await request(app).post(loginEndpoint).send(seedUser);
        const token = loginRes.body.token;

        const reqBody = transferObj;
        const resBody = { errors: errorList };

        const res = await request(app).post(endpoint).set({ authorization: token }).send(reqBody);

        expect(res.status).toBe(400);
        expect(res.body).toEqual(resBody);
    });

    test('successful transfer', async () => {
        const seedSendingUser = { email: 'seed3@mail.com', id: 3, password: 'password3' };
        const seedReceivingUser = { email: 'seed4@mail.com', id: 4 };
        const loginRes = await request(app).post(loginEndpoint).send(seedSendingUser);
        const token = loginRes.body.token;

        let wallet = await knex('wallets')
            .where({
                fk_user_id: seedSendingUser.id,
            })
            .select('balance')
            .first();
        expect(wallet.balance).toBe('500000000000000.0000');

        // test transfer to same user
        let res = await request(app).post(endpoint).set({ authorization: token }).send({
            amount: '1',
            recipientEmail: seedSendingUser.email,
        });

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'Cannot transfer to the same user' });

        // test transfer to nonexistent user
        res = await request(app)
            .post(endpoint)
            .set({ authorization: token })
            .send({
                amount: '1',
                recipientEmail: 'not' + seedSendingUser.email,
            });

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'Recipient is not in the system' });

        // test transfer with insufficient funds
        res = await request(app).post(endpoint).set({ authorization: token }).send({
            amount: '500000000000001',
            recipientEmail: seedReceivingUser.email,
        });

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'Insufficient balance for transfer' });

        // test transfer that would exceed account limit
        res = await request(app).post(endpoint).set({ authorization: token }).send({
            amount: '500000000000000',
            recipientEmail: seedReceivingUser.email,
        });

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: "Transfer would exceed recipient's account limit" });

        // test successful transfer
        res = await request(app).post(endpoint).set({ authorization: token }).send({
            amount: '499999999999999',
            recipientEmail: seedReceivingUser.email,
        });

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ message: 'Transfer successful' });

        wallet = await knex('wallets')
            .where({
                fk_user_id: seedSendingUser.id,
            })
            .select('balance')
            .first();
        expect(wallet.balance).toBe('1.0000');

        wallet = await knex('wallets')
            .where({
                fk_user_id: seedReceivingUser.id,
            })
            .select('balance')
            .first();
        expect(wallet.balance).toBe('999999999999999.0000');
    });
});
