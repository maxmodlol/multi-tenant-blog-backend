#!/usr/bin/env ts-node
import { AppDataSource } from "../config/data-source";

async function runMigrations() {
  try {
    console.log("Initializing database connection...");
    await AppDataSource.initialize();

    console.log("Checking pending migrations...");
    const pendingMigrations = await AppDataSource.showMigrations();

    if (pendingMigrations) {
      console.log("Found pending migrations. Running migrations...");
      await AppDataSource.runMigrations();
      console.log("✅ All migrations completed successfully!");
    } else {
      console.log("✅ No pending migrations found. Database is up to date.");
    }

    // Show final migration status
    console.log("\nCurrent migration status:");
    await AppDataSource.showMigrations();
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
  }
}

// Run if called directly
if (require.main === module) {
  runMigrations();
}

export { runMigrations };




