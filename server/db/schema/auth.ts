import { pgTable, text, timestamp, uuid, varchar, json, index } from "drizzle-orm/pg-core";

/**
 * Basic auth users.
 *
 * Note: For `uuid().defaultRandom()` to work in Postgres, ensure a UUID generator is available
 * (typically via `pgcrypto` providing `gen_random_uuid()` or equivalent).
 */
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Session table compatible with express-session + connect-pg-simple.
 *
 * connect-pg-simple defaults:
 * - table name: `session`
 * - sid: primary key
 * - sess: json
 * - expire: timestamp
 */
export const sessions = pgTable(
  "session",
  {
    sid: varchar("sid", { length: 255 }).primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (t) => ({
    expireIdx: index("IDX_session_expire").on(t.expire),
  })
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
