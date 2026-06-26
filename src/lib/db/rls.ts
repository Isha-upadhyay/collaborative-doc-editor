import { Prisma } from '@prisma/client'
import prisma from './client'

/**
 * Run a set of queries inside a transaction with the current user's id bound to the
 * Postgres session variable `app.current_user_id`. Row-Level-Security policies
 * (see prisma/migrations/0001_rls/migration.sql) read this variable to enforce
 * tenant isolation at the database layer — defence-in-depth on top of the
 * application-level authorization guards.
 *
 * SECURITY: `userId` is bound as a *parameter* via `set_config(...)`, NOT string
 * interpolation, so it is immune to SQL injection regardless of its contents.
 */
export async function withRLS<T>(
  userId: string,
  callback: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    // set_config(name, value, is_local=true) is fully parameterizable and scoped
    // to the current transaction — the safe equivalent of `SET LOCAL`.
    await tx.$executeRaw`SELECT set_config('app.current_user_id', ${userId}, true)`
    return callback(tx)
  })
}
