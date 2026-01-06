import express from 'express';
import * as z from 'zod';
import context from '../utils/context.js';
import prisma from '../lib/prisma.js';
import { Status } from '../../generated/prisma/enums.js';
const conversations = express.Router();

const conversationPostValidation = z.object({
    supervisorId: z.string(),
})

type Context = {
    userId: string,
    role: string
}

conversations.post("/post", async (req: express.Request, res: express.Response) => {
    try {
        const { userId, role } = context(req) as Context;
        const parsed = conversationPostValidation.safeParse(req);
        if (parsed.success) {
            const { supervisorId } = parsed.data;
            const convoAddedToDb = await prisma.conversation.create({
                data: {
                    supervisorId: supervisorId,
                    status: Status.open
                }
            });
            if (convoAddedToDb) {
                res.status(201).json({
                    success: true,
                    data: {
                        _id: convoAddedToDb.id,
                        status: convoAddedToDb.status,
                        supervisorId: convoAddedToDb.supervisorId
                    }
                })
            }
        } else {
            console.log(parsed);
            res.status(404).json({
                success: false,
                error: "API validation failed, provide again with precise format"
            })
        }
    } catch (e) {
        res.status(500).json({
            success: false,
            error: "Internal Server Error"
        })
    }
});

export default conversations;
