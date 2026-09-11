-- CreateTable
CREATE TABLE "SystemState" (
    "key" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemState_pkey" PRIMARY KEY ("key")
);

-- 结算认领行：epoch 时间戳保证任何环境首次运行即可认领
INSERT INTO "SystemState" ("key", "updatedAt") VALUES ('settlement', '1970-01-01T00:00:00.000Z');
