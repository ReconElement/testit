import express from 'express';
import * as z from 'zod';
import prisma from '../lib/prisma.js';
import bcrypt from 'bcrypt';
import { UserType } from '../../generated/prisma/enums.js';
import { Status } from '../../generated/prisma/enums.js';
import jwt from 'jsonwebtoken';
const auth = express.Router();
import dotenv from 'dotenv';
dotenv.config();

//supervisor id required only if role is agent
const zodSignupValidation = z.object({
    name: z.string(),
    email: z.email(),
    password: z.string(),
    role: z.literal(["admin","supervisor","candidate"]),
});

const zodSignupValidationForAgent = z.object({
    name: z.string(),
    email: z.email(),
    password: z.string(),
    role: z.literal([
        "agent"
    ]),
    supervisorId: z.string()
});
const loginZodValidation = z.object({
    email: z.string(),
    password: z.string()
})
auth.post("/signup", async (req: express.Request, res: express.Response)=>{
    try {
        const userGiver = (role: string) => {
            switch (role) {
                case 'admin':
                    return UserType.admin
                case 'agent':
                    return UserType.agent
                case 'supervisor':
                    return UserType.supervisor
                case 'candidate':
                    return UserType.candidate
                default:
                    return UserType.candidate
            }
        };
        const statusGiver = (status: string) => {
            switch (status) {
                case 'open':
                    return Status.open
                case 'assigned':
                    return Status.assigned
                case 'closed':
                    return Status.closed
                default:
                    return Status.closed
            }
        }
        const isAgent = zodSignupValidationForAgent.safeParse(req.body);
        const isNotAgent = zodSignupValidation.safeParse(req.body);

        if (isNotAgent.success) {
            const { name, email, password, role } = isNotAgent.data;
            const hashPassword = await bcrypt.hash(password, 10);
            const addToDB = await prisma.user.create({
                data: {
                    name: name,
                    email: email,
                    password: hashPassword,
                    // role: userGiver(role),
                    role: userGiver(role),
                    supervisorId: ""
                }
            });
            if (addToDB) {
                res.status(201).json({
                    success: true,
                    data: {
                        _id: addToDB.id,
                        name: addToDB.name,
                        email: addToDB.email,
                        role: addToDB.role
                    }
                })
            }else{
                res.status(404).json({
                    success: false,
                    error: "Please try again. Login unsuccessful"
                })
            };
        };
        if (isAgent.success) {
            const { name, email, password, role, supervisorId } = isAgent.data;
            const hashPassword = await bcrypt.hash(password, 10);
            const addToDB = await prisma.user.create({
                data: {
                    name: name,
                    email: email,
                    password: hashPassword,
                    role: UserType.agent,
                    supervisorId: supervisorId
                }
            });
            if (addToDB) {
                res.status(201).json({
                    success: true,
                    data: {
                        _id: addToDB.id,
                        name: addToDB.name,
                        email: addToDB.email,
                        role: addToDB.role
                    }
                })
            }else{
                res.status(404).json({
                    success: false,
                    error: "Please try again. Login unsuccessful"
                })
            };
        }
        if(!isNotAgent.success && !isAgent.success){
            res.status(404).json({
                success: false,
                error: "Error occurred during API validation, please try again with valid parameters"
            })
        }
    } catch (e) {
        res.status(500).json({
            success: false,
            data: "Internal Server Error"
        })
    }
});

auth.post("/login",async (req: express.Request, res: express.Response)=>{
    try{
        const body = loginZodValidation.safeParse(req.body);
        if(!body.success){
            res.status(404).json({
                success: false,
                error: "Error occurred during API validation, please try again with valid parameters"
            });
            return;
        }
        const {email, password} = loginZodValidation.parse(req.body);
        const user = await prisma.user.findUnique({
            where: {
                email: email
            }
        });
        if(!user){
            res.status(404).json({
                success: false,
                error: "User not found with the provided credentials"
            });
            return;
        };
        if(user){
            const match = await bcrypt.compare(password, user.password);
            if(!match){
                res.status(401).json({
                    success: false,
                    error: "Unauthorized access, please provide the correct password"
                });
                return;
            }
            else{
                const token = jwt.sign({userId: user.id, role: user.role}, process.env.SECRET_KEY, {expiresIn: "1hr"});
                res.setHeader("Authorization", `Bearer ${token}`);
                res.status(200).json({
                    success: true,
                    data: {
                        token: token
                    }
                });
                return;
            }
        }
    }catch(e){
        res.status(500).json({
            success: false,
            error: "Internal Server Error"
        });
        console.log(`Error during login: ${e}`);
        return;
    }
});

auth.get("/me", async (req: express.Request, res: express.Response)=>{
    try{
        const requestAuthHeader = req.get("Authorization");
        if(requestAuthHeader){
            let bearer = requestAuthHeader.split(' ')[1];
            if(bearer){
                let verify = jwt.verify(bearer, process.env.SECRET_KEY);
                if(typeof verify==='object'){
                    const {userId, role} = verify;
                    const user = await prisma.user.findUnique({
                        where: {id: userId}
                    });
                    if(user){
                        res.status(200).json({
                            success: true,
                            data: {
                                _id: user.id,
                                name: user.name,
                                email: user.email,
                                role: user.role,
                            }
                        })
                    }else{
                        res.status(404).json({
                            success: false,
                            error: "User is deleted"
                        })
                    }
                }else{
                    res.status(404).json({
                        success: false,
                        error: "Send the jwt bearer token in correct format"
                    })
                }
            }
        }else{
            res.status(404).json({
                success: false,
                error: "Auth header not present in request, please make sure to include it"
            })
        }
    }catch(e){
        console.log(`Error occurred: ${e}`);
    }
})

export default auth;