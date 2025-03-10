import request from 'supertest';
import { describe, expect, test } from 'vitest';

import { app } from '../app.js';
import knex from '../db/db.js';

describe('userCreate function', () => {
    describe('test request validation', () => {
        test.each([
            [
                'should return all errors with bad request',
                {
                    email: 'email',
                    firstName: '',
                    lastName: '',
                    password: '',
                },
                [
                    'Invalid email address',
                    'First name cannot be empty',
                    'Last name cannot be empty',
                    'Password cannot be empty',
                ],
            ],
            [
                'with only email correct',
                { email: 'e@mail.com' },
                ['First name cannot be empty', 'Last name cannot be empty', 'Password cannot be empty'],
            ],
            [
                'with only first name correct',
                { firstName: 'First Name' },
                ['Invalid email address', 'Last name cannot be empty', 'Password cannot be empty'],
            ],
            [
                'with only last name correct',
                { lastName: 'Last Name' },
                ['Invalid email address', 'First name cannot be empty', 'Password cannot be empty'],
            ],
            [
                'with only password correct',
                { password: 'password' },
                ['Invalid email address', 'First name cannot be empty', 'Last name cannot be empty'],
            ],
        ])('%s', async (_, reqBody, errorList) => {
            const res = await request(app).post('/api/v1/user').send(reqBody);
            expect(res.status).toBe(400);
            expect(res.body).toEqual({
                errors: errorList,
            });
        });
    });

    describe('test user inserts', () => {
        test('successful insert', async () => {
            const reqBody = {
                email: 'e@mail.com',
                firstName: 'First Name',
                lastName: 'Last Name',
                password: 'password',
            };
            const resBody = { message: "User 'e@mail.com' created successfully" };

            const res = await request(app).post('/api/v1/user').send(reqBody);
            expect(res.status).toBe(201);
            expect(res.body).toEqual(resBody);
            const userRows = await knex('users').where({
                email: reqBody.email,
                first_name: reqBody.firstName,
                last_name: reqBody.lastName,
            });
            expect(userRows.length).toBe(1);
            const walletRows = await knex('wallets').where({
                fk_user_id: userRows[0].id,
            });
            expect(walletRows.length).toBe(1);
        });

        test('duplicate insert', async () => {
            const reqBody = {
                email: 'e@mail.com',
                firstName: 'Diff First Name',
                lastName: 'Diff Last Name',
                password: 'Diff password',
            };
            const resBody = { error: 'Email already exists' };

            const res = await request(app).post('/api/v1/user').send(reqBody);
            expect(res.status).toBe(400);
            expect(res.body).toEqual(resBody);
            const userRows = await knex('users')
                .where({
                    email: reqBody.email,
                    first_name: reqBody.firstName,
                    last_name: reqBody.lastName,
                })
                .select('id');
            expect(userRows.length).toBe(0);
        });

        test('non-email duplicates', async () => {
            const reqBody = {
                email: 'e2@mail.com',
                firstName: 'First Name',
                lastName: 'Last Name',
                password: 'password',
            };
            const resBody = { message: "User 'e2@mail.com' created successfully" };

            const res = await request(app).post('/api/v1/user').send(reqBody);
            expect(res.status).toBe(201);
            expect(res.body).toEqual(resBody);
            const userRows = await knex('users')
                .where({
                    email: reqBody.email,
                    first_name: reqBody.firstName,
                    last_name: reqBody.lastName,
                })
                .select('id');
            expect(userRows.length).toBe(1);
            const walletRows = await knex('wallets').where({
                fk_user_id: userRows[0].id,
            });
            expect(walletRows.length).toBe(1);
        });
    });
});
