import crypto from 'crypto';

export const padronizedHash = (password:string, salt:string) =>{
    return crypto.pbkdf2Sync(password, salt, 10000, 128, 'sha512').toString('hex'); // Cria o hash
}