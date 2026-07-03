export const APP_NAME = "Collector Trade Network";
export const API_VERSION = "v1";

export const CONVERSATION_CONTEXTS = ["item", "trade", "system"] as const;

export const COLLECTOR_TYPES = [
  {
    value: "seller_collector",
    label: "Seller-collector",
    description: "I sell, source, collect, and trade vintage.",
  },
  {
    value: "collector",
    label: "Collector",
    description: "I collect seriously and trade to improve my rotation.",
  },
  {
    value: "seller",
    label: "Seller",
    description: "I primarily sell but want better sourcing and trade options.",
  },
  {
    value: "new_to_vintage",
    label: "New to vintage",
    description: "I was invited and want to learn the network.",
  },
] as const;

export const VINTAGE_CATEGORIES = [
  { value: "band", label: "Band" },
  { value: "rap", label: "Rap" },
  { value: "harley", label: "Harley" },
  { value: "sports", label: "Sports" },
  { value: "wrestling", label: "Wrestling" },
  { value: "movie", label: "Movie" },
  { value: "anime", label: "Anime" },
  { value: "cartoon", label: "Cartoon" },
  { value: "three_d_emblem", label: "3D Emblem" },
  { value: "streetwear", label: "Streetwear" },
  { value: "true_vintage_blanks", label: "True vintage blanks" },
] as const;

export const SHIRT_SIZES = [
  { value: "xs", label: "XS" },
  { value: "s", label: "S" },
  { value: "m", label: "M" },
  { value: "l", label: "L" },
  { value: "xl", label: "XL" },
  { value: "xxl", label: "XXL" },
  { value: "xxxl", label: "XXXL" },
  { value: "one_size", label: "One size" },
  { value: "measurements_matter", label: "Measurements matter" },
] as const;

export const TRADE_OFFER_PREFERENCES = [
  {
    value: "all_serious_offers",
    label: "All serious offers",
    description: "Receive credible item-based offers from approved traders.",
  },
  {
    value: "wishlist_only",
    label: "Wishlist-only",
    description: "Only receive offers that match what you say you want.",
  },
  {
    value: "restricted_categories",
    label: "Restricted categories",
    description: "Limit offers to the vintage categories you care about.",
  },
] as const;

export const COMMUNICATION_PREFERENCES = [
  {
    value: "approved_traders",
    label: "Approved traders",
    description: "Any approved member can ask item-specific questions.",
  },
  {
    value: "verified_only",
    label: "Verified users only",
    description: "Only verified sellers and collectors can contact you about items.",
  },
  {
    value: "completed_trade_users",
    label: "Completed traders",
    description: "Only members with completed trades can contact you.",
  },
  {
    value: "matching_signal_users",
    label: "Strong matches only",
    description: "Only users with relevant wants or inventory can start item conversations.",
  },
] as const;

export const ITEM_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "tradeable", label: "Tradeable" },
  { value: "pending_trade", label: "Pending trade" },
  { value: "reserved", label: "Reserved" },
  { value: "traded", label: "Traded" },
  { value: "archived", label: "Archived" },
] as const;

export const ITEM_CONDITIONS = [
  { value: "deadstock", label: "Deadstock", description: "Unworn or like-new." },
  { value: "excellent", label: "Excellent", description: "Minimal wear, no meaningful flaws." },
  { value: "very_good", label: "Very good", description: "Light wear with minor age." },
  { value: "good", label: "Good", description: "Visible wear, still strong." },
  { value: "fair", label: "Fair", description: "Wearable with notable flaws." },
  { value: "project", label: "Project", description: "Needs repair or has major flaws." },
] as const;

export const ITEM_VISIBILITY_OPTIONS = [
  {
    value: "approved_members",
    label: "Approved members",
    description: "Visible to approved traders in the network.",
  },
  {
    value: "verified_members",
    label: "Verified members",
    description: "Visible only to verified sellers and collectors.",
  },
  {
    value: "private",
    label: "Private draft",
    description: "Only you can see this item.",
  },
] as const;

export const ITEM_PHOTO_KINDS = [
  { value: "front", label: "Front" },
  { value: "back", label: "Back" },
  { value: "tag", label: "Tag" },
  { value: "flaw", label: "Flaw" },
  { value: "detail", label: "Detail" },
] as const;

export const ITEM_ERAS = ["70s", "80s", "90s", "2000s", "Modern"] as const;

export const MAX_GRAILS = 5;

export const WISHLIST_PRIORITIES = [
  {
    value: "high",
    label: "High",
    description: "Actively hunting and willing to move strong pieces for it.",
  },
  {
    value: "medium",
    label: "Medium",
    description: "Important want, but not the only thing you are chasing.",
  },
  {
    value: "low",
    label: "Low",
    description: "Interesting if the right one appears.",
  },
] as const;

export const WISHLIST_MATCH_PREFERENCES = [
  {
    value: "exact",
    label: "Exact match",
    description: "Only this specific item should count as a strong match.",
  },
  {
    value: "similar",
    label: "Similar accepted",
    description: "Adjacent items can still be useful trade signals.",
  },
] as const;

export const WISHLIST_VISIBILITY_OPTIONS = [
  {
    value: "approved_members",
    label: "Approved members",
    description: "Visible to approved traders for future matching.",
  },
  {
    value: "verified_members",
    label: "Verified members",
    description: "Visible only to verified sellers and collectors.",
  },
  {
    value: "private",
    label: "Private",
    description: "Only you can see this want.",
  },
] as const;

export const PRODUCT_PRINCIPLES = {
  trustBeforeGrowth: "Trust before growth.",
  completedTradesAreProduct: "Completed trades are the product.",
  communicationRequiresContext: "Communication must always have context.",
} as const;
