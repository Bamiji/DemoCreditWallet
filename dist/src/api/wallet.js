import { checkSchema, validationResult } from 'express-validator';
import knex from '../../db/db.js';
const walletDepositWithdrawSchema = {
    amount: { errorMessage: 'Invalid amount', isFloat: { options: { gt: 0 } } },
};
const walletTransferSchema = {
    amount: { errorMessage: 'Invalid amount', isFloat: { options: { gt: 0 } } },
    recipientEmail: { errorMessage: 'Invalid recipient email address', isEmail: true },
};
export async function walletDeposit(req, res) {
    try {
        await checkSchema(walletDepositWithdrawSchema).run(req);
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
export async function walletGet(req, res) {
    try {
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
        let balance = await knex('wallets')
            .where({
            fk_user_id: userId,
        })
            .first('balance');
        balance = Number(balance.balance).toFixed(2);
        res.json({ balance });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
        console.log(error);
    }
}
export async function walletTransfer(req, res) {
    try {
        await checkSchema(walletTransferSchema).run(req);
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
        // Gather participating users
        const sendingUser = await knex('users')
            .where({
            email: req.user.email,
        })
            .select('id');
        if (sendingUser.length === 0) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        const sendingUserId = sendingUser[0].id;
        if (req.user.email === req.body.recipientEmail) {
            res.status(400).json({ error: 'Cannot transfer to the same user' });
            return;
        }
        const receivingUser = await knex('users')
            .where({
            email: req.body.recipientEmail,
        })
            .select('id');
        if (receivingUser.length === 0) {
            res.status(400).json({ error: 'Recipient is not in the system' });
            return;
        }
        const receivingUserId = receivingUser[0].id;
        try {
            let succesfulTrx = true;
            await knex.transaction(async (trx) => {
                const withdrawSuccess = await trx('wallets')
                    .where({
                    fk_user_id: sendingUserId,
                })
                    .andWhere('balance', '>=', amount)
                    .decrement('balance', amount);
                if (!withdrawSuccess) {
                    res.status(400).json({ error: 'Insufficient balance for transfer' });
                    succesfulTrx = false;
                    return;
                }
                await trx('wallets')
                    .where({
                    fk_user_id: receivingUserId,
                })
                    .increment('balance', amount);
            });
            if (succesfulTrx) {
                res.json({ message: 'Transfer successful' });
            }
        }
        catch (error) {
            if (error.code === 'ER_WARN_DATA_OUT_OF_RANGE') {
                res.status(400).json({ error: "Transfer would exceed recipient's account limit" });
                return;
            }
            throw error;
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
        console.log(error);
    }
}
export async function walletWithdraw(req, res) {
    try {
        await checkSchema(walletDepositWithdrawSchema).run(req);
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
        const success = await knex('wallets')
            .where({
            fk_user_id: userId,
        })
            .andWhere('balance', '>=', amount)
            .decrement('balance', amount);
        if (success) {
            res.json({ message: 'Withdrawn successfully' });
        }
        else {
            res.status(400).json({ error: 'Insufficient balance for withdrawal' });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
        console.log(error);
    }
}
