export type AccessMode = "invite_only" | "application" | "waitlist" | "public";

export type UserAccessStatus =
  "waitlisted" | "applied" | "invited" | "approved" | "active" | "suspended" | "rejected";

export type UserRole =
  "guest" | "applicant" | "active_trader" | "verified_collector" | "verified_seller" | "admin";

export type UserProfile = {
  id: string;
  clerkUserId: string;
  email: string;
  displayName: string;
  locationRegion?: string | undefined;
  bio?: string | undefined;
  socialHandle?: string | undefined;
  accessStatus: UserAccessStatus;
  roles: UserRole[];
  createdAt: string;
  updatedAt: string;
};

export type AccessApplication = {
  id: string;
  name: string;
  email: string;
  socialHandle?: string | undefined;
  reason: string;
  status: "received" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
};

export type ConversationContextType = "item" | "trade" | "system";

export type ConversationMessageType = "text" | "image" | "system_event";

export type ConversationContextSummary = {
  type: ConversationContextType;
  id: string;
  title: string;
  subtitle?: string | undefined;
  thumbnailUri?: string | undefined;
  status?: string | undefined;
};

export type ConversationParticipant = {
  userId: string;
  displayName: string;
  lastReadMessageId?: string | undefined;
  lastReadAt?: string | undefined;
  lastTypingAt?: string | undefined;
  isTyping: boolean;
};

export type ConversationMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  senderDisplayName: string;
  content: string;
  type: ConversationMessageType;
  readAt?: string | undefined;
  createdAt: string;
};

export type Conversation = {
  id: string;
  contextType: ConversationContextType;
  contextId: string;
  context: ConversationContextSummary;
  participants: ConversationParticipant[];
  lastMessage?: ConversationMessage | undefined;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | undefined;
};

export type CreateConversationInput = {
  contextType: Exclude<ConversationContextType, "system">;
  contextId: string;
};

export type SendMessageInput = {
  content: string;
  type: Extract<ConversationMessageType, "text" | "image">;
};

export type MarkMessageReadInput = {
  readAt?: string | undefined;
};

export type ConversationTypingInput = {
  conversationId: string;
};

export type CollectorType = "collector" | "seller" | "seller_collector" | "new_to_vintage";

export type ShirtSize =
  "xs" | "s" | "m" | "l" | "xl" | "xxl" | "xxxl" | "one_size" | "measurements_matter";

export type VintageCategory =
  | "band"
  | "rap"
  | "harley"
  | "sports"
  | "wrestling"
  | "movie"
  | "anime"
  | "cartoon"
  | "three_d_emblem"
  | "streetwear"
  | "true_vintage_blanks";

export type TradeOfferPreference = "all_serious_offers" | "wishlist_only" | "restricted_categories";

export type CommunicationPreference =
  "approved_traders" | "verified_only" | "completed_trade_users" | "matching_signal_users";

export type ItemStatus =
  "draft" | "tradeable" | "pending_trade" | "reserved" | "traded" | "archived";

export type ItemCondition = "deadstock" | "excellent" | "very_good" | "good" | "fair" | "project";

export type ItemVisibility = "private" | "approved_members" | "verified_members";

export type ItemVerificationStatus = "pending" | "verified" | "failed";

export type ItemAiMetadata = {
  brand?: string | undefined;
  color?: string | undefined;
  condition?: ItemCondition | undefined;
  codeDetected?: string | undefined;
  consistencyNotes?: string | undefined;
  confidence?: "low" | "medium" | "high" | undefined;
};

export type MeasurementUnit = "in";

export type ItemMeasurements = {
  chest?: string | undefined;
  length?: string | undefined;
  shoulder?: string | undefined;
  sleeve?: string | undefined;
  unit: MeasurementUnit;
};

export type ItemPhoto = {
  id: string;
  uri: string;
  kind: "front" | "back" | "tag" | "flaw" | "detail";
  sortOrder: number;
  createdAt: string;
};

export type EstimatedValueRange = {
  min?: number | undefined;
  max?: number | undefined;
  currency: "USD";
};

export type TradeableItem = {
  id: string;
  ownerId: string;
  photos: ItemPhoto[];
  title: string;
  category?: VintageCategory | undefined;
  size?: ShirtSize | undefined;
  measurements: ItemMeasurements;
  era?: string | undefined;
  tag?: string | undefined;
  condition?: ItemCondition | undefined;
  flaws: string[];
  estimatedValue: EstimatedValueRange;
  status: ItemStatus;
  tradePreference?: TradeOfferPreference | undefined;
  tradeNotes?: string | undefined;
  visibility: ItemVisibility;
  communicationPreference: CommunicationPreference;
  allowsPhotoRequests: boolean;
  allowsMeasurementRequests: boolean;
  verificationVideoUrl?: string | undefined;
  verificationStatus: ItemVerificationStatus;
  verificationFailedReason?: string | undefined;
  verifiedAt?: string | undefined;
  aiMetadata?: ItemAiMetadata | undefined;
  aiSuggestions?: AiListingSuggestions | undefined;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | undefined;
  archivedAt?: string | undefined;
};

export type PublicCollectorSummary = {
  id: string;
  displayName: string;
  locationRegion?: string | undefined;
  roles: UserRole[];
};

export type PublicTradeableItem = TradeableItem & {
  owner: PublicCollectorSummary;
};

export type AiListingSuggestions = {
  title?: string | undefined;
  category?: VintageCategory | undefined;
  size?: ShirtSize | undefined;
  era?: string | undefined;
  condition?: ItemCondition | undefined;
  tag?: string | undefined;
  estimatedValue?: EstimatedValueRange | undefined;
  confidence: "low" | "medium" | "high";
  generatedAt: string;
};

export type CollectionSummary = {
  totalItems: number;
  tradeableItems: number;
  draftItems: number;
  archivedItems: number;
};

export type WishlistPriority = "low" | "medium" | "high";

export type WishlistMatchPreference = "exact" | "similar";

export type WishlistVisibility = "private" | "approved_members" | "verified_members";

export type WishlistItem = {
  id: string;
  ownerId: string;
  title: string;
  category?: VintageCategory | undefined;
  size?: ShirtSize | undefined;
  preferredEra?: string | undefined;
  preferredTag?: string | undefined;
  preferredCondition?: ItemCondition | undefined;
  notes?: string | undefined;
  priority: WishlistPriority;
  isGrail: boolean;
  matchPreference: WishlistMatchPreference;
  visibility: WishlistVisibility;
  isArchived: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | undefined;
};

export type WishlistSummary = {
  activeItems: number;
  archivedItems: number;
  grailItems: number;
  highPriorityItems: number;
};

export type RecommendationMatchType = "one_way" | "mutual" | "grail" | "exact" | "similar";

export type RecommendationConfidence = "low" | "medium" | "high";

export type RecommendationReason = {
  code:
    | "their_item_matches_your_wishlist"
    | "your_item_matches_their_wishlist"
    | "mutual_demand"
    | "grail_match"
    | "exact_match"
    | "similar_match"
    | "category_overlap"
    | "size_compatible"
    | "active_tradeable_inventory"
    | "profile_quality";
  label: string;
  detail: string;
  points: number;
};

export type RecommendationItemSummary = {
  id: string;
  ownerId: string;
  ownerDisplayName: string;
  title: string;
  category?: VintageCategory | undefined;
  size?: ShirtSize | undefined;
  status?: ItemStatus | undefined;
};

export type RecommendationWishlistSummary = {
  id: string;
  ownerId: string;
  ownerDisplayName: string;
  title: string;
  category?: VintageCategory | undefined;
  size?: ShirtSize | undefined;
  isGrail: boolean;
  matchPreference: WishlistMatchPreference;
  priority: WishlistPriority;
};

export type TradeRecommendation = {
  id: string;
  collectorId: string;
  counterpartyId: string;
  counterpartyDisplayName: string;
  matchTypes: RecommendationMatchType[];
  confidence: RecommendationConfidence;
  score: number;
  reasons: RecommendationReason[];
  yourMatchingItems: RecommendationItemSummary[];
  theirMatchingItems: RecommendationItemSummary[];
  yourMatchingWishlist: RecommendationWishlistSummary[];
  theirMatchingWishlist: RecommendationWishlistSummary[];
  sharedCategories: VintageCategory[];
  compatibleSizes: ShirtSize[];
  hasGrailMatch: boolean;
  hasExactMatch: boolean;
  isMutual: boolean;
  createdAt: string;
};

export type RecommendationSummary = {
  total: number;
  grailMatches: number;
  mutualMatches: number;
  newMatches: number;
};

export type RecommendationFeedbackRating = "helpful" | "not_relevant";

export type RecommendationFeedbackReason =
  "strong_match" | "wrong_category" | "wrong_size" | "not_interested" | "already_seen" | "other";

export type RecommendationFeedback = {
  id: string;
  userId: string;
  recommendationId: string;
  counterpartyId: string;
  targetItemId?: string | undefined;
  rating: RecommendationFeedbackRating;
  reason?: RecommendationFeedbackReason | undefined;
  notes?: string | undefined;
  createdAt: string;
  updatedAt: string;
};

export type RecommendationFeedbackMetrics = {
  totalFeedback: number;
  helpfulCount: number;
  notRelevantCount: number;
  helpfulRate: number;
  topNegativeReasons: Array<{
    reason: RecommendationFeedbackReason;
    count: number;
  }>;
  latestFeedbackAt?: string | undefined;
};

export type TradeStatus =
  "pending" | "accepted" | "declined" | "countered" | "cancelled" | "completed" | "disputed";

export type TradeShippingStatus = "pending" | "shipped" | "delivered";

export type TradeCarrier = "ups" | "usps" | "fedex" | "dhl" | "other";

export type TradeShippingSide = {
  status: TradeShippingStatus;
  trackingNumber?: string | undefined;
  carrier?: TradeCarrier | undefined;
};

export type TradeItemSummary = {
  id: string;
  ownerId: string;
  ownerDisplayName: string;
  title: string;
  category?: VintageCategory | undefined;
  size?: ShirtSize | undefined;
  status: ItemStatus;
};

export type Trade = {
  id: string;
  proposerId: string;
  proposerDisplayName: string;
  counterpartyId: string;
  counterpartyDisplayName: string;
  proposerItemId: string;
  counterpartyItemId: string;
  proposerItem: TradeItemSummary;
  counterpartyItem: TradeItemSummary;
  status: TradeStatus;
  proposerShipping: TradeShippingSide;
  counterpartyShipping: TradeShippingSide;
  proposerNotes?: string | undefined;
  counterpartyNotes?: string | undefined;
  completedAt?: string | undefined;
  disputedAt?: string | undefined;
  disputeReason?: string | undefined;
  viewerRole: "proposer" | "counterparty";
  createdAt: string;
  updatedAt: string;
};

export type CreateTradeInput = {
  proposerItemId: string;
  counterpartyItemId: string;
  proposerNotes?: string | undefined;
};

export type UpdateTradeStatusInput = {
  status: Extract<TradeStatus, "accepted" | "declined" | "cancelled">;
};

export type CounterTradeInput = {
  proposerItemId: string;
  counterpartyItemId: string;
  counterpartyNotes?: string | undefined;
};

export type ShipTradeInput = {
  trackingNumber: string;
  carrier: TradeCarrier;
};

export type DisputeTradeInput = {
  reason: string;
};

export type TradeSummary = {
  incoming: number;
  sent: number;
  history: number;
};

export type OnboardingProfile = {
  displayName: string;
  locationRegion: string;
  bio?: string | undefined;
  socialHandle?: string | undefined;
};

export type OnboardingState = {
  accessStatus: UserAccessStatus;
  email?: string | undefined;
  phone?: string | undefined;
  inviteCode?: string | undefined;
  profile?: OnboardingProfile | undefined;
  collectorType?: CollectorType | undefined;
  wornSizes: ShirtSize[];
  collectedSizes: ShirtSize[];
  categories: VintageCategory[];
  tradePreference?: TradeOfferPreference | undefined;
  acceptsCashAdjustments: boolean;
  communicationPreference?: CommunicationPreference | undefined;
  allowsPhotoRequests: boolean;
  allowsMeasurementRequests: boolean;
  notificationsEnabled: boolean;
  completedAt?: string | undefined;
};

export type ApiHealth = {
  status: "ok";
  service: string;
  version: string;
};

export type ItemVerificationVideoInput = {
  videoUrl: string;
  durationSeconds: number;
  verificationCode: string;
};

export type AiReviewWebhookInput = {
  itemId: string;
  status: Extract<ItemVerificationStatus, "verified" | "failed">;
  verificationFailedReason?: string | undefined;
  aiMetadata?: ItemAiMetadata | undefined;
};
