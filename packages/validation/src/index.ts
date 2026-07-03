import { z } from "zod";

export const environmentSchema = z.enum(["local", "development", "staging", "production"]);

export const conversationContextSchema = z.enum(["item", "trade", "system"]);

export const collectorTypeSchema = z.enum([
  "collector",
  "seller",
  "seller_collector",
  "new_to_vintage",
]);

export const shirtSizeSchema = z.enum([
  "xs",
  "s",
  "m",
  "l",
  "xl",
  "xxl",
  "xxxl",
  "one_size",
  "measurements_matter",
]);

export const vintageCategorySchema = z.enum([
  "band",
  "rap",
  "harley",
  "sports",
  "wrestling",
  "movie",
  "anime",
  "cartoon",
  "three_d_emblem",
  "streetwear",
  "true_vintage_blanks",
]);

export const tradeOfferPreferenceSchema = z.enum([
  "all_serious_offers",
  "wishlist_only",
  "restricted_categories",
]);

export const communicationPreferenceSchema = z.enum([
  "approved_traders",
  "verified_only",
  "completed_trade_users",
  "matching_signal_users",
]);

export const itemStatusSchema = z.enum([
  "draft",
  "tradeable",
  "pending_trade",
  "reserved",
  "traded",
  "archived",
]);

export const itemConditionSchema = z.enum([
  "deadstock",
  "excellent",
  "very_good",
  "good",
  "fair",
  "project",
]);

export const itemVisibilitySchema = z.enum(["private", "approved_members", "verified_members"]);

export const itemPhotoSchema = z.object({
  id: z.string().min(1),
  uri: z.string().min(1),
  kind: z.enum(["front", "back", "tag", "flaw", "detail"]),
  sortOrder: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
});

export const itemMeasurementsSchema = z.object({
  chest: z.string().trim().max(24).optional(),
  length: z.string().trim().max(24).optional(),
  shoulder: z.string().trim().max(24).optional(),
  sleeve: z.string().trim().max(24).optional(),
  unit: z.literal("in").default("in"),
});

export const estimatedValueRangeSchema = z
  .object({
    min: z.coerce.number().nonnegative().optional(),
    max: z.coerce.number().nonnegative().optional(),
    currency: z.literal("USD").default("USD"),
  })
  .refine((value) => value.min === undefined || value.max === undefined || value.min <= value.max, {
    message: "Minimum value cannot exceed maximum value.",
  });

export const aiListingSuggestionsSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  category: vintageCategorySchema.optional(),
  size: shirtSizeSchema.optional(),
  era: z.string().trim().max(40).optional(),
  condition: itemConditionSchema.optional(),
  tag: z.string().trim().max(80).optional(),
  estimatedValue: estimatedValueRangeSchema.optional(),
  confidence: z.enum(["low", "medium", "high"]),
  generatedAt: z.string().datetime(),
});

export const tradeableItemDraftSchema = z.object({
  photos: z.array(itemPhotoSchema).max(12).default([]),
  title: z.string().trim().max(120).default(""),
  category: vintageCategorySchema.optional(),
  size: shirtSizeSchema.optional(),
  measurements: itemMeasurementsSchema.default({ unit: "in" }),
  era: z.string().trim().max(40).optional(),
  tag: z.string().trim().max(80).optional(),
  condition: itemConditionSchema.optional(),
  flaws: z.array(z.string().trim().min(1).max(120)).max(12).default([]),
  estimatedValue: estimatedValueRangeSchema.default({ currency: "USD" }),
  status: itemStatusSchema.default("draft"),
  tradePreference: tradeOfferPreferenceSchema.optional(),
  tradeNotes: z.string().trim().max(500).optional(),
  visibility: itemVisibilitySchema.default("private"),
  communicationPreference: communicationPreferenceSchema.default("approved_traders"),
  allowsPhotoRequests: z.boolean().default(true),
  allowsMeasurementRequests: z.boolean().default(true),
});

export const tradeableItemPublishSchema = tradeableItemDraftSchema.extend({
  photos: z.array(itemPhotoSchema).min(1, "Add at least one photo.").max(12),
  title: z.string().trim().min(3, "Add a clear title.").max(120),
  category: vintageCategorySchema,
  size: shirtSizeSchema,
  tag: z.string().trim().min(1, "Add the tag or mark it unknown.").max(80),
  condition: itemConditionSchema,
  status: z.literal("tradeable"),
  tradePreference: tradeOfferPreferenceSchema,
  visibility: z.enum(["approved_members", "verified_members"]),
});

export const wishlistPrioritySchema = z.enum(["low", "medium", "high"]);

export const wishlistMatchPreferenceSchema = z.enum(["exact", "similar"]);

export const wishlistVisibilitySchema = z.enum(["private", "approved_members", "verified_members"]);

export const wishlistItemDraftSchema = z.object({
  title: z.string().trim().max(120).default(""),
  category: vintageCategorySchema.optional(),
  size: shirtSizeSchema.optional(),
  preferredEra: z.string().trim().max(40).optional(),
  preferredTag: z.string().trim().max(80).optional(),
  preferredCondition: itemConditionSchema.optional(),
  notes: z.string().trim().max(500).optional(),
  priority: wishlistPrioritySchema.default("medium"),
  isGrail: z.boolean().default(false),
  matchPreference: wishlistMatchPreferenceSchema.default("similar"),
  visibility: wishlistVisibilitySchema.default("approved_members"),
  isArchived: z.boolean().default(false),
  sortOrder: z.number().int().nonnegative().default(0),
});

export const wishlistItemPublishSchema = wishlistItemDraftSchema.extend({
  title: z.string().trim().min(3, "Add the item you are hunting.").max(120),
  category: vintageCategorySchema,
});

export const accessRequestSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  socialHandle: z.string().trim().max(80).optional(),
  reason: z.string().trim().min(20).max(800),
});

export const userProfileUpsertSchema = z.object({
  email: z.string().trim().email(),
  displayName: z.string().trim().min(2).max(40),
  locationRegion: z.string().trim().min(2).max(80).optional(),
  bio: z.string().trim().max(160).optional(),
  socialHandle: z.string().trim().max(80).optional(),
});

export const createAccountSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const inviteCodeSchema = z.object({
  code: z.string().trim().min(4).max(32),
});

export const onboardingProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(40),
  locationRegion: z.string().trim().min(2).max(80),
  bio: z.string().trim().max(160).optional(),
  socialHandle: z.string().trim().max(80).optional(),
});

export const onboardingPreferencesSchema = z.object({
  collectorType: collectorTypeSchema,
  wornSizes: z.array(shirtSizeSchema).min(1),
  collectedSizes: z.array(shirtSizeSchema).min(1),
  categories: z.array(vintageCategorySchema).min(3).max(8),
  tradePreference: tradeOfferPreferenceSchema,
  acceptsCashAdjustments: z.boolean(),
  communicationPreference: communicationPreferenceSchema,
  allowsPhotoRequests: z.boolean(),
  allowsMeasurementRequests: z.boolean(),
  notificationsEnabled: z.boolean(),
});

export const healthResponseSchema = z.object({
  status: z.literal("ok"),
  service: z.string().min(1),
  version: z.string().min(1),
});
