import { z } from "zod";
export declare const environmentSchema: z.ZodEnum<["local", "development", "staging", "production"]>;
export declare const conversationContextSchema: z.ZodEnum<["item", "trade", "system"]>;
export declare const collectorTypeSchema: z.ZodEnum<["collector", "seller", "seller_collector", "new_to_vintage"]>;
export declare const shirtSizeSchema: z.ZodEnum<["xs", "s", "m", "l", "xl", "xxl", "xxxl", "one_size", "measurements_matter"]>;
export declare const vintageCategorySchema: z.ZodEnum<["band", "rap", "harley", "sports", "wrestling", "movie", "anime", "cartoon", "three_d_emblem", "streetwear", "true_vintage_blanks"]>;
export declare const tradeOfferPreferenceSchema: z.ZodEnum<["all_serious_offers", "wishlist_only", "restricted_categories"]>;
export declare const communicationPreferenceSchema: z.ZodEnum<["approved_traders", "verified_only", "completed_trade_users", "matching_signal_users"]>;
export declare const itemStatusSchema: z.ZodEnum<["draft", "tradeable", "pending_trade", "reserved", "traded", "archived"]>;
export declare const itemConditionSchema: z.ZodEnum<["deadstock", "excellent", "very_good", "good", "fair", "project"]>;
export declare const itemVisibilitySchema: z.ZodEnum<["private", "approved_members", "verified_members"]>;
export declare const itemPhotoSchema: z.ZodObject<{
    id: z.ZodString;
    uri: z.ZodString;
    kind: z.ZodEnum<["front", "back", "tag", "flaw", "detail"]>;
    sortOrder: z.ZodNumber;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    uri: string;
    kind: "front" | "back" | "tag" | "flaw" | "detail";
    sortOrder: number;
    createdAt: string;
}, {
    id: string;
    uri: string;
    kind: "front" | "back" | "tag" | "flaw" | "detail";
    sortOrder: number;
    createdAt: string;
}>;
export declare const itemMeasurementsSchema: z.ZodObject<{
    chest: z.ZodOptional<z.ZodString>;
    length: z.ZodOptional<z.ZodString>;
    shoulder: z.ZodOptional<z.ZodString>;
    sleeve: z.ZodOptional<z.ZodString>;
    unit: z.ZodDefault<z.ZodLiteral<"in">>;
}, "strip", z.ZodTypeAny, {
    unit: "in";
    length?: string | undefined;
    chest?: string | undefined;
    shoulder?: string | undefined;
    sleeve?: string | undefined;
}, {
    length?: string | undefined;
    chest?: string | undefined;
    shoulder?: string | undefined;
    sleeve?: string | undefined;
    unit?: "in" | undefined;
}>;
export declare const estimatedValueRangeSchema: z.ZodEffects<z.ZodObject<{
    min: z.ZodOptional<z.ZodNumber>;
    max: z.ZodOptional<z.ZodNumber>;
    currency: z.ZodDefault<z.ZodLiteral<"USD">>;
}, "strip", z.ZodTypeAny, {
    currency: "USD";
    min?: number | undefined;
    max?: number | undefined;
}, {
    min?: number | undefined;
    max?: number | undefined;
    currency?: "USD" | undefined;
}>, {
    currency: "USD";
    min?: number | undefined;
    max?: number | undefined;
}, {
    min?: number | undefined;
    max?: number | undefined;
    currency?: "USD" | undefined;
}>;
export declare const aiListingSuggestionsSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodEnum<["band", "rap", "harley", "sports", "wrestling", "movie", "anime", "cartoon", "three_d_emblem", "streetwear", "true_vintage_blanks"]>>;
    size: z.ZodOptional<z.ZodEnum<["xs", "s", "m", "l", "xl", "xxl", "xxxl", "one_size", "measurements_matter"]>>;
    era: z.ZodOptional<z.ZodString>;
    condition: z.ZodOptional<z.ZodEnum<["deadstock", "excellent", "very_good", "good", "fair", "project"]>>;
    tag: z.ZodOptional<z.ZodString>;
    estimatedValue: z.ZodOptional<z.ZodEffects<z.ZodObject<{
        min: z.ZodOptional<z.ZodNumber>;
        max: z.ZodOptional<z.ZodNumber>;
        currency: z.ZodDefault<z.ZodLiteral<"USD">>;
    }, "strip", z.ZodTypeAny, {
        currency: "USD";
        min?: number | undefined;
        max?: number | undefined;
    }, {
        min?: number | undefined;
        max?: number | undefined;
        currency?: "USD" | undefined;
    }>, {
        currency: "USD";
        min?: number | undefined;
        max?: number | undefined;
    }, {
        min?: number | undefined;
        max?: number | undefined;
        currency?: "USD" | undefined;
    }>>;
    confidence: z.ZodEnum<["low", "medium", "high"]>;
    generatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    confidence: "low" | "medium" | "high";
    generatedAt: string;
    tag?: string | undefined;
    title?: string | undefined;
    category?: "band" | "rap" | "harley" | "sports" | "wrestling" | "movie" | "anime" | "cartoon" | "three_d_emblem" | "streetwear" | "true_vintage_blanks" | undefined;
    size?: "xs" | "s" | "m" | "l" | "xl" | "xxl" | "xxxl" | "one_size" | "measurements_matter" | undefined;
    era?: string | undefined;
    condition?: "deadstock" | "excellent" | "very_good" | "good" | "fair" | "project" | undefined;
    estimatedValue?: {
        currency: "USD";
        min?: number | undefined;
        max?: number | undefined;
    } | undefined;
}, {
    confidence: "low" | "medium" | "high";
    generatedAt: string;
    tag?: string | undefined;
    title?: string | undefined;
    category?: "band" | "rap" | "harley" | "sports" | "wrestling" | "movie" | "anime" | "cartoon" | "three_d_emblem" | "streetwear" | "true_vintage_blanks" | undefined;
    size?: "xs" | "s" | "m" | "l" | "xl" | "xxl" | "xxxl" | "one_size" | "measurements_matter" | undefined;
    era?: string | undefined;
    condition?: "deadstock" | "excellent" | "very_good" | "good" | "fair" | "project" | undefined;
    estimatedValue?: {
        min?: number | undefined;
        max?: number | undefined;
        currency?: "USD" | undefined;
    } | undefined;
}>;
export declare const tradeableItemDraftSchema: z.ZodObject<{
    photos: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        uri: z.ZodString;
        kind: z.ZodEnum<["front", "back", "tag", "flaw", "detail"]>;
        sortOrder: z.ZodNumber;
        createdAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        uri: string;
        kind: "front" | "back" | "tag" | "flaw" | "detail";
        sortOrder: number;
        createdAt: string;
    }, {
        id: string;
        uri: string;
        kind: "front" | "back" | "tag" | "flaw" | "detail";
        sortOrder: number;
        createdAt: string;
    }>, "many">>;
    title: z.ZodDefault<z.ZodString>;
    category: z.ZodOptional<z.ZodEnum<["band", "rap", "harley", "sports", "wrestling", "movie", "anime", "cartoon", "three_d_emblem", "streetwear", "true_vintage_blanks"]>>;
    size: z.ZodOptional<z.ZodEnum<["xs", "s", "m", "l", "xl", "xxl", "xxxl", "one_size", "measurements_matter"]>>;
    measurements: z.ZodDefault<z.ZodObject<{
        chest: z.ZodOptional<z.ZodString>;
        length: z.ZodOptional<z.ZodString>;
        shoulder: z.ZodOptional<z.ZodString>;
        sleeve: z.ZodOptional<z.ZodString>;
        unit: z.ZodDefault<z.ZodLiteral<"in">>;
    }, "strip", z.ZodTypeAny, {
        unit: "in";
        length?: string | undefined;
        chest?: string | undefined;
        shoulder?: string | undefined;
        sleeve?: string | undefined;
    }, {
        length?: string | undefined;
        chest?: string | undefined;
        shoulder?: string | undefined;
        sleeve?: string | undefined;
        unit?: "in" | undefined;
    }>>;
    era: z.ZodOptional<z.ZodString>;
    tag: z.ZodOptional<z.ZodString>;
    condition: z.ZodOptional<z.ZodEnum<["deadstock", "excellent", "very_good", "good", "fair", "project"]>>;
    flaws: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    estimatedValue: z.ZodDefault<z.ZodEffects<z.ZodObject<{
        min: z.ZodOptional<z.ZodNumber>;
        max: z.ZodOptional<z.ZodNumber>;
        currency: z.ZodDefault<z.ZodLiteral<"USD">>;
    }, "strip", z.ZodTypeAny, {
        currency: "USD";
        min?: number | undefined;
        max?: number | undefined;
    }, {
        min?: number | undefined;
        max?: number | undefined;
        currency?: "USD" | undefined;
    }>, {
        currency: "USD";
        min?: number | undefined;
        max?: number | undefined;
    }, {
        min?: number | undefined;
        max?: number | undefined;
        currency?: "USD" | undefined;
    }>>;
    status: z.ZodDefault<z.ZodEnum<["draft", "tradeable", "pending_trade", "reserved", "traded", "archived"]>>;
    tradePreference: z.ZodOptional<z.ZodEnum<["all_serious_offers", "wishlist_only", "restricted_categories"]>>;
    tradeNotes: z.ZodOptional<z.ZodString>;
    visibility: z.ZodDefault<z.ZodEnum<["private", "approved_members", "verified_members"]>>;
    communicationPreference: z.ZodDefault<z.ZodEnum<["approved_traders", "verified_only", "completed_trade_users", "matching_signal_users"]>>;
    allowsPhotoRequests: z.ZodDefault<z.ZodBoolean>;
    allowsMeasurementRequests: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    status: "draft" | "tradeable" | "pending_trade" | "reserved" | "traded" | "archived";
    title: string;
    estimatedValue: {
        currency: "USD";
        min?: number | undefined;
        max?: number | undefined;
    };
    photos: {
        id: string;
        uri: string;
        kind: "front" | "back" | "tag" | "flaw" | "detail";
        sortOrder: number;
        createdAt: string;
    }[];
    measurements: {
        unit: "in";
        length?: string | undefined;
        chest?: string | undefined;
        shoulder?: string | undefined;
        sleeve?: string | undefined;
    };
    flaws: string[];
    visibility: "private" | "approved_members" | "verified_members";
    communicationPreference: "approved_traders" | "verified_only" | "completed_trade_users" | "matching_signal_users";
    allowsPhotoRequests: boolean;
    allowsMeasurementRequests: boolean;
    tag?: string | undefined;
    category?: "band" | "rap" | "harley" | "sports" | "wrestling" | "movie" | "anime" | "cartoon" | "three_d_emblem" | "streetwear" | "true_vintage_blanks" | undefined;
    size?: "xs" | "s" | "m" | "l" | "xl" | "xxl" | "xxxl" | "one_size" | "measurements_matter" | undefined;
    era?: string | undefined;
    condition?: "deadstock" | "excellent" | "very_good" | "good" | "fair" | "project" | undefined;
    tradePreference?: "all_serious_offers" | "wishlist_only" | "restricted_categories" | undefined;
    tradeNotes?: string | undefined;
}, {
    tag?: string | undefined;
    status?: "draft" | "tradeable" | "pending_trade" | "reserved" | "traded" | "archived" | undefined;
    title?: string | undefined;
    category?: "band" | "rap" | "harley" | "sports" | "wrestling" | "movie" | "anime" | "cartoon" | "three_d_emblem" | "streetwear" | "true_vintage_blanks" | undefined;
    size?: "xs" | "s" | "m" | "l" | "xl" | "xxl" | "xxxl" | "one_size" | "measurements_matter" | undefined;
    era?: string | undefined;
    condition?: "deadstock" | "excellent" | "very_good" | "good" | "fair" | "project" | undefined;
    estimatedValue?: {
        min?: number | undefined;
        max?: number | undefined;
        currency?: "USD" | undefined;
    } | undefined;
    photos?: {
        id: string;
        uri: string;
        kind: "front" | "back" | "tag" | "flaw" | "detail";
        sortOrder: number;
        createdAt: string;
    }[] | undefined;
    measurements?: {
        length?: string | undefined;
        chest?: string | undefined;
        shoulder?: string | undefined;
        sleeve?: string | undefined;
        unit?: "in" | undefined;
    } | undefined;
    flaws?: string[] | undefined;
    tradePreference?: "all_serious_offers" | "wishlist_only" | "restricted_categories" | undefined;
    tradeNotes?: string | undefined;
    visibility?: "private" | "approved_members" | "verified_members" | undefined;
    communicationPreference?: "approved_traders" | "verified_only" | "completed_trade_users" | "matching_signal_users" | undefined;
    allowsPhotoRequests?: boolean | undefined;
    allowsMeasurementRequests?: boolean | undefined;
}>;
export declare const tradeableItemPublishSchema: z.ZodObject<{
    measurements: z.ZodDefault<z.ZodObject<{
        chest: z.ZodOptional<z.ZodString>;
        length: z.ZodOptional<z.ZodString>;
        shoulder: z.ZodOptional<z.ZodString>;
        sleeve: z.ZodOptional<z.ZodString>;
        unit: z.ZodDefault<z.ZodLiteral<"in">>;
    }, "strip", z.ZodTypeAny, {
        unit: "in";
        length?: string | undefined;
        chest?: string | undefined;
        shoulder?: string | undefined;
        sleeve?: string | undefined;
    }, {
        length?: string | undefined;
        chest?: string | undefined;
        shoulder?: string | undefined;
        sleeve?: string | undefined;
        unit?: "in" | undefined;
    }>>;
    era: z.ZodOptional<z.ZodString>;
    flaws: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    estimatedValue: z.ZodDefault<z.ZodEffects<z.ZodObject<{
        min: z.ZodOptional<z.ZodNumber>;
        max: z.ZodOptional<z.ZodNumber>;
        currency: z.ZodDefault<z.ZodLiteral<"USD">>;
    }, "strip", z.ZodTypeAny, {
        currency: "USD";
        min?: number | undefined;
        max?: number | undefined;
    }, {
        min?: number | undefined;
        max?: number | undefined;
        currency?: "USD" | undefined;
    }>, {
        currency: "USD";
        min?: number | undefined;
        max?: number | undefined;
    }, {
        min?: number | undefined;
        max?: number | undefined;
        currency?: "USD" | undefined;
    }>>;
    tradeNotes: z.ZodOptional<z.ZodString>;
    communicationPreference: z.ZodDefault<z.ZodEnum<["approved_traders", "verified_only", "completed_trade_users", "matching_signal_users"]>>;
    allowsPhotoRequests: z.ZodDefault<z.ZodBoolean>;
    allowsMeasurementRequests: z.ZodDefault<z.ZodBoolean>;
} & {
    photos: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        uri: z.ZodString;
        kind: z.ZodEnum<["front", "back", "tag", "flaw", "detail"]>;
        sortOrder: z.ZodNumber;
        createdAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        uri: string;
        kind: "front" | "back" | "tag" | "flaw" | "detail";
        sortOrder: number;
        createdAt: string;
    }, {
        id: string;
        uri: string;
        kind: "front" | "back" | "tag" | "flaw" | "detail";
        sortOrder: number;
        createdAt: string;
    }>, "many">;
    title: z.ZodString;
    category: z.ZodEnum<["band", "rap", "harley", "sports", "wrestling", "movie", "anime", "cartoon", "three_d_emblem", "streetwear", "true_vintage_blanks"]>;
    size: z.ZodEnum<["xs", "s", "m", "l", "xl", "xxl", "xxxl", "one_size", "measurements_matter"]>;
    tag: z.ZodString;
    condition: z.ZodEnum<["deadstock", "excellent", "very_good", "good", "fair", "project"]>;
    status: z.ZodLiteral<"tradeable">;
    tradePreference: z.ZodEnum<["all_serious_offers", "wishlist_only", "restricted_categories"]>;
    visibility: z.ZodEnum<["approved_members", "verified_members"]>;
}, "strip", z.ZodTypeAny, {
    tag: string;
    status: "tradeable";
    title: string;
    category: "band" | "rap" | "harley" | "sports" | "wrestling" | "movie" | "anime" | "cartoon" | "three_d_emblem" | "streetwear" | "true_vintage_blanks";
    size: "xs" | "s" | "m" | "l" | "xl" | "xxl" | "xxxl" | "one_size" | "measurements_matter";
    condition: "deadstock" | "excellent" | "very_good" | "good" | "fair" | "project";
    estimatedValue: {
        currency: "USD";
        min?: number | undefined;
        max?: number | undefined;
    };
    photos: {
        id: string;
        uri: string;
        kind: "front" | "back" | "tag" | "flaw" | "detail";
        sortOrder: number;
        createdAt: string;
    }[];
    measurements: {
        unit: "in";
        length?: string | undefined;
        chest?: string | undefined;
        shoulder?: string | undefined;
        sleeve?: string | undefined;
    };
    flaws: string[];
    tradePreference: "all_serious_offers" | "wishlist_only" | "restricted_categories";
    visibility: "approved_members" | "verified_members";
    communicationPreference: "approved_traders" | "verified_only" | "completed_trade_users" | "matching_signal_users";
    allowsPhotoRequests: boolean;
    allowsMeasurementRequests: boolean;
    era?: string | undefined;
    tradeNotes?: string | undefined;
}, {
    tag: string;
    status: "tradeable";
    title: string;
    category: "band" | "rap" | "harley" | "sports" | "wrestling" | "movie" | "anime" | "cartoon" | "three_d_emblem" | "streetwear" | "true_vintage_blanks";
    size: "xs" | "s" | "m" | "l" | "xl" | "xxl" | "xxxl" | "one_size" | "measurements_matter";
    condition: "deadstock" | "excellent" | "very_good" | "good" | "fair" | "project";
    photos: {
        id: string;
        uri: string;
        kind: "front" | "back" | "tag" | "flaw" | "detail";
        sortOrder: number;
        createdAt: string;
    }[];
    tradePreference: "all_serious_offers" | "wishlist_only" | "restricted_categories";
    visibility: "approved_members" | "verified_members";
    era?: string | undefined;
    estimatedValue?: {
        min?: number | undefined;
        max?: number | undefined;
        currency?: "USD" | undefined;
    } | undefined;
    measurements?: {
        length?: string | undefined;
        chest?: string | undefined;
        shoulder?: string | undefined;
        sleeve?: string | undefined;
        unit?: "in" | undefined;
    } | undefined;
    flaws?: string[] | undefined;
    tradeNotes?: string | undefined;
    communicationPreference?: "approved_traders" | "verified_only" | "completed_trade_users" | "matching_signal_users" | undefined;
    allowsPhotoRequests?: boolean | undefined;
    allowsMeasurementRequests?: boolean | undefined;
}>;
export declare const wishlistPrioritySchema: z.ZodEnum<["low", "medium", "high"]>;
export declare const wishlistMatchPreferenceSchema: z.ZodEnum<["exact", "similar"]>;
export declare const wishlistVisibilitySchema: z.ZodEnum<["private", "approved_members", "verified_members"]>;
export declare const wishlistItemDraftSchema: z.ZodObject<{
    title: z.ZodDefault<z.ZodString>;
    category: z.ZodOptional<z.ZodEnum<["band", "rap", "harley", "sports", "wrestling", "movie", "anime", "cartoon", "three_d_emblem", "streetwear", "true_vintage_blanks"]>>;
    size: z.ZodOptional<z.ZodEnum<["xs", "s", "m", "l", "xl", "xxl", "xxxl", "one_size", "measurements_matter"]>>;
    preferredEra: z.ZodOptional<z.ZodString>;
    preferredTag: z.ZodOptional<z.ZodString>;
    preferredCondition: z.ZodOptional<z.ZodEnum<["deadstock", "excellent", "very_good", "good", "fair", "project"]>>;
    notes: z.ZodOptional<z.ZodString>;
    priority: z.ZodDefault<z.ZodEnum<["low", "medium", "high"]>>;
    isGrail: z.ZodDefault<z.ZodBoolean>;
    matchPreference: z.ZodDefault<z.ZodEnum<["exact", "similar"]>>;
    visibility: z.ZodDefault<z.ZodEnum<["private", "approved_members", "verified_members"]>>;
    isArchived: z.ZodDefault<z.ZodBoolean>;
    sortOrder: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    sortOrder: number;
    title: string;
    visibility: "private" | "approved_members" | "verified_members";
    priority: "low" | "medium" | "high";
    isGrail: boolean;
    matchPreference: "exact" | "similar";
    isArchived: boolean;
    category?: "band" | "rap" | "harley" | "sports" | "wrestling" | "movie" | "anime" | "cartoon" | "three_d_emblem" | "streetwear" | "true_vintage_blanks" | undefined;
    size?: "xs" | "s" | "m" | "l" | "xl" | "xxl" | "xxxl" | "one_size" | "measurements_matter" | undefined;
    preferredEra?: string | undefined;
    preferredTag?: string | undefined;
    preferredCondition?: "deadstock" | "excellent" | "very_good" | "good" | "fair" | "project" | undefined;
    notes?: string | undefined;
}, {
    sortOrder?: number | undefined;
    title?: string | undefined;
    category?: "band" | "rap" | "harley" | "sports" | "wrestling" | "movie" | "anime" | "cartoon" | "three_d_emblem" | "streetwear" | "true_vintage_blanks" | undefined;
    size?: "xs" | "s" | "m" | "l" | "xl" | "xxl" | "xxxl" | "one_size" | "measurements_matter" | undefined;
    visibility?: "private" | "approved_members" | "verified_members" | undefined;
    preferredEra?: string | undefined;
    preferredTag?: string | undefined;
    preferredCondition?: "deadstock" | "excellent" | "very_good" | "good" | "fair" | "project" | undefined;
    notes?: string | undefined;
    priority?: "low" | "medium" | "high" | undefined;
    isGrail?: boolean | undefined;
    matchPreference?: "exact" | "similar" | undefined;
    isArchived?: boolean | undefined;
}>;
export declare const wishlistItemPublishSchema: z.ZodObject<{
    size: z.ZodOptional<z.ZodEnum<["xs", "s", "m", "l", "xl", "xxl", "xxxl", "one_size", "measurements_matter"]>>;
    preferredEra: z.ZodOptional<z.ZodString>;
    preferredTag: z.ZodOptional<z.ZodString>;
    preferredCondition: z.ZodOptional<z.ZodEnum<["deadstock", "excellent", "very_good", "good", "fair", "project"]>>;
    notes: z.ZodOptional<z.ZodString>;
    priority: z.ZodDefault<z.ZodEnum<["low", "medium", "high"]>>;
    isGrail: z.ZodDefault<z.ZodBoolean>;
    matchPreference: z.ZodDefault<z.ZodEnum<["exact", "similar"]>>;
    visibility: z.ZodDefault<z.ZodEnum<["private", "approved_members", "verified_members"]>>;
    isArchived: z.ZodDefault<z.ZodBoolean>;
    sortOrder: z.ZodDefault<z.ZodNumber>;
} & {
    title: z.ZodString;
    category: z.ZodEnum<["band", "rap", "harley", "sports", "wrestling", "movie", "anime", "cartoon", "three_d_emblem", "streetwear", "true_vintage_blanks"]>;
}, "strip", z.ZodTypeAny, {
    sortOrder: number;
    title: string;
    category: "band" | "rap" | "harley" | "sports" | "wrestling" | "movie" | "anime" | "cartoon" | "three_d_emblem" | "streetwear" | "true_vintage_blanks";
    visibility: "private" | "approved_members" | "verified_members";
    priority: "low" | "medium" | "high";
    isGrail: boolean;
    matchPreference: "exact" | "similar";
    isArchived: boolean;
    size?: "xs" | "s" | "m" | "l" | "xl" | "xxl" | "xxxl" | "one_size" | "measurements_matter" | undefined;
    preferredEra?: string | undefined;
    preferredTag?: string | undefined;
    preferredCondition?: "deadstock" | "excellent" | "very_good" | "good" | "fair" | "project" | undefined;
    notes?: string | undefined;
}, {
    title: string;
    category: "band" | "rap" | "harley" | "sports" | "wrestling" | "movie" | "anime" | "cartoon" | "three_d_emblem" | "streetwear" | "true_vintage_blanks";
    sortOrder?: number | undefined;
    size?: "xs" | "s" | "m" | "l" | "xl" | "xxl" | "xxxl" | "one_size" | "measurements_matter" | undefined;
    visibility?: "private" | "approved_members" | "verified_members" | undefined;
    preferredEra?: string | undefined;
    preferredTag?: string | undefined;
    preferredCondition?: "deadstock" | "excellent" | "very_good" | "good" | "fair" | "project" | undefined;
    notes?: string | undefined;
    priority?: "low" | "medium" | "high" | undefined;
    isGrail?: boolean | undefined;
    matchPreference?: "exact" | "similar" | undefined;
    isArchived?: boolean | undefined;
}>;
export declare const accessRequestSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    socialHandle: z.ZodOptional<z.ZodString>;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    reason: string;
    socialHandle?: string | undefined;
}, {
    name: string;
    email: string;
    reason: string;
    socialHandle?: string | undefined;
}>;
export declare const userProfileUpsertSchema: z.ZodObject<{
    email: z.ZodString;
    displayName: z.ZodString;
    locationRegion: z.ZodOptional<z.ZodString>;
    bio: z.ZodOptional<z.ZodString>;
    socialHandle: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    displayName: string;
    socialHandle?: string | undefined;
    locationRegion?: string | undefined;
    bio?: string | undefined;
}, {
    email: string;
    displayName: string;
    socialHandle?: string | undefined;
    locationRegion?: string | undefined;
    bio?: string | undefined;
}>;
export declare const createAccountSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const inviteCodeSchema: z.ZodObject<{
    code: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: string;
}, {
    code: string;
}>;
export declare const onboardingProfileSchema: z.ZodObject<{
    displayName: z.ZodString;
    locationRegion: z.ZodString;
    bio: z.ZodOptional<z.ZodString>;
    socialHandle: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    displayName: string;
    locationRegion: string;
    socialHandle?: string | undefined;
    bio?: string | undefined;
}, {
    displayName: string;
    locationRegion: string;
    socialHandle?: string | undefined;
    bio?: string | undefined;
}>;
export declare const onboardingPreferencesSchema: z.ZodObject<{
    collectorType: z.ZodEnum<["collector", "seller", "seller_collector", "new_to_vintage"]>;
    wornSizes: z.ZodArray<z.ZodEnum<["xs", "s", "m", "l", "xl", "xxl", "xxxl", "one_size", "measurements_matter"]>, "many">;
    collectedSizes: z.ZodArray<z.ZodEnum<["xs", "s", "m", "l", "xl", "xxl", "xxxl", "one_size", "measurements_matter"]>, "many">;
    categories: z.ZodArray<z.ZodEnum<["band", "rap", "harley", "sports", "wrestling", "movie", "anime", "cartoon", "three_d_emblem", "streetwear", "true_vintage_blanks"]>, "many">;
    tradePreference: z.ZodEnum<["all_serious_offers", "wishlist_only", "restricted_categories"]>;
    acceptsCashAdjustments: z.ZodBoolean;
    communicationPreference: z.ZodEnum<["approved_traders", "verified_only", "completed_trade_users", "matching_signal_users"]>;
    allowsPhotoRequests: z.ZodBoolean;
    allowsMeasurementRequests: z.ZodBoolean;
    notificationsEnabled: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    tradePreference: "all_serious_offers" | "wishlist_only" | "restricted_categories";
    communicationPreference: "approved_traders" | "verified_only" | "completed_trade_users" | "matching_signal_users";
    allowsPhotoRequests: boolean;
    allowsMeasurementRequests: boolean;
    collectorType: "collector" | "seller" | "seller_collector" | "new_to_vintage";
    wornSizes: ("xs" | "s" | "m" | "l" | "xl" | "xxl" | "xxxl" | "one_size" | "measurements_matter")[];
    collectedSizes: ("xs" | "s" | "m" | "l" | "xl" | "xxl" | "xxxl" | "one_size" | "measurements_matter")[];
    categories: ("band" | "rap" | "harley" | "sports" | "wrestling" | "movie" | "anime" | "cartoon" | "three_d_emblem" | "streetwear" | "true_vintage_blanks")[];
    acceptsCashAdjustments: boolean;
    notificationsEnabled: boolean;
}, {
    tradePreference: "all_serious_offers" | "wishlist_only" | "restricted_categories";
    communicationPreference: "approved_traders" | "verified_only" | "completed_trade_users" | "matching_signal_users";
    allowsPhotoRequests: boolean;
    allowsMeasurementRequests: boolean;
    collectorType: "collector" | "seller" | "seller_collector" | "new_to_vintage";
    wornSizes: ("xs" | "s" | "m" | "l" | "xl" | "xxl" | "xxxl" | "one_size" | "measurements_matter")[];
    collectedSizes: ("xs" | "s" | "m" | "l" | "xl" | "xxl" | "xxxl" | "one_size" | "measurements_matter")[];
    categories: ("band" | "rap" | "harley" | "sports" | "wrestling" | "movie" | "anime" | "cartoon" | "three_d_emblem" | "streetwear" | "true_vintage_blanks")[];
    acceptsCashAdjustments: boolean;
    notificationsEnabled: boolean;
}>;
export declare const healthResponseSchema: z.ZodObject<{
    status: z.ZodLiteral<"ok">;
    service: z.ZodString;
    version: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: "ok";
    service: string;
    version: string;
}, {
    status: "ok";
    service: string;
    version: string;
}>;
