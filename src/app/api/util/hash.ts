import crypto from 'crypto';

export const padronizedHash = (password:string, salt:string) =>{
    return crypto.pbkdf2Sync(password, salt, 10000, 128, 'sha512').toString('hex'); // Cria o hash
}

/*export const validateEmail = (email: string): boolean => {
    const regex = /^[a-zA-Z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

    if (!regex.test(email)) {
        throw new Error("Invalid email format");
    }

    return true
};*/