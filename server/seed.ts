import { db } from "./db";
import { users, products } from "@shared/schema";
import bcrypt from "bcrypt";

async function seedDatabase() {
  console.log("Seeding database...");

  try {
    // Check if products already exist
    const existingProducts = await db.select().from(products);
    if (existingProducts.length === 0) {
      // Insert lifestyle products
      const lifestyleProducts = [
        {
          name: "OPPORTUNITY",
          monthlyPrice: "99.00",
          activationPoints: 100,
          benefits: JSON.stringify([
            "Emergency medical assistance",
            "24/7 roadside assistance",
            "Basic legal advice",
            "Identity theft protection"
          ]),
          description: "Entry-level lifestyle package perfect for young professionals starting their journey."
        },
        {
          name: "MOMENTUM",
          monthlyPrice: "199.00",
          activationPoints: 200,
          benefits: JSON.stringify([
            "Comprehensive medical assistance",
            "Premium roadside assistance",
            "Legal consultation services",
            "Identity theft protection",
            "Emergency cash advance",
            "Travel assistance"
          ]),
          description: "Mid-tier package offering enhanced protection and convenience features."
        },
        {
          name: "PROSPER",
          monthlyPrice: "299.00",
          activationPoints: 300,
          benefits: JSON.stringify([
            "Full medical assistance coverage",
            "Premium roadside assistance",
            "Comprehensive legal services",
            "Identity theft protection",
            "Emergency cash advance",
            "International travel assistance",
            "Home emergency services",
            "Pet care assistance"
          ]),
          description: "Professional package designed for established individuals and families."
        },
        {
          name: "PRESTIGE",
          monthlyPrice: "499.00",
          activationPoints: 500,
          benefits: JSON.stringify([
            "Premium medical assistance",
            "Luxury roadside assistance",
            "Full legal services",
            "Advanced identity protection",
            "Emergency cash advance",
            "Global travel assistance",
            "Concierge services",
            "Home and garden services",
            "Pet care and veterinary assistance",
            "Personal shopping assistance"
          ]),
          description: "Premium package offering luxury lifestyle services and comprehensive protection."
        },
        {
          name: "PINNACLE",
          monthlyPrice: "799.00",
          activationPoints: 800,
          benefits: JSON.stringify([
            "Elite medical assistance",
            "Luxury roadside assistance",
            "Complete legal services",
            "Advanced identity protection",
            "Emergency cash advance",
            "Global travel assistance",
            "Personal concierge services",
            "Home and garden services",
            "Pet care and veterinary assistance",
            "Personal shopping assistance",
            "Event planning services",
            "Personal fitness and wellness support"
          ]),
          description: "Ultimate lifestyle package providing comprehensive luxury services and protection."
        }
      ];

      await db.insert(products).values(lifestyleProducts);
      console.log("✓ Lifestyle products seeded");
    }

    // Check if users already exist
    const existingUsers = await db.select().from(users);
    if (existingUsers.length === 0) {
      // Create sample users
      const hashedPassword = await bcrypt.hash("password", 12);
      
      const sampleUsers = [
        {
          email: "admin@lifestylepro.co.za",
          password: hashedPassword,
          role: "admin" as const,
          firstName: "Admin",
          lastName: "User"
        },
        {
          email: "agent1@lifestylepro.co.za",
          password: hashedPassword,
          role: "agent" as const,
          firstName: "Agent",
          lastName: "One"
        },
        {
          email: "agent2@lifestylepro.co.za",
          password: hashedPassword,
          role: "agent" as const,
          firstName: "Agent",
          lastName: "Two"
        }
      ];

      await db.insert(users).values(sampleUsers);
      console.log("✓ Sample users seeded");
    }

    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { seedDatabase };