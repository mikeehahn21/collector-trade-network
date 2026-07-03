import { Alert, ScrollView, Switch, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import {
  ITEM_CONDITIONS,
  ITEM_ERAS,
  SHIRT_SIZES,
  VINTAGE_CATEGORIES,
  WISHLIST_MATCH_PREFERENCES,
  WISHLIST_PRIORITIES,
  WISHLIST_VISIBILITY_OPTIONS,
} from "@ctn/constants";
import type {
  ItemCondition,
  ShirtSize,
  VintageCategory,
  WishlistMatchPreference,
  WishlistPriority,
  WishlistVisibility,
} from "@ctn/types";

import { AppButton } from "@/components/app-button";
import { AppTextField } from "@/components/app-text-field";
import { Chip } from "@/components/chip";
import { ChoiceCard } from "@/components/choice-card";
import { Screen } from "@/components/screen";
import { getWishlistPublishCheck } from "@/lib/wishlist-validation";
import { useWishlistState } from "@/state/wishlist-state";
import { useTheme } from "@/theme/theme-provider";

export default function EditWishlistItemScreen() {
  const { wishlistItemId } = useLocalSearchParams<{ wishlistItemId: string }>();
  const router = useRouter();
  const theme = useTheme();
  const api = useApiClient();
  const { getWishlistItem, updateWishlistItem, upsertWishlistItemFromServer } = useWishlistState();
  const item = getWishlistItem(wishlistItemId);

  if (!item) {
    return (
      <Screen>
        <Text style={{ color: theme.colors.textPrimary }}>Wishlist item not found.</Text>
      </Screen>
    );
  }

  function updateGrail(isGrail: boolean) {
    const result = updateWishlistItem(item.id, { isGrail });
    if (!result.ok) {
      Alert.alert("Grail limit reached", result.message);
    }
  }

  async function save() {
    const check = getWishlistPublishCheck(item);

    if (!check.isValid) {
      Alert.alert("Before saving", `Complete: ${check.missing.join(", ")}`);
      return;
    }

    try {
      const response = item.id.startsWith("wish_")
        ? await api.publishWishlistItem(item)
        : await api.updateWishlistItem(item.id, item);
      upsertWishlistItemFromServer(response.wishlistItem, item.id);
      router.push(`/wishlist/${response.wishlistItem.id}/save`);
    } catch {
      Alert.alert(
        "Saved locally",
        "We could not reach the server. This want remains cached and can sync later.",
      );
      router.push(`/wishlist/${item.id}/save`);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: theme.spacing.lg, paddingBottom: theme.spacing.xl }}>
        <View style={{ gap: theme.spacing.sm }}>
          <Text style={{ color: theme.colors.accent, fontSize: 12, fontWeight: "800" }}>
            WISH BUILDER
          </Text>
          <Text style={{ color: theme.colors.textPrimary, fontSize: 32, fontWeight: "900" }}>
            Define the hunt.
          </Text>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 16, lineHeight: 24 }}>
            The clearest wants become the strongest future demand signals.
          </Text>
        </View>

        <AppTextField
          label="Wanted item"
          onChangeText={(title) => updateWishlistItem(item.id, { title })}
          placeholder="Mosquitohead Soundgarden"
          value={item.title}
        />

        <Text style={{ color: theme.colors.textPrimary, fontSize: 16, fontWeight: "900" }}>Category</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>
          {VINTAGE_CATEGORIES.map((category) => (
            <Chip
              key={category.value}
              label={category.label}
              onPress={() =>
                updateWishlistItem(item.id, { category: category.value as VintageCategory })
              }
              selected={item.category === category.value}
            />
          ))}
        </View>

        <Text style={{ color: theme.colors.textPrimary, fontSize: 16, fontWeight: "900" }}>Size</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>
          {SHIRT_SIZES.map((size) => (
            <Chip
              key={size.value}
              label={size.label}
              onPress={() => updateWishlistItem(item.id, { size: size.value as ShirtSize })}
              selected={item.size === size.value}
            />
          ))}
        </View>

        <Text style={{ color: theme.colors.textPrimary, fontSize: 16, fontWeight: "900" }}>
          Preferred era
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>
          {ITEM_ERAS.map((era) => (
            <Chip
              key={era}
              label={era}
              onPress={() => updateWishlistItem(item.id, { preferredEra: era })}
              selected={item.preferredEra === era}
            />
          ))}
        </View>

        <AppTextField
          label="Preferred tag"
          onChangeText={(preferredTag) => updateWishlistItem(item.id, { preferredTag })}
          placeholder="Giant, Brockum, Screen Stars, any"
          value={item.preferredTag ?? ""}
        />

        <Text style={{ color: theme.colors.textPrimary, fontSize: 16, fontWeight: "900" }}>
          Preferred condition
        </Text>
        {ITEM_CONDITIONS.map((condition) => (
          <ChoiceCard
            description={condition.description}
            key={condition.value}
            label={condition.label}
            onPress={() =>
              updateWishlistItem(item.id, { preferredCondition: condition.value as ItemCondition })
            }
            selected={item.preferredCondition === condition.value}
          />
        ))}

        <Text style={{ color: theme.colors.textPrimary, fontSize: 16, fontWeight: "900" }}>Priority</Text>
        {WISHLIST_PRIORITIES.map((priority) => (
          <ChoiceCard
            description={priority.description}
            key={priority.value}
            label={priority.label}
            onPress={() => updateWishlistItem(item.id, { priority: priority.value as WishlistPriority })}
            selected={item.priority === priority.value}
          />
        ))}

        <View
          style={{
            alignItems: "center",
            backgroundColor: theme.colors.surface,
            borderColor: item.isGrail ? theme.colors.accent : theme.colors.border,
            borderRadius: theme.radius.md,
            borderWidth: 1,
            flexDirection: "row",
            justifyContent: "space-between",
            padding: theme.spacing.md,
          }}
        >
          <View style={{ flex: 1, paddingRight: theme.spacing.md }}>
            <Text style={{ color: theme.colors.textPrimary, fontSize: 16, fontWeight: "900" }}>
              Mark as Grail
            </Text>
            <Text style={{ color: theme.colors.textSecondary, fontSize: 14, lineHeight: 20 }}>
              Grails are limited and become the strongest demand signal later.
            </Text>
          </View>
          <Switch
            onValueChange={updateGrail}
            thumbColor={item.isGrail ? theme.colors.accent : theme.colors.textSecondary}
            value={item.isGrail}
          />
        </View>

        <Text style={{ color: theme.colors.textPrimary, fontSize: 16, fontWeight: "900" }}>
          Match preference
        </Text>
        {WISHLIST_MATCH_PREFERENCES.map((preference) => (
          <ChoiceCard
            description={preference.description}
            key={preference.value}
            label={preference.label}
            onPress={() =>
              updateWishlistItem(item.id, {
                matchPreference: preference.value as WishlistMatchPreference,
              })
            }
            selected={item.matchPreference === preference.value}
          />
        ))}

        <Text style={{ color: theme.colors.textPrimary, fontSize: 16, fontWeight: "900" }}>
          Visibility
        </Text>
        {WISHLIST_VISIBILITY_OPTIONS.map((visibility) => (
          <ChoiceCard
            description={visibility.description}
            key={visibility.value}
            label={visibility.label}
            onPress={() =>
              updateWishlistItem(item.id, { visibility: visibility.value as WishlistVisibility })
            }
            selected={item.visibility === visibility.value}
          />
        ))}

        <AppTextField
          label="Notes"
          multiline
          numberOfLines={4}
          onChangeText={(notes) => updateWishlistItem(item.id, { notes })}
          placeholder="What details matter? Print, year, condition tolerance, or why this is important."
          style={{ minHeight: 104, textAlignVertical: "top" }}
          value={item.notes ?? ""}
        />

        <View style={{ gap: theme.spacing.md }}>
          <AppButton accessibilityLabel="Save wishlist item" onPress={() => void save()}>
            Save want
          </AppButton>
          <AppButton
            accessibilityLabel="Archive wishlist item"
            onPress={() => router.push(`/wishlist/${item.id}/archive`)}
            variant="secondary"
          >
            Archive or delete
          </AppButton>
        </View>
      </ScrollView>
    </Screen>
  );
}
import { useApiClient } from "@/api/use-api-client";
