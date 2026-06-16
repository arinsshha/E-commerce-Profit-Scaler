import { z } from "zod";

const optionalNumber = z.coerce.number().finite().default(0);
const positiveNumber = z.coerce.number().finite().positive();

export const SettingsSchema = z.object({
  currency: z.string().min(3).max(3),
  locale: z.string().min(2).max(20),
  targetMargin: z.coerce.number().finite().min(0).max(95),
  highReturnThreshold: z.coerce.number().finite().min(0).max(100),
  defaultShippingCost: optionalNumber,
  defaultPackagingCost: optionalNumber,
  defaultPaymentFeePercent: z.coerce.number().finite().min(0).max(100),
  defaultAdSpendPerOrder: optionalNumber
});

export const OrderRowSchema = z.object({
  orderId: z.union([z.string(), z.number()]).transform(String),
  date: z.union([z.string(), z.number()]).optional().default(""),
  product: z.union([z.string(), z.number()]).transform(String),
  sku: z.union([z.string(), z.number()]).transform((value) => String(value).trim()).pipe(z.string().min(1).max(120)),
  quantity: positiveNumber,
  sellingPrice: z.coerce.number().finite().min(0),
  discount: optionalNumber,
  paymentFee: optionalNumber
});

export const CostRowSchema = z.object({
  sku: z.union([z.string(), z.number()]).transform((value) => String(value).trim()).pipe(z.string().min(1).max(120)),
  product: z.union([z.string(), z.number()]).transform(String).optional().default(""),
  productCost: optionalNumber,
  packagingCost: optionalNumber
});

export const AdRowSchema = z.object({
  sku: z.union([z.string(), z.number()]).transform((value) => String(value).trim()).pipe(z.string().min(1).max(120)),
  adSpend: optionalNumber
});

export const ShippingRowSchema = z.object({
  sku: z.union([z.string(), z.number()]).transform((value) => String(value).trim()).pipe(z.string().min(1).max(120)),
  shippingCost: optionalNumber
});

export const ReturnRowSchema = z.object({
  sku: z.union([z.string(), z.number()]).transform((value) => String(value).trim()).pipe(z.string().min(1).max(120)),
  returnedUnits: optionalNumber
});

export const AnalysisSchema = z.object({
  products: z.array(z.record(z.unknown())).default([]),
  totals: z.record(z.unknown()).default({}),
  lowMargin: z.array(z.record(z.unknown())).default([]),
  lossMaking: z.array(z.record(z.unknown())).default([]),
  highReturn: z.array(z.record(z.unknown())).default([]),
  promote: z.array(z.record(z.unknown())).default([]),
  daily: z.array(z.record(z.unknown())).optional(),
  warnings: z.array(z.string()).default([])
});

export const ReportSchema = z.object({
  title: z.string().trim().min(1).max(120),
  settings: SettingsSchema,
  orders: z.array(OrderRowSchema).min(1),
  costs: z.array(CostRowSchema).default([]),
  ads: z.array(AdRowSchema).default([]),
  shipping: z.array(ShippingRowSchema).default([]),
  returns: z.array(ReturnRowSchema).default([]),
  analysis: AnalysisSchema
});
