import express from 'express';
import { userCreate, userLogin } from './api/user.js';
import { walletDeposit, walletGet, walletWithdraw } from './api/wallet.js';
import { verifyJWT } from './middleware/auth.js';
export const app = express();
const port = process.env.PORT ?? '3000';
app.use(express.json());
app.post('/api/v1/user', userCreate);
app.post('/api/v1/user/login', userLogin);
app.get('/api/v1/wallet', verifyJWT, walletGet);
app.post('/api/v1/wallet/deposit', verifyJWT, walletDeposit);
app.post('/api/v1/wallet/withdraw', verifyJWT, walletWithdraw);
if (process.env.NODE_ENV !== 'test') {
    app.listen(port, () => {
        console.log(`Listening on port ${port}`);
    });
}
