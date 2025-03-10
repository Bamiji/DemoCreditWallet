import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import { checkSchema, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

import knex from '../db/db.js';

const newUserSchema = {
    email: { errorMessage: 'Invalid email address', isEmail: true },
    firstName: { errorMessage: 'First name cannot be empty', notEmpty: true },
    lastName: { errorMessage: 'Last name cannot be empty', notEmpty: true },
    password: { errorMessage: 'Password cannot be empty', notEmpty: true },
};

const userLoginSchema = {
    email: { errorMessage: 'Invalid email address', isEmail: true },
    password: { errorMessage: 'Password cannot be empty', notEmpty: true },
};

export async function userCreate(req: Request, res: Response) {
    try {
        await checkSchema(newUserSchema).run(req);
        const errors = validationResult(req);

        // Body Validation
        if (!errors.isEmpty()) {
            const errorList: string[] = [];
            for (const error of errors.array()) {
                errorList.push(error.msg as string);
            }
            res.status(400).json({ errors: errorList });
            return;
        }

        const karmaResponse = await fetch(`https://adjutor.lendsqr.com/v2/verification/karma/${req.body.email}`, {
            headers: {
                Authorization: `Bearer ${process.env.ADJUTOR_TOKEN ?? ''}`,
            },
        });

        const karmaResponseJson = (await karmaResponse.json()) as any;
        const badKarmaStatus = karmaResponseJson.status;
        if (badKarmaStatus.status === 'success') {
            // Disabled because it always returns 'success' for test mode
            //res.status(403).json({ error: 'You have been blacklisted' });
            //return;
        }

        // Database Insert
        try {
            await knex.transaction(async (trx) => {
                const newUserId = await trx('users').insert([
                    {
                        email: req.body.email,
                        first_name: req.body.firstName,
                        last_name: req.body.lastName,
                        password_hash: await bcrypt.hash(req.body.password, 10),
                    },
                ]);

                await trx('wallets').insert([
                    {
                        balance: 0,
                        fk_user_id: newUserId,
                    },
                ]);
            });
        } catch (error: any) {
            if (error.code === 'ER_DUP_ENTRY') {
                res.status(400).json({ error: 'Email already exists' });
                return;
            }
            throw error;
        }

        res.status(201).json({ message: `User '${req.body.email}' created successfully` });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
        console.log(error);
    }
}

export async function userLogin(req: Request, res: Response) {
    try {
        await checkSchema(userLoginSchema).run(req);
        const errors = validationResult(req);

        // Body Validation
        if (!errors.isEmpty()) {
            const errorList: string[] = [];
            for (const error of errors.array()) {
                errorList.push(error.msg as string);
            }
            res.status(400).json({ errors: errorList });
            return;
        }

        const user = await knex('users')
            .where({
                email: req.body.email,
            })
            .select('password_hash');

        if (user.length === 0) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const userPassword = user[0].password_hash;

        const passwordMatch = await bcrypt.compare(req.body.password, userPassword);
        if (!passwordMatch) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const token = jwt.sign({ email: req.body.email }, process.env.TOKEN_SECRET ?? 'test');

        res.status(200).json({ token });
    } catch {
        res.status(500).json({ error: 'Internal server error' });
    }
}
