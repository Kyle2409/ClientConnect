import { sql, relations } from "drizzle-orm";
import { mysqlTable, varchar, text, int, decimal, timestamp, boolean, mysqlEnum } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  role: mysqlEnum("role", ["agent", "admin"]).notNull().default("agent"),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

export const products = mysqlTable("products", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  name: varchar("name", { length: 100 }).notNull().unique(),
  monthlyPrice: decimal("monthly_price", { precision: 10, scale: 2 }).notNull(),
  activationPoints: int("activation_points").notNull(),
  benefits: text("benefits").notNull(), // JSON string array
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const customers = mysqlTable("customers", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  idNumber: varchar("id_number", { length: 20 }).notNull(),
  dateOfBirth: timestamp("date_of_birth").notNull(),
  address: text("address").notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  province: varchar("province", { length: 100 }).notNull(),
  postalCode: varchar("postal_code", { length: 10 }).notNull(),
  bankName: varchar("bank_name", { length: 100 }).notNull(),
  accountNumber: varchar("account_number", { length: 20 }).notNull(),
  accountType: varchar("account_type", { length: 50 }).notNull(),
  branchCode: varchar("branch_code", { length: 10 }).notNull(),
  agentId: varchar("agent_id", { length: 36 }).notNull(),
  productId: varchar("product_id", { length: 36 }).notNull(),
  status: mysqlEnum("status", ["pending", "active", "inactive", "cancelled"]).notNull().default("pending"),
  signupDate: timestamp("signup_date").notNull().default(sql`CURRENT_TIMESTAMP`),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const leads = mysqlTable("leads", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  productInterest: varchar("product_interest", { length: 100 }),
  source: varchar("source", { length: 100 }).notNull().default("website"),
  status: mysqlEnum("status", ["new", "contacted", "converted", "lost"]).notNull().default("new"),
  agentId: varchar("agent_id", { length: 36 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  customers: many(customers),
  leads: many(leads),
}));

export const customersRelations = relations(customers, ({ one }) => ({
  agent: one(users, {
    fields: [customers.agentId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [customers.productId],
    references: [products.id],
  }),
}));

export const leadsRelations = relations(leads, ({ one }) => ({
  agent: one(users, {
    fields: [leads.agentId],
    references: [users.id],
  }),
}));

export const productsRelations = relations(products, ({ many }) => ({
  customers: many(customers),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  signupDate: true,
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Product = typeof products.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
