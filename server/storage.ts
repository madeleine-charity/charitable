import { 
  type User, 
  type InsertUser, 
  type Nonprofit, 
  type InsertNonprofit,
  type Donation,
  type InsertDonation,
  type Post,
  type InsertPost,
  type PostWithNonprofit,
  type Supporter,
  type InsertSupporter,
  type Follow,
  type InsertFollow,
  type Reaction,
  type InsertReaction,
  users, 
  nonprofits, 
  donations,
  posts,
  supporters,
  follows,
  reactions,
} from "../shared/schema.js";
import { db } from "./db.js";
import { eq, sql, desc, and } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getAllNonprofits(): Promise<Nonprofit[]>;
  getAllNonprofitsAdmin(): Promise<Nonprofit[]>;
  getVerifiedNonprofits(): Promise<Nonprofit[]>;
  getNonprofitById(id: string): Promise<Nonprofit | undefined>;
  getNonprofitBySlug(slug: string): Promise<Nonprofit | undefined>;
  getNonprofitByOwner(userId: string): Promise<Nonprofit | undefined>;
  createNonprofit(nonprofit: InsertNonprofit & { ownerUserId: string }): Promise<Nonprofit>;
  updateNonprofitStats(id: string, donationAmount: number): Promise<void>;
  updateNonprofitStripeAccount(id: string, stripeAccountId: string): Promise<void>;
  updateNonprofitStripeStatus(id: string, status: { stripeOnboardingComplete?: boolean; stripeChargesEnabled?: boolean; stripePayoutsEnabled?: boolean }): Promise<void>;
  approveNonprofit(id: string): Promise<void>;
  rejectNonprofit(id: string): Promise<void>;
  
  getDonationsByNonprofitId(nonprofitId: string): Promise<Donation[]>;
  getDonationByCheckoutSession(sessionId: string): Promise<Donation | undefined>;
  createDonation(donation: InsertDonation): Promise<Donation>;
  updateDonationStatus(id: string, status: string): Promise<void>;
  updateDonationCheckoutSession(id: string, sessionId: string): Promise<void>;
  
  // Posts
  getFeed(limit?: number, offset?: number): Promise<PostWithNonprofit[]>;
  getPostById(id: string): Promise<Post | undefined>;
  getPostsByNonprofitId(nonprofitId: string): Promise<Post[]>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: string, data: Partial<InsertPost>): Promise<Post>;
  deletePost(id: string): Promise<void>;
  updatePostStats(id: string, amount: number): Promise<void>;
  
  // Supporters
  getSupporterById(id: string): Promise<Supporter | undefined>;
  getSupporterByEmail(email: string): Promise<Supporter | undefined>;
  createSupporter(supporter: InsertSupporter): Promise<Supporter>;
  
  // Follows
  getFollowsBySupporter(supporterId: string): Promise<Follow[]>;
  isFollowing(supporterId: string, nonprofitId: string): Promise<boolean>;
  createFollow(follow: InsertFollow): Promise<Follow>;
  deleteFollow(supporterId: string, nonprofitId: string): Promise<void>;
  getFollowerCount(nonprofitId: string): Promise<number>;
  
  // Reactions
  getReactionsByPost(postId: string): Promise<Reaction[]>;
  hasReacted(postId: string, guestId: string): Promise<boolean>;
  createReaction(reaction: InsertReaction): Promise<Reaction>;
  deleteReaction(postId: string, guestId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAllNonprofits(): Promise<Nonprofit[]> {
    return db.select().from(nonprofits).where(eq(nonprofits.isActive, true));
  }

  async getAllNonprofitsAdmin(): Promise<Nonprofit[]> {
    return db.select().from(nonprofits).orderBy(desc(nonprofits.createdAt));
  }

  async getVerifiedNonprofits(): Promise<Nonprofit[]> {
    return db.select().from(nonprofits).where(and(eq(nonprofits.isActive, true), eq(nonprofits.isVerified, true)));
  }

  async approveNonprofit(id: string): Promise<void> {
    await db.update(nonprofits).set({ isVerified: true, isActive: true }).where(eq(nonprofits.id, id));
  }

  async rejectNonprofit(id: string): Promise<void> {
    await db.update(nonprofits).set({ isActive: false }).where(eq(nonprofits.id, id));
  }

  async getNonprofitById(id: string): Promise<Nonprofit | undefined> {
    const [nonprofit] = await db.select().from(nonprofits).where(eq(nonprofits.id, id));
    return nonprofit || undefined;
  }

  async getNonprofitByOwner(userId: string): Promise<Nonprofit | undefined> {
    const [nonprofit] = await db.select().from(nonprofits).where(eq(nonprofits.ownerUserId, userId));
    return nonprofit || undefined;
  }

  async getNonprofitBySlug(slug: string): Promise<Nonprofit | undefined> {
    const [nonprofit] = await db.select().from(nonprofits).where(eq(nonprofits.slug, slug));
    return nonprofit || undefined;
  }

  async createNonprofit(insertNonprofit: InsertNonprofit & { ownerUserId: string }): Promise<Nonprofit> {
    const [nonprofit] = await db.insert(nonprofits).values(insertNonprofit).returning();
    return nonprofit;
  }

  async updateNonprofitStats(id: string, donationAmount: number): Promise<void> {
    await db
      .update(nonprofits)
      .set({
        totalRaised: sql`${nonprofits.totalRaised} + ${donationAmount}`,
        donorCount: sql`${nonprofits.donorCount} + 1`,
      })
      .where(eq(nonprofits.id, id));
  }

  async getDonationsByNonprofitId(nonprofitId: string): Promise<Donation[]> {
    return db
      .select()
      .from(donations)
      .where(eq(donations.nonprofitId, nonprofitId))
      .orderBy(desc(donations.createdAt));
  }

  async getDonationByCheckoutSession(sessionId: string): Promise<Donation | undefined> {
    const [donation] = await db
      .select()
      .from(donations)
      .where(eq(donations.stripeCheckoutSessionId, sessionId));
    return donation || undefined;
  }

  async createDonation(insertDonation: InsertDonation): Promise<Donation> {
    const [donation] = await db.insert(donations).values(insertDonation).returning();
    return donation;
  }

  async updateDonationStatus(id: string, status: string): Promise<void> {
    await db.update(donations).set({ status }).where(eq(donations.id, id));
  }

  async updateDonationCheckoutSession(id: string, sessionId: string): Promise<void> {
    await db
      .update(donations)
      .set({ stripeCheckoutSessionId: sessionId })
      .where(eq(donations.id, id));
  }

  async updateNonprofitStripeAccount(id: string, stripeAccountId: string): Promise<void> {
    await db
      .update(nonprofits)
      .set({ stripeConnectedAccountId: stripeAccountId })
      .where(eq(nonprofits.id, id));
  }

  async updateNonprofitStripeStatus(id: string, status: { stripeOnboardingComplete?: boolean; stripeChargesEnabled?: boolean; stripePayoutsEnabled?: boolean }): Promise<void> {
    await db
      .update(nonprofits)
      .set(status)
      .where(eq(nonprofits.id, id));
  }

  // Posts
  async getFeed(limit = 20, offset = 0): Promise<PostWithNonprofit[]> {
    const result = await db
      .select({
        id: posts.id,
        nonprofitId: posts.nonprofitId,
        title: posts.title,
        content: posts.content,
        imageUrl: posts.imageUrl,
        goalAmount: posts.goalAmount,
        raisedAmount: posts.raisedAmount,
        donorCount: posts.donorCount,
        likeCount: posts.likeCount,
        isPublished: posts.isPublished,
        createdAt: posts.createdAt,
        nonprofit: {
          id: nonprofits.id,
          name: nonprofits.name,
          slug: nonprofits.slug,
          logoUrl: nonprofits.logoUrl,
          category: nonprofits.category,
        },
      })
      .from(posts)
      .innerJoin(nonprofits, eq(posts.nonprofitId, nonprofits.id))
      .where(and(eq(posts.isPublished, true), eq(nonprofits.isVerified, true), eq(nonprofits.isActive, true)))
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);
    
    return result as PostWithNonprofit[];
  }

  async getPostById(id: string): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post || undefined;
  }

  async getPostsByNonprofitId(nonprofitId: string): Promise<Post[]> {
    return db
      .select()
      .from(posts)
      .where(eq(posts.nonprofitId, nonprofitId))
      .orderBy(desc(posts.createdAt));
  }

  async createPost(insertPost: InsertPost): Promise<Post> {
    const [post] = await db.insert(posts).values(insertPost).returning();
    return post;
  }

  async updatePost(id: string, data: Partial<InsertPost>): Promise<Post> {
    const [post] = await db.update(posts).set(data).where(eq(posts.id, id)).returning();
    return post;
  }

  async deletePost(id: string): Promise<void> {
    await db.delete(posts).where(eq(posts.id, id));
  }

  async updatePostStats(id: string, amount: number): Promise<void> {
    await db
      .update(posts)
      .set({
        raisedAmount: sql`${posts.raisedAmount} + ${amount}`,
        donorCount: sql`${posts.donorCount} + 1`,
      })
      .where(eq(posts.id, id));
  }

  // Supporters
  async getSupporterById(id: string): Promise<Supporter | undefined> {
    const [supporter] = await db.select().from(supporters).where(eq(supporters.id, id));
    return supporter || undefined;
  }

  async getSupporterByEmail(email: string): Promise<Supporter | undefined> {
    const [supporter] = await db.select().from(supporters).where(eq(supporters.email, email));
    return supporter || undefined;
  }

  async createSupporter(insertSupporter: InsertSupporter): Promise<Supporter> {
    const [supporter] = await db.insert(supporters).values(insertSupporter).returning();
    return supporter;
  }

  // Follows
  async getFollowsBySupporter(supporterId: string): Promise<Follow[]> {
    return db.select().from(follows).where(eq(follows.supporterId, supporterId));
  }

  async isFollowing(supporterId: string, nonprofitId: string): Promise<boolean> {
    const [follow] = await db
      .select()
      .from(follows)
      .where(and(eq(follows.supporterId, supporterId), eq(follows.nonprofitId, nonprofitId)));
    return !!follow;
  }

  async createFollow(insertFollow: InsertFollow): Promise<Follow> {
    const [follow] = await db.insert(follows).values(insertFollow).returning();
    return follow;
  }

  async deleteFollow(supporterId: string, nonprofitId: string): Promise<void> {
    await db
      .delete(follows)
      .where(and(eq(follows.supporterId, supporterId), eq(follows.nonprofitId, nonprofitId)));
  }

  async getFollowerCount(nonprofitId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(follows)
      .where(eq(follows.nonprofitId, nonprofitId));
    return result[0]?.count || 0;
  }

  // Reactions
  async getReactionsByPost(postId: string): Promise<Reaction[]> {
    return db.select().from(reactions).where(eq(reactions.postId, postId));
  }

  async hasReacted(postId: string, guestId: string): Promise<boolean> {
    const [reaction] = await db
      .select()
      .from(reactions)
      .where(and(eq(reactions.postId, postId), eq(reactions.guestId, guestId)));
    return !!reaction;
  }

  async createReaction(insertReaction: InsertReaction): Promise<Reaction> {
    const [reaction] = await db.insert(reactions).values(insertReaction).returning();
    await db.update(posts).set({ likeCount: sql`${posts.likeCount} + 1` }).where(eq(posts.id, insertReaction.postId));
    return reaction;
  }

  async deleteReaction(postId: string, guestId: string): Promise<void> {
    await db
      .delete(reactions)
      .where(and(eq(reactions.postId, postId), eq(reactions.guestId, guestId)));
    await db.update(posts).set({ likeCount: sql`${posts.likeCount} - 1` }).where(eq(posts.id, postId));
  }
}

export const storage = new DatabaseStorage();
