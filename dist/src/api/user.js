import bcrypt from 'bcryptjs';
import { checkSchema, validationResult } from 'express-validator';
import knex from '../../db/db.js';
const newUserSchema = {
    email: { errorMessage: 'Invalid email address', isEmail: true },
    firstName: { errorMessage: 'First name cannot be empty', notEmpty: true },
    lastName: { errorMessage: 'Last name cannot be empty', notEmpty: true },
    password: { errorMessage: 'Password cannot be empty', notEmpty: true },
};
export async function userCreate(req, res) {
    try {
        await checkSchema(newUserSchema).run(req);
        const errors = validationResult(req);
        // Body Validation
        if (!errors.isEmpty()) {
            const errorList = [];
            for (const error of errors.errors) {
                errorList.push(error.msg);
            }
            res.status(400).json({ errors: errorList });
            return;
        }
        // Database Insert
        try {
            await knex('users').insert([
                {
                    email: req.body.email,
                    first_name: req.body.firstName,
                    last_name: req.body.lastName,
                    password_hash: await bcrypt.hash(req.body.password, 10),
                },
            ]);
        }
        catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                res.status(400).json({ error: 'Email already exists' });
                return;
            }
            throw error;
        }
        res.status(201).json({ message: `User '${req.body.email}' created successfully` });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}
