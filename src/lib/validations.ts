import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

export const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  name: z.string().min(1, "El nombre es requerido").max(100),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

export const createExpenseSchema = z.object({
  amount: z.number().positive("El monto debe ser positivo"),
  description: z.string().min(1, "La descripción es requerida").max(200),
  date: z.coerce.date(),
  categoryId: z.string().optional(),
  receiptImage: z.string().optional(),
  ocrText: z.string().optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const createCategorySchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color inválido"),
  icon: z.string().min(1),
  monthlyBudget: z.number().positive().optional().nullable(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const exportQuerySchema = z.object({
  format: z.enum(["csv", "pdf"]),
  from: z.coerce.date(),
  to: z.coerce.date(),
  categoryId: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
