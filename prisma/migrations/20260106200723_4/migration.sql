-- AlterTable
ALTER TABLE "Conversation" ALTER COLUMN "candidateId" DROP NOT NULL,
ALTER COLUMN "agentId" DROP NOT NULL,
ALTER COLUMN "supervisorId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Message" ALTER COLUMN "conversationId" DROP NOT NULL,
ALTER COLUMN "agentId" DROP NOT NULL,
ALTER COLUMN "supervisorId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "supervisorId" DROP NOT NULL;
