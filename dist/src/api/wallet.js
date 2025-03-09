import { checkSchema, validationResult } from 'express-validator';
import knex from '../../db/db.js';
const walletDepositSchema = {
    amount: { errorMessage: 'Invalid amount', isFloat: { options: { gt: 0 } } },
};
export async function walletDeposit(req, res) {
    try {
        await checkSchema(walletDepositSchema).run(req);
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
        const amount = Number(req.body.amount).toFixed(4);
        const user = await knex('users')
            .where({
            email: req.user.email,
        })
            .select('id');
        if (user.length === 0) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        const userId = user[0].id;
        try {
            await knex('wallets')
                .where({
                fk_user_id: userId,
            })
                .increment('balance', amount);
        }
        catch (error) {
            if (error.code === 'ER_WARN_DATA_OUT_OF_RANGE') {
                res.status(400).json({ error: 'Deposit would exceed account limit' });
                return;
            }
            throw error;
        }
        res.json({ message: 'Deposited successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
        console.log(error);
    }
}
