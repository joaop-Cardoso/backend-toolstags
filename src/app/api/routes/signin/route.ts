import prisma from "@/lib/prisma";
import { error } from "console"
import { NextRequest, NextResponse } from "next/server"
import crypto from 'crypto';
import { padronizedHash } from "../../util/hash";


const createData = async (data: any) => {
    const saltedHashedPassword = passwordEncrypt(data.password);

    const fullData = await prisma.user.create({data:{
        email:data.email,
        salt:saltedHashedPassword.salt,
        hashedPassword:saltedHashedPassword.hashedPassword
    } })

    return fullData;
}

const passwordEncrypt = (password: string) => {
    const salt = crypto.randomBytes(16).toString('hex'); // Gera um salt
    const hashedPassword = padronizedHash(password, salt)
    
    return { salt, hashedPassword }; // Retorna hash e salt
};

export async function POST(request: NextRequest){
    try{
        const body = await request.json(); // ao inves de request.body pq o nextjs precisa saber de forma explícita que o tipo de data será do tipo Json, já que existem outros formatos de requisição
        //verificaçao zod
        const data = await createData(body)
        return new NextResponse('User created successfully', { status: 201 });
    }
    catch{
        return error
    }
}
