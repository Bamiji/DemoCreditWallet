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

    test.each([{}, { amount: '9,.0' }, { amount: 'english' }, { amount: '-1' }, { amount: '' }])(
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
            amount: '999999999999999.9999',
        };
        const resBody = { error: 'Deposit would exceed account limit' };

        const res = await request(app).post(endpoint).set({ authorization: token }).send(reqBody);

        expect(res.status).toBe(400);
        expect(res.body).toEqual(resBody);
    });
});
