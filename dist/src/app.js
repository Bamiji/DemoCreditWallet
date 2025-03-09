import express from 'express';
import { userCreate, userLogin } from './api/user.js';
import { walletDeposit } from './api/wallet.js';
import { verifyJWT } from './middleware/auth.js';
export const app = express();
const port = process.env.PORT ?? '3000';
app.use(express.json());
app.post('/api/v1/user', userCreate);
app.post('/api/v1/user/login', userLogin);
app.post('/api/v1/wallet/deposit', verifyJWT, walletDeposit);
app.post('/api/v1/wallet/deposit', verifyJWT, walletDeposit);
if (process.env.NODE_ENV !== 'test') {
    app.listen(port, () => {
        console.log(`Listening on port ${port}`);
    });
}
