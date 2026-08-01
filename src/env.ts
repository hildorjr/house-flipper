import { z } from "zod";

const requiredString = z.string().min(1);
const optionalString = requiredString.optional();

const publicSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_URL: z.url().optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: optionalString,
  NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY: optionalString,
  NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL: optionalString,
});

const requiredWithoutMocks = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY",
  "NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL",
  "SUPABASE_SECRET_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "CRON_SECRET",
] as const;

const serverSchema = publicSchema
  .extend({
    DATABASE_URL: requiredString,
    DIRECT_URL: requiredString,
    SUPABASE_SECRET_KEY: optionalString,
    STRIPE_SECRET_KEY: optionalString,
    STRIPE_WEBHOOK_SECRET: optionalString,
    STRIPE_PAYMENT_METHODS: optionalString,
    CRON_SECRET: optionalString,
    FEATURE_PHONE_OTP: optionalString,
    MOCK_THIRD_PARTY: z
      .string()
      .optional()
      .transform((value) => value === "true"),
  })
  .superRefine((env, ctx) => {
    if (env.MOCK_THIRD_PARTY) return;
    for (const key of requiredWithoutMocks) {
      if (env[key]) continue;
      ctx.addIssue({
        code: "custom",
        path: [key],
        message: "Required unless MOCK_THIRD_PARTY is true",
      });
    }
  });

export type ClientEnv = z.infer<typeof publicSchema>;
export type ServerEnv = z.infer<typeof serverSchema>;

function parse<Schema extends z.ZodType>(schema: Schema, source: unknown): z.infer<Schema> {
  const result = schema.safeParse(source);
  if (result.success) return result.data;
  throw new Error(`Invalid environment variables:\n${z.prettifyError(result.error)}`);
}

export const clientEnv: ClientEnv = parse(publicSchema, {
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY,
  NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL,
});

let cachedServerEnv: ServerEnv | undefined;

export function serverEnv(): ServerEnv {
  if (typeof window !== "undefined") {
    throw new Error("serverEnv() is server-only. Use clientEnv in the browser.");
  }
  cachedServerEnv ??= parse(serverSchema, process.env);
  return cachedServerEnv;
}
