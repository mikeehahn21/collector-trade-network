import type { ComponentType, PropsWithChildren, ReactNode } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import type { KeyboardTypeOptions, TextInputProps } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import type { SafeAreaViewProps } from "react-native-safe-area-context";

import type { TradeableItem, WishlistItem } from "@ctn/types";

import { categoryLabels, sizeLabels, statusLabels } from "@/lib/item-display";
import { wishlistMatchPreferenceLabels, wishlistPriorityLabels } from "@/lib/wishlist-display";
import { betaTokens as beta } from "@/manual/beta-tokens";

const SafeAreaView = RNSafeAreaView as unknown as ComponentType<SafeAreaViewProps>;

type BetaButtonProps = PropsWithChildren<{
  accessibilityLabel: string;
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost" | "black";
}>;

export function BetaScreen({ children }: PropsWithChildren) {
  return (
    <SafeAreaView style={{ backgroundColor: beta.colors.canvas, flex: 1 }}>
      <View
        style={{
          alignSelf: "center",
          flex: 1,
          maxWidth: 720,
          padding: beta.spacing.lg,
          width: "100%",
        }}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}

export function BetaButton({
  accessibilityLabel,
  children,
  disabled,
  loading,
  onPress,
  variant = "primary",
}: BetaButtonProps) {
  const isDisabled = disabled || loading;
  const backgroundColor =
    variant === "primary"
      ? beta.colors.orange
      : variant === "black"
        ? beta.colors.ink
        : variant === "secondary"
          ? beta.colors.surface
          : "transparent";
  const color =
    variant === "primary" || variant === "black"
      ? beta.colors.surface
      : variant === "ghost"
        ? beta.colors.inkMuted
        : beta.colors.ink;
  const content: ReactNode =
    typeof children === "string" || typeof children === "number" ? (
      <Text style={{ color, fontSize: 16, fontWeight: "800" }}>{children}</Text>
    ) : (
      children
    );

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: "center",
        backgroundColor:
          pressed && variant === "primary" ? beta.colors.orangePressed : backgroundColor,
        borderColor: variant === "ghost" ? "transparent" : beta.colors.border,
        borderRadius: beta.radius.md,
        borderWidth: variant === "primary" || variant === "black" ? 0 : 1,
        justifyContent: "center",
        minHeight: 52,
        opacity: isDisabled ? 0.45 : pressed ? 0.9 : 1,
        paddingHorizontal: beta.spacing.lg,
      })}
    >
      {loading ? <ActivityIndicator color={color} /> : content}
    </Pressable>
  );
}

export function BetaKicker({ children }: PropsWithChildren) {
  return (
    <Text style={{ color: beta.colors.orange, fontSize: 12, fontWeight: "900" }}>{children}</Text>
  );
}

export function BetaTitle({ children, size = 32 }: PropsWithChildren<{ size?: number }>) {
  return (
    <Text
      style={{ color: beta.colors.ink, fontSize: size, fontWeight: "900", lineHeight: size + 5 }}
    >
      {children}
    </Text>
  );
}

export function BetaBody({ children }: PropsWithChildren) {
  return (
    <Text style={{ color: beta.colors.inkMuted, fontSize: 16, lineHeight: 24 }}>{children}</Text>
  );
}

export function BetaPanel({
  children,
  tone = "white",
}: PropsWithChildren<{ tone?: "white" | "peach" | "black" }>) {
  const isBlack = tone === "black";
  return (
    <View
      style={{
        backgroundColor:
          tone === "peach"
            ? beta.colors.orangeSoft
            : isBlack
              ? beta.colors.ink
              : beta.colors.surface,
        borderColor:
          tone === "peach" ? beta.colors.orange : isBlack ? beta.colors.ink : beta.colors.border,
        borderRadius: beta.radius.lg,
        borderWidth: 1,
        gap: beta.spacing.md,
        padding: beta.spacing.lg,
      }}
    >
      {children}
    </View>
  );
}

export function BetaEmptyState({
  message,
  title,
  tone = "neutral",
}: {
  message?: string;
  title: string;
  tone?: "neutral" | "warning";
}) {
  return (
    <BetaPanel tone={tone === "warning" ? "peach" : "white"}>
      <Text style={{ color: beta.colors.ink, fontSize: 20, fontWeight: "900" }}>{title}</Text>
      {message ? <BetaBody>{message}</BetaBody> : null}
    </BetaPanel>
  );
}

export function BetaTabBar<T extends string>({
  active,
  onChange,
  tabs,
}: {
  active: T;
  onChange: (tab: T) => void;
  tabs: Array<{ id: T; label: string }>;
}) {
  return (
    <View
      style={{
        backgroundColor: beta.colors.surface,
        borderColor: beta.colors.border,
        borderTopWidth: 1,
        flexDirection: "row",
        gap: beta.spacing.xs,
        paddingBottom: beta.spacing.sm,
        paddingHorizontal: beta.spacing.sm,
        paddingTop: beta.spacing.sm,
      }}
    >
      {tabs.map((item) => {
        const selected = active === item.id;
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected }}
            key={item.id}
            onPress={() => onChange(item.id)}
            style={{
              alignItems: "center",
              borderRadius: beta.radius.md,
              flex: 1,
              minHeight: 46,
              paddingVertical: beta.spacing.sm,
            }}
          >
            <Text
              style={{
                color: selected ? beta.colors.ink : beta.colors.inkMuted,
                fontSize: 12,
                fontWeight: "900",
              }}
            >
              {item.label}
            </Text>
            <View
              style={{
                backgroundColor: selected ? beta.colors.orange : "transparent",
                borderRadius: 999,
                height: 3,
                marginTop: beta.spacing.xs,
                width: 28,
              }}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

export function BetaStatPanel({
  stats,
}: {
  stats: Array<{ label: string; value: number | string }>;
}) {
  return (
    <BetaPanel tone="black">
      <View style={{ flexDirection: "row", gap: beta.spacing.sm }}>
        {stats.map((stat) => (
          <View
            key={stat.label}
            style={{
              backgroundColor: "#25211D",
              borderRadius: beta.radius.md,
              flex: 1,
              padding: beta.spacing.md,
            }}
          >
            <Text style={{ color: beta.colors.surface, fontSize: 24, fontWeight: "900" }}>
              {stat.value}
            </Text>
            <Text style={{ color: beta.colors.orangeSoft, fontSize: 12, fontWeight: "800" }}>
              {stat.label}
            </Text>
          </View>
        ))}
      </View>
    </BetaPanel>
  );
}

export function BetaItemCard({ item, onPress }: { item: TradeableItem; onPress: () => void }) {
  const title = item.title.trim() || "Untitled draft";
  const category = item.category ? categoryLabels[item.category] : "No category";
  const size = item.size ? sizeLabels[item.size] : "No size";

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: beta.colors.surface,
        borderColor: beta.colors.border,
        borderRadius: beta.radius.lg,
        borderWidth: 1,
        opacity: pressed ? 0.86 : 1,
        overflow: "hidden",
      })}
    >
      <View
        style={{
          alignItems: "center",
          aspectRatio: 0.92,
          backgroundColor: beta.colors.surfaceWarm,
          justifyContent: "center",
        }}
      >
        <Text style={{ color: beta.colors.inkMuted, fontSize: 13, fontWeight: "900" }}>
          {item.photos.length > 0 ? `${item.photos.length} photos` : "Object image"}
        </Text>
      </View>
      <View style={{ gap: 7, padding: beta.spacing.md }}>
        <Text numberOfLines={2} style={{ color: beta.colors.ink, fontSize: 16, fontWeight: "900" }}>
          {title}
        </Text>
        <Text style={{ color: beta.colors.inkMuted, fontSize: 13 }}>
          {category} / {size}
        </Text>
        <View style={{ alignItems: "center", flexDirection: "row", gap: beta.spacing.xs }}>
          <View
            style={{
              backgroundColor:
                item.status === "tradeable" ? beta.colors.orange : beta.colors.border,
              borderRadius: 999,
              height: 8,
              width: 8,
            }}
          />
          <Text style={{ color: beta.colors.ink, fontSize: 12, fontWeight: "900" }}>
            {statusLabels[item.status]}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export function BetaWantCard({
  index,
  item,
  onMoveDown,
  onMoveUp,
  onPress,
}: {
  index: number;
  item: WishlistItem;
  onMoveDown: () => void;
  onMoveUp: () => void;
  onPress: () => void;
}) {
  const title = item.title.trim() || "Untitled want";
  const category = item.category ? categoryLabels[item.category] : "No category";
  const size = item.size ? sizeLabels[item.size] : "Any size";

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: item.isGrail ? beta.colors.orangeSoft : beta.colors.surface,
        borderColor: item.isGrail ? beta.colors.orange : beta.colors.border,
        borderLeftColor: item.isGrail ? beta.colors.orange : beta.colors.border,
        borderLeftWidth: item.isGrail ? 5 : 1,
        borderRadius: beta.radius.lg,
        borderWidth: 1,
        gap: beta.spacing.md,
        opacity: pressed ? 0.86 : 1,
        padding: beta.spacing.lg,
      })}
    >
      <View style={{ flexDirection: "row", gap: beta.spacing.md }}>
        <Text style={{ color: beta.colors.ink, fontSize: 30, fontWeight: "900", width: 42 }}>
          {index + 1}
        </Text>
        <View style={{ flex: 1, gap: 7 }}>
          <Text style={{ color: beta.colors.orange, fontSize: 12, fontWeight: "900" }}>
            {item.isGrail ? "GRAIL" : wishlistPriorityLabels[item.priority].toUpperCase()}
          </Text>
          <Text style={{ color: beta.colors.ink, fontSize: 20, fontWeight: "900" }}>{title}</Text>
          <Text style={{ color: beta.colors.inkMuted, fontSize: 14, lineHeight: 20 }}>
            {category} / {size} / {wishlistMatchPreferenceLabels[item.matchPreference]}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: beta.spacing.md, paddingLeft: 58 }}>
        <Pressable accessibilityRole="button" onPress={onMoveUp} style={{ paddingVertical: 4 }}>
          <Text style={{ color: beta.colors.inkMuted, fontSize: 13, fontWeight: "900" }}>
            Move up
          </Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onMoveDown} style={{ paddingVertical: 4 }}>
          <Text style={{ color: beta.colors.inkMuted, fontSize: 13, fontWeight: "900" }}>
            Move down
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

type BetaTextFieldProps = TextInputProps & {
  error?: string | undefined;
  keyboardType?: KeyboardTypeOptions | undefined;
  label: string;
};

export function BetaTextField({ error, label, style, ...props }: BetaTextFieldProps) {
  return (
    <View style={{ gap: beta.spacing.sm }}>
      <Text style={{ color: beta.colors.inkMuted, fontSize: 13, fontWeight: "800" }}>{label}</Text>
      <TextInput
        placeholderTextColor={beta.colors.inkMuted}
        style={[
          {
            backgroundColor: beta.colors.surface,
            borderColor: error ? beta.colors.danger : beta.colors.border,
            borderRadius: beta.radius.md,
            borderWidth: 1,
            color: beta.colors.ink,
            fontSize: 16,
            minHeight: 52,
            paddingHorizontal: beta.spacing.md,
            paddingVertical: beta.spacing.sm,
          },
          style,
        ]}
        {...props}
      />
      {error ? <Text style={{ color: beta.colors.danger, fontSize: 13 }}>{error}</Text> : null}
    </View>
  );
}

export function BetaChip({
  label,
  onPress,
  selected,
}: {
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: selected ? beta.colors.orangeSoft : beta.colors.surface,
        borderColor: selected ? beta.colors.orange : beta.colors.border,
        borderRadius: 999,
        borderWidth: 1,
        opacity: pressed ? 0.86 : 1,
        paddingHorizontal: beta.spacing.md,
        paddingVertical: beta.spacing.sm,
      })}
    >
      <Text
        style={{
          color: selected ? beta.colors.ink : beta.colors.inkMuted,
          fontSize: 13,
          fontWeight: "900",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function BetaChoice({
  description,
  label,
  onPress,
  selected,
}: {
  description?: string;
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: selected ? beta.colors.orangeSoft : beta.colors.surface,
        borderColor: selected ? beta.colors.orange : beta.colors.border,
        borderRadius: beta.radius.md,
        borderWidth: 1,
        opacity: pressed ? 0.86 : 1,
        padding: beta.spacing.md,
      })}
    >
      <View style={{ gap: 6 }}>
        <Text style={{ color: beta.colors.ink, fontSize: 16, fontWeight: "900" }}>{label}</Text>
        {description ? (
          <Text style={{ color: beta.colors.inkMuted, fontSize: 14, lineHeight: 20 }}>
            {description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
