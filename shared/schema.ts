import { sql, relations } from "drizzle-orm";
import { pgTable, varchar, text, integer, decimal, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const roleEnum = pgEnum("role", ["agent", "admin"]);
export const statusEnum = pgEnum("status", ["pending", "active", "inactive", "cancelled"]);
export const leadStatusEnum = pgEnum("lead_status", ["new", "contacted", "converted", "lost"]);

export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  role: roleEnum("role").notNull().default("agent"),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const products = pgTable("products", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull().unique(),
  monthlyPrice: decimal("monthly_price", { precision: 10, scale: 2 }).notNull(),
  activationPoints: integer("activation_points").notNull(),
  benefits: text("benefits").notNull(), // JSON string array
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const customers = pgTable("customers", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  // Main Member Details
  title: varchar("title", { length: 10 }),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  gender: varchar("gender", { length: 10 }),
  idNumber: varchar("id_number", { length: 20 }).notNull(),
  dateOfBirth: timestamp("date_of_birth").notNull(),
  age: integer("age"),
  physicalAddress: text("physical_address"),
  postalAddress: text("postal_address"),
  postalCode1: varchar("postal_code1", { length: 10 }),
  postalCode2: varchar("postal_code2", { length: 10 }),
  phone: varchar("phone", { length: 20 }).notNull(),
  cellphone: varchar("cellphone", { length: 20 }),
  email: varchar("email", { length: 255 }).notNull(),
  
  // Partner Details
  partnerSurname: varchar("partner_surname", { length: 100 }),
  partnerFirstName: varchar("partner_first_name", { length: 100 }),
  partnerMaidenName: varchar("partner_maiden_name", { length: 100 }),
  partnerIdNumber: varchar("partner_id_number", { length: 20 }),
  partnerDateOfBirth: timestamp("partner_date_of_birth"),
  partnerAge: integer("partner_age"),
  
  // Employment Details
  isSelfEmployed: boolean("is_self_employed").default(false),
  mainOccupation: varchar("main_occupation", { length: 100 }),
  appointmentDate: timestamp("appointment_date"),
  isPermanentlyEmployed: boolean("is_permanently_employed").default(false),
  basicSalary: decimal("basic_salary", { precision: 10, scale: 2 }),
  employerName: varchar("employer_name", { length: 200 }),
  employerAddress: text("employer_address"),
  employmentSector: varchar("employment_sector", { length: 50 }),
  salaryFrequency: varchar("salary_frequency", { length: 20 }),
  salaryPaymentDay: integer("salary_payment_day"),
  
  // Banking Details
  accountHolder: varchar("account_holder", { length: 100 }),
  bankName: varchar("bank_name", { length: 100 }).notNull(),
  accountType: varchar("account_type", { length: 50 }).notNull(),
  policyNumber: varchar("policy_number", { length: 50 }),
  accountNumber: varchar("account_number", { length: 20 }).notNull(),
  branchCode: varchar("branch_code", { length: 10 }).notNull(),
  monthlyPremium: decimal("monthly_premium", { precision: 10, scale: 2 }),
  debitAmount: decimal("debit_amount", { precision: 10, scale: 2 }),
  firstDeductionDate: timestamp("first_deduction_date"),
  
  // Financial Details
  monthlySalary: decimal("monthly_salary", { precision: 10, scale: 2 }),
  totalHouseholdIncome: decimal("total_household_income", { precision: 10, scale: 2 }),
  incomePercentage: decimal("income_percentage", { precision: 5, scale: 2 }),
  householdIncomePercentage: decimal("household_income_percentage", { precision: 5, scale: 2 }),
  
  // Monthly Expenses
  bondRent: decimal("bond_rent", { precision: 10, scale: 2 }),
  cellPhone: decimal("cell_phone", { precision: 10, scale: 2 }),
  entertainment: decimal("entertainment", { precision: 10, scale: 2 }),
  food: decimal("food", { precision: 10, scale: 2 }),
  transport: decimal("transport", { precision: 10, scale: 2 }),
  other: decimal("other", { precision: 10, scale: 2 }),
  schoolFees: decimal("school_fees", { precision: 10, scale: 2 }),
  retailAccounts: decimal("retail_accounts", { precision: 10, scale: 2 }),
  totalExpenses: decimal("total_expenses", { precision: 10, scale: 2 }),
  
  // Goals and Financial Plan
  dignifiedFuneral: boolean("dignified_funeral").default(false),
  familyProtection: boolean("family_protection").default(false),
  saveFuture: boolean("save_future").default(false),
  
  // System fields
  agentId: varchar("agent_id", { length: 36 }).notNull(),
  productId: varchar("product_id", { length: 36 }).notNull(),
  status: statusEnum("status").notNull().default("pending"),
  signupDate: timestamp("signup_date").notNull().default(sql`CURRENT_TIMESTAMP`),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Separate tables for complex data
export const familyMembers = pgTable("family_members", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id", { length: 36 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  surname: varchar("surname", { length: 100 }).notNull(),
  idNumber: varchar("id_number", { length: 20 }),
  dateOfBirth: timestamp("date_of_birth"),
  age: integer("age"),
  relation: varchar("relation", { length: 50 }),
  coverAmount: decimal("cover_amount", { precision: 10, scale: 2 }),
  premium: decimal("premium", { precision: 10, scale: 2 }),
  type: varchar("type", { length: 50 }), // funeral_main, funeral_spouse, funeral_children, parent_funeral, extended_family, accidental_death
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const beneficiaries = pgTable("beneficiaries", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id", { length: 36 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  surname: varchar("surname", { length: 100 }).notNull(),
  idNumber: varchar("id_number", { length: 20 }),
  relation: varchar("relation", { length: 50 }),
  percentage: decimal("percentage", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const premiumPayers = pgTable("premium_payers", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id", { length: 36 }).notNull(),
  fullName: varchar("full_name", { length: 200 }),
  address: text("address"),
  telephone: varchar("telephone", { length: 20 }),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const leads = pgTable("leads", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  productInterest: varchar("product_interest", { length: 100 }),
  source: varchar("source", { length: 100 }).notNull().default("website"),
  status: leadStatusEnum("status").notNull().default("new"),
  agentId: varchar("agent_id", { length: 36 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  customers: many(customers),
  leads: many(leads),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  agent: one(users, {
    fields: [customers.agentId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [customers.productId],
    references: [products.id],
  }),
  familyMembers: many(familyMembers),
  beneficiaries: many(beneficiaries),
  premiumPayers: many(premiumPayers),
}));

export const familyMembersRelations = relations(familyMembers, ({ one }) => ({
  customer: one(customers, {
    fields: [familyMembers.customerId],
    references: [customers.id],
  }),
}));

export const beneficiariesRelations = relations(beneficiaries, ({ one }) => ({
  customer: one(customers, {
    fields: [beneficiaries.customerId],
    references: [customers.id],
  }),
}));

export const premiumPayersRelations = relations(premiumPayers, ({ one }) => ({
  customer: one(customers, {
    fields: [premiumPayers.customerId],
    references: [customers.id],
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

export const createCustomerSchema = insertCustomerSchema.extend({
  dateOfBirth: z.string().or(z.date()).transform((val) => typeof val === 'string' ? new Date(val) : val),
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
export type FamilyMember = typeof familyMembers.$inferSelect;
export type Beneficiary = typeof beneficiaries.$inferSelect;
export type PremiumPayer = typeof premiumPayers.$inferSelect;
