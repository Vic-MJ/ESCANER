import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const garments = pgTable("garments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  codigo: text("codigo").notNull().unique(),
  area: text("area").notNull(),
  dama_cab: text("dama_cab").notNull(),
  prenda: text("prenda").notNull(),
  modelo: text("modelo").notNull(),
  tela: text("tela").notNull(),
  color: text("color").notNull(),
  talla: text("talla").notNull(),
  ficha_bordado: text("ficha_bordado").notNull(),
  imagen_url: text("imagen_url"), // Campo opcional para la URL de la imagen
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertGarmentSchema = createInsertSchema(garments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const bulkInsertGarmentSchema = z.array(insertGarmentSchema);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertGarment = z.infer<typeof insertGarmentSchema>;
export type Garment = typeof garments.$inferSelect;
