-- Per-account persistence of locally-parsed Strava export data.

CREATE TABLE "ImportData" (
    "userId" INTEGER NOT NULL,
    "athlete" TEXT NOT NULL,
    "activities" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportData_pkey" PRIMARY KEY ("userId")
);

ALTER TABLE "ImportData" ADD CONSTRAINT "ImportData_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
