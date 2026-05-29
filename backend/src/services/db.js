import { PrismaClient } from "@prisma/client";

const LOG = process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"];
const NEON_SHUTDOWN = /E57P01|terminating connection due to administrator command/;

// Neon's free tier auto-suspends after inactivity and kills open connections (E57P01).
// This proxy intercepts that error on any model call, swaps in a fresh client, and retries once.

let _client = new PrismaClient({ log: LOG });

const MODELS = ["athlete", "athleteToken", "activity", "syncStatus", "goal", "webhookSubscription"];

function wrapModel(modelName) {
  return new Proxy({}, {
    get(_, method) {
      return async (...args) => {
        try {
          return await _client[modelName][method](...args);
        } catch (err) {
          if (NEON_SHUTDOWN.test(err?.message ?? "")) {
            await _client.$disconnect().catch(() => {});
            _client = new PrismaClient({ log: LOG });
            return await _client[modelName][method](...args);
          }
          throw err;
        }
      };
    },
  });
}

const prisma = Object.assign(
  Object.fromEntries(MODELS.map((m) => [m, wrapModel(m)])),
  {
    $connect:     (...a) => _client.$connect(...a),
    $disconnect:  (...a) => _client.$disconnect(...a),
    $transaction: (...a) => _client.$transaction(...a),
    $queryRaw:    (...a) => _client.$queryRaw(...a),
    $executeRaw:  (...a) => _client.$executeRaw(...a),
  }
);

export default prisma;
