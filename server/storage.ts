import { users, customers, products, leads, type User, type InsertUser, type Customer, type InsertCustomer, type Product, type Lead, type InsertLead } from "@shared/schema";
import { db } from "./db";
import { eq, desc, count, sql, and } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Customer methods
  getCustomersByAgent(agentId: string): Promise<Customer[]>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  getCustomerStats(agentId?: string): Promise<{
    total: number;
    monthly: number;
    pending: number;
  }>;

  // Product methods
  getAllProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;

  // Lead methods
  createLead(lead: InsertLead): Promise<Lead>;
  getLeadsByAgent(agentId: string): Promise<Lead[]>;
  updateLeadAgent(leadId: string, agentId: string): Promise<void>;

  // Admin methods
  getAllAgents(): Promise<User[]>;
  getAgentPerformance(): Promise<{
    agentId: string;
    agentName: string;
    totalSignups: number;
    monthlySignups: number;
    totalRevenue: number;
  }[]>;
  getProductPopularity(): Promise<{
    productName: string;
    count: number;
    percentage: number;
  }[]>;
  getOverallStats(): Promise<{
    totalSignups: number;
    activeAgents: number;
    monthlySignups: number;
    totalRevenue: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getCustomersByAgent(agentId: string): Promise<Customer[]> {
    return await db.select().from(customers)
      .where(eq(customers.agentId, agentId))
      .orderBy(desc(customers.signupDate));
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    return newCustomer;
  }

  async getCustomerStats(agentId?: string): Promise<{
    total: number;
    monthly: number;
    pending: number;
  }> {
    const whereClause = agentId ? eq(customers.agentId, agentId) : undefined;
    
    const [totalResult] = await db
      .select({ count: count() })
      .from(customers)
      .where(whereClause);

    const [monthlyResult] = await db
      .select({ count: count() })
      .from(customers)
      .where(
        agentId 
          ? and(
              eq(customers.agentId, agentId),
              sql`MONTH(${customers.signupDate}) = MONTH(CURRENT_DATE()) AND YEAR(${customers.signupDate}) = YEAR(CURRENT_DATE())`
            )
          : sql`MONTH(${customers.signupDate}) = MONTH(CURRENT_DATE()) AND YEAR(${customers.signupDate}) = YEAR(CURRENT_DATE())`
      );

    const [pendingResult] = await db
      .select({ count: count() })
      .from(customers)
      .where(
        agentId 
          ? and(eq(customers.agentId, agentId), eq(customers.status, "pending"))
          : eq(customers.status, "pending")
      );

    return {
      total: totalResult.count,
      monthly: monthlyResult.count,
      pending: pendingResult.count,
    };
  }

  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.isActive, true));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const [newLead] = await db.insert(leads).values(lead).returning();
    return newLead;
  }

  async getLeadsByAgent(agentId: string): Promise<Lead[]> {
    return await db.select().from(leads)
      .where(eq(leads.agentId, agentId))
      .orderBy(desc(leads.createdAt));
  }

  async updateLeadAgent(leadId: string, agentId: string): Promise<void> {
    await db.update(leads)
      .set({ agentId, status: "contacted" })
      .where(eq(leads.id, leadId));
  }

  async getAllAgents(): Promise<User[]> {
    return await db.select().from(users)
      .where(and(eq(users.role, "agent"), eq(users.isActive, true)));
  }

  async getAgentPerformance(): Promise<{
    agentId: string;
    agentName: string;
    totalSignups: number;
    monthlySignups: number;
    totalRevenue: number;
  }[]> {
    const result = await db
      .select({
        agentId: users.id,
        agentName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
        totalSignups: count(customers.id),
        monthlySignups: sql<number>`SUM(CASE WHEN MONTH(${customers.signupDate}) = MONTH(CURRENT_DATE()) AND YEAR(${customers.signupDate}) = YEAR(CURRENT_DATE()) THEN 1 ELSE 0 END)`,
        totalRevenue: sql<number>`SUM(${products.monthlyPrice} * 12)`,
      })
      .from(users)
      .leftJoin(customers, eq(users.id, customers.agentId))
      .leftJoin(products, eq(customers.productId, products.id))
      .where(eq(users.role, "agent"))
      .groupBy(users.id, users.firstName, users.lastName);

    return result;
  }

  async getProductPopularity(): Promise<{
    productName: string;
    count: number;
    percentage: number;
  }[]> {
    const [totalCustomers] = await db.select({ count: count() }).from(customers);
    const total = totalCustomers.count;

    const result = await db
      .select({
        productName: products.name,
        count: count(customers.id),
      })
      .from(products)
      .leftJoin(customers, eq(products.id, customers.productId))
      .groupBy(products.id, products.name);

    return result.map(item => ({
      ...item,
      percentage: total > 0 ? Math.round((item.count / total) * 100) : 0,
    }));
  }

  async getOverallStats(): Promise<{
    totalSignups: number;
    activeAgents: number;
    monthlySignups: number;
    totalRevenue: number;
  }> {
    const [totalSignupsResult] = await db.select({ count: count() }).from(customers);
    const [activeAgentsResult] = await db.select({ count: count() }).from(users)
      .where(and(eq(users.role, "agent"), eq(users.isActive, true)));
    
    const [monthlySignupsResult] = await db.select({ count: count() }).from(customers)
      .where(sql`MONTH(${customers.signupDate}) = MONTH(CURRENT_DATE()) AND YEAR(${customers.signupDate}) = YEAR(CURRENT_DATE())`);

    const [revenueResult] = await db
      .select({ revenue: sql<number>`SUM(${products.monthlyPrice} * 12)` })
      .from(customers)
      .leftJoin(products, eq(customers.productId, products.id));

    return {
      totalSignups: totalSignupsResult.count,
      activeAgents: activeAgentsResult.count,
      monthlySignups: monthlySignupsResult.count,
      totalRevenue: revenueResult.revenue || 0,
    };
  }
}

export const storage = new DatabaseStorage();
