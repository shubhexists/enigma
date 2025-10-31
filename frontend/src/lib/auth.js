import { betterAuth } from "better-auth";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET || "fallback-secret-change-in-production",
  // Temporarily use memory storage to debug
  socialProviders: {
    google: {
      clientId: process.env.AUTH_GOOGLE_ID || "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET || "",
    },
  },
  // Disable features that require additional database tables
  emailAndPassword: false,
  trustedOrigins: [process.env.BETTER_AUTH_URL || "http://localhost:3000"],
});
