import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const nonprofits = pgTable("nonprofits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  mission: text("mission").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  taxId: text("tax_id").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  website: text("website"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  bankAccountLast4: text("bank_account_last4"),
  bankRoutingLast4: text("bank_routing_last4"),
  stripeConnectedAccountId: text("stripe_connected_account_id"),
  stripeOnboardingComplete: boolean("stripe_onboarding_complete").default(false),
  stripeChargesEnabled: boolean("stripe_charges_enabled").default(false),
  stripePayoutsEnabled: boolean("stripe_payouts_enabled").default(false),
  logoUrl: text("logo_url"),
  coverImageUrl: text("cover_image_url"),
  isVerified: boolean("is_verified").default(false),
  isActive: boolean("is_active").default(true),
  // Clerk user ID of the account that onboarded this nonprofit.
  ownerUserId: text("owner_user_id").unique(),
  totalRaised: integer("total_raised").default(0),
  donorCount: integer("donor_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNonprofitSchema = createInsertSchema(nonprofits).omit({
  id: true,
  createdAt: true,
  totalRaised: true,
  donorCount: true,
  stripeConnectedAccountId: true,
  stripeOnboardingComplete: true,
  stripeChargesEnabled: true,
  stripePayoutsEnabled: true,
  isVerified: true,
  isActive: true,
  ownerUserId: true,
});

export type InsertNonprofit = z.infer<typeof insertNonprofitSchema>;
export type Nonprofit = typeof nonprofits.$inferSelect;

// What anonymous visitors may see: drops payout/Stripe details and ownership.
export type PublicNonprofit = Omit<
  Nonprofit,
  | "bankAccountLast4"
  | "bankRoutingLast4"
  | "stripeConnectedAccountId"
  | "stripeOnboardingComplete"
  | "stripeChargesEnabled"
  | "stripePayoutsEnabled"
  | "ownerUserId"
>;

export function toPublicNonprofit(nonprofit: Nonprofit): PublicNonprofit {
  const {
    bankAccountLast4,
    bankRoutingLast4,
    stripeConnectedAccountId,
    stripeOnboardingComplete,
    stripeChargesEnabled,
    stripePayoutsEnabled,
    ownerUserId,
    ...rest
  } = nonprofit;
  return rest;
}

export const donations = pgTable("donations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nonprofitId: varchar("nonprofit_id").notNull().references(() => nonprofits.id),
  amount: integer("amount").notNull(),
  donorEmail: text("donor_email"),
  donorName: text("donor_name"),
  message: text("message"),
  isAnonymous: boolean("is_anonymous").default(false),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeCheckoutSessionId: text("stripe_checkout_session_id"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDonationSchema = createInsertSchema(donations).omit({
  id: true,
  createdAt: true,
  status: true,
});

export type InsertDonation = z.infer<typeof insertDonationSchema>;
export type Donation = typeof donations.$inferSelect;

export const nonprofitCategories = [
  "Education",
  "Health",
  "Environment",
  "Animals",
  "Arts & Culture",
  "Community Development",
  "Human Services",
  "International",
  "Religion",
  "Other",
] as const;

export type NonprofitCategory = typeof nonprofitCategories[number];

// Posts - fundraiser/update posts from nonprofits
export const posts = pgTable("posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nonprofitId: varchar("nonprofit_id").notNull().references(() => nonprofits.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  goalAmount: integer("goal_amount"),
  raisedAmount: integer("raised_amount").default(0),
  donorCount: integer("donor_count").default(0),
  likeCount: integer("like_count").default(0),
  isPublished: boolean("is_published").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  createdAt: true,
  raisedAmount: true,
  donorCount: true,
  likeCount: true,
});

// Fields a nonprofit may change on an existing post.
export const updatePostSchema = insertPostSchema
  .pick({ title: true, content: true, imageUrl: true, goalAmount: true, isPublished: true })
  .partial();

export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect;

// Supporters - users who browse and donate (extends basic users)
export const supporters = pgTable("supporters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSupporterSchema = createInsertSchema(supporters).omit({
  id: true,
  createdAt: true,
});

export type InsertSupporter = z.infer<typeof insertSupporterSchema>;
export type Supporter = typeof supporters.$inferSelect;

// Follows - supporters following nonprofits
export const follows = pgTable("follows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supporterId: varchar("supporter_id").notNull().references(() => supporters.id),
  nonprofitId: varchar("nonprofit_id").notNull().references(() => nonprofits.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFollowSchema = createInsertSchema(follows).omit({
  id: true,
  createdAt: true,
});

export type InsertFollow = z.infer<typeof insertFollowSchema>;
export type Follow = typeof follows.$inferSelect;

// Reactions - likes on posts
export const reactions = pgTable("reactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull().references(() => posts.id),
  supporterId: varchar("supporter_id").references(() => supporters.id),
  guestId: text("guest_id"),
  type: text("type").notNull().default("like"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReactionSchema = createInsertSchema(reactions).omit({
  id: true,
  createdAt: true,
});

export type InsertReaction = z.infer<typeof insertReactionSchema>;
export type Reaction = typeof reactions.$inferSelect;

// Post with nonprofit info for feed display
export type PostWithNonprofit = Post & {
  nonprofit: Pick<Nonprofit, "id" | "name" | "slug" | "logoUrl" | "category">;
};
