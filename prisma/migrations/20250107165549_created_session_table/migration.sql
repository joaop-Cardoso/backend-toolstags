-- CreateTable
CREATE TABLE "Session" (
    "id" SERIAL NOT NULL,
    "user" TEXT NOT NULL,
    "AcessToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "ExpirationTime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Session_user_key" ON "Session"("user");
