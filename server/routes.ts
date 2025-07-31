import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import session from "express-session";
import { loginSchema, insertCustomerSchema, createCustomerSchema, insertLeadSchema } from "@shared/schema";
import { z } from "zod";

declare module "express-session" {
  interface SessionData {
    userId?: string;
    userRole?: string;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Auth middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  const requireRole = (role: string) => (req: any, res: any, next: any) => {
    if (req.session.userRole !== role) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;
      req.session.userRole = user.role;

      res.json({
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
        }
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Product routes
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Lead routes
  app.post("/api/leads", async (req, res) => {
    try {
      const leadData = insertLeadSchema.parse(req.body);
      const lead = await storage.createLead(leadData);
      res.json(lead);
    } catch (error) {
      res.status(400).json({ message: "Invalid lead data" });
    }
  });

  app.get("/api/leads", requireAuth, async (req, res) => {
    try {
      if (req.session.userRole === "agent") {
        const leads = await storage.getLeadsByAgent(req.session.userId!);
        res.json(leads);
      } else {
        res.status(403).json({ message: "Forbidden" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  // Customer routes
  app.post("/api/customers", requireAuth, requireRole("agent"), async (req, res) => {
    try {
      const customerData = createCustomerSchema.parse({
        ...req.body,
        agentId: req.session.userId
      });
      
      const customer = await storage.createCustomer(customerData);
      res.json(customer);
    } catch (error) {
      console.error("Customer creation error:", error);
      res.status(400).json({ message: "Invalid customer data" });
    }
  });

  app.get("/api/customers", requireAuth, async (req, res) => {
    try {
      if (req.session.userRole === "agent") {
        const customers = await storage.getCustomersByAgent(req.session.userId!);
        res.json(customers);
      } else if (req.session.userRole === "admin") {
        const customers = await storage.getAllCustomers();
        res.json(customers);
      } else {
        res.status(403).json({ message: "Forbidden" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.patch("/api/customers/:id/status", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!["pending", "active", "inactive"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      await storage.updateCustomerStatus(id, status);
      res.json({ message: "Status updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update status" });
    }
  });

  // Agent dashboard stats
  app.get("/api/agent/stats", requireAuth, requireRole("agent"), async (req, res) => {
    try {
      const stats = await storage.getCustomerStats(req.session.userId!);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Admin routes
  app.get("/api/admin/stats", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const stats = await storage.getOverallStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  app.get("/api/admin/agents", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const agents = await storage.getAgentPerformance();
      res.json(agents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch agent performance" });
    }
  });

  app.get("/api/admin/products/popularity", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const popularity = await storage.getProductPopularity();
      res.json(popularity);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product popularity" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
