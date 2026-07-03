import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import type { Trade, TradeStatus, TradeableItem } from "@ctn/types";

import { useApiClient } from "@/api/use-api-client";
import { AppButton } from "@/components/app-button";
import { AppTextField } from "@/components/app-text-field";
import { Screen } from "@/components/screen";
import { ScreenState } from "@/components/screen-state";
import { categoryLabels, sizeLabels } from "@/lib/item-display";
import { tradeStatusLabels } from "@/lib/trade-display";
import { useCollectionState } from "@/state/collection-state";
import { useTheme } from "@/theme/theme-provider";

export default function TradeDetailScreen() {
  const { tradeId } = useLocalSearchParams<{ tradeId: string }>();
  const api = useApiClient();
  const apiRef = useRef(api);
  const router = useRouter();
  const theme = useTheme();
  const { items } = useCollectionState();
  const [trade, setTrade] = useState<Trade | undefined>();
  const [selectedCounterItemId, setSelectedCounterItemId] = useState<string | undefined>();
  const [counterNotes, setCounterNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const counterItems = items.filter((item) => item.status === "tradeable" && isUuid(item.id));

  useEffect(() => {
    apiRef.current = api;
  }, [api]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);

    try {
      const response = await apiRef.current.getTrade(tradeId);
      setTrade(response.trade);
    } catch {
      setError("This trade offer is no longer available.");
    } finally {
      setIsLoading(false);
    }
  }, [tradeId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function updateStatus(
    status: Extract<TradeStatus, "accepted" | "declined" | "cancelled" | "completed">,
  ) {
    if (!trade) {
      return;
    }

    setIsWorking(true);
    setError(undefined);

    try {
      const response = await apiRef.current.updateTradeStatus(trade.id, status);
      setTrade(response.trade);
    } catch {
      setError("That trade action could not be completed.");
    } finally {
      setIsWorking(false);
    }
  }

  async function submitCounter() {
    if (!trade || !selectedCounterItemId) {
      setError("Choose one of your tradeable items before countering.");
      return;
    }

    setIsWorking(true);
    setError(undefined);

    try {
      const response = await apiRef.current.counterTrade(trade.id, {
        proposerItemId: trade.proposerItemId,
        counterpartyItemId: selectedCounterItemId,
        counterpartyNotes: counterNotes || undefined,
      });
      setTrade(response.trade);
    } catch {
      setError("Counter offer could not be created with that item.");
    } finally {
      setIsWorking(false);
    }
  }

  if (isLoading) {
    return (
      <Screen>
        <ScreenState message="Loading trade terms and current status." title="Loading trade" />
      </Screen>
    );
  }

  if (!trade) {
    return (
      <Screen>
        <View style={{ gap: theme.spacing.md }}>
          <ScreenState message={error} title="Trade unavailable" tone="warning" />
          <AppButton accessibilityLabel="Back to trades" onPress={() => router.replace("/trades")}>
            Back to Trades
          </AppButton>
        </View>
      </Screen>
    );
  }

  const canCounter =
    trade.viewerRole === "counterparty" && ["pending", "countered"].includes(trade.status);

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ gap: theme.spacing.lg, paddingBottom: theme.spacing.xl }}
      >
        <View style={{ gap: theme.spacing.sm }}>
          <Text style={{ color: theme.colors.accent, fontSize: 12, fontWeight: "900" }}>
            {tradeStatusLabels[trade.status]}
          </Text>
          <Text style={{ color: theme.colors.textPrimary, fontSize: 31, fontWeight: "900" }}>
            Trade details
          </Text>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 16, lineHeight: 24 }}>
            Review both sides before taking action. Shipping and disputes are not part of this
            sprint.
          </Text>
        </View>

        {trade.status === "accepted" ? (
          <View
            style={{
              backgroundColor: theme.colors.accentMuted,
              borderColor: theme.colors.accent,
              borderRadius: theme.radius.lg,
              borderWidth: 1,
              gap: theme.spacing.sm,
              padding: theme.spacing.lg,
            }}
          >
            <Text style={{ color: theme.colors.textPrimary, fontSize: 22, fontWeight: "900" }}>
              Trade accepted
            </Text>
            <Text style={{ color: theme.colors.textSecondary, fontSize: 15, lineHeight: 22 }}>
              Both items are reserved while the collectors finalize completion.
            </Text>
          </View>
        ) : null}

        <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
          <TradeItemPanel label="Proposer offers" item={trade.proposerItem} />
          <TradeItemPanel label="Requested item" item={trade.counterpartyItem} />
        </View>

        <DetailPanel
          rows={[
            ["From", trade.proposerDisplayName],
            ["To", trade.counterpartyDisplayName],
            ["Your role", trade.viewerRole === "proposer" ? "Sent offer" : "Incoming offer"],
            ["Updated", new Date(trade.updatedAt).toLocaleDateString()],
          ]}
          title="Trade terms"
        />

        {trade.proposerNotes || trade.counterpartyNotes ? (
          <DetailPanel
            rows={[
              ["Proposer notes", trade.proposerNotes ?? "None"],
              ["Counter notes", trade.counterpartyNotes ?? "None"],
            ]}
            title="Notes"
          />
        ) : null}

        {canCounter ? (
          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.lg,
              borderWidth: 1,
              gap: theme.spacing.md,
              padding: theme.spacing.lg,
            }}
          >
            <Text style={{ color: theme.colors.textPrimary, fontSize: 19, fontWeight: "900" }}>
              Counter offer
            </Text>
            {counterItems.map((item) => (
              <CounterItemChoice
                isSelected={selectedCounterItemId === item.id}
                item={item}
                key={item.id}
                onPress={() => setSelectedCounterItemId(item.id)}
              />
            ))}
            <AppTextField
              label="Counter notes"
              multiline
              onChangeText={setCounterNotes}
              placeholder="Explain the change you are proposing."
              style={{ minHeight: 96, textAlignVertical: "top" }}
              value={counterNotes}
            />
            <AppButton
              accessibilityLabel="Send counter offer"
              disabled={!selectedCounterItemId}
              loading={isWorking}
              onPress={() => void submitCounter()}
              variant="secondary"
            >
              Send Counter
            </AppButton>
          </View>
        ) : null}

        {error ? <Text style={{ color: theme.colors.warning, fontSize: 14 }}>{error}</Text> : null}

        <View style={{ gap: theme.spacing.md }}>
          {trade.viewerRole === "counterparty" &&
          ["pending", "countered"].includes(trade.status) ? (
            <>
              <AppButton
                accessibilityLabel="Accept trade"
                loading={isWorking}
                onPress={() => void updateStatus("accepted")}
              >
                Accept Trade
              </AppButton>
              <AppButton
                accessibilityLabel="Decline trade"
                loading={isWorking}
                onPress={() => void updateStatus("declined")}
                variant="secondary"
              >
                Decline
              </AppButton>
            </>
          ) : null}

          {trade.viewerRole === "proposer" && ["pending", "countered"].includes(trade.status) ? (
            <AppButton
              accessibilityLabel="Cancel trade"
              loading={isWorking}
              onPress={() => void updateStatus("cancelled")}
              variant="secondary"
            >
              Cancel Offer
            </AppButton>
          ) : null}

          {trade.status === "accepted" ? (
            <AppButton
              accessibilityLabel="Mark trade completed"
              loading={isWorking}
              onPress={() => void updateStatus("completed")}
            >
              Mark Completed
            </AppButton>
          ) : null}

          <AppButton
            accessibilityLabel="Back to trades"
            onPress={() => router.replace("/trades")}
            variant="ghost"
          >
            Back to Trades
          </AppButton>
        </View>
      </ScrollView>
    </Screen>
  );
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function TradeItemPanel({ item, label }: { item: Trade["proposerItem"]; label: string }) {
  const theme = useTheme();

  return (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        flex: 1,
        gap: theme.spacing.sm,
        padding: theme.spacing.md,
      }}
    >
      <Text style={{ color: theme.colors.accent, fontSize: 11, fontWeight: "900" }}>{label}</Text>
      <Text style={{ color: theme.colors.textPrimary, fontSize: 16, fontWeight: "900" }}>
        {item.title}
      </Text>
      <Text style={{ color: theme.colors.textSecondary, fontSize: 13 }}>
        {item.category ? categoryLabels[item.category] : "No category"}
        {item.size ? ` / ${sizeLabels[item.size]}` : ""}
      </Text>
    </View>
  );
}

function CounterItemChoice({
  isSelected,
  item,
  onPress,
}: {
  isSelected: boolean;
  item: TradeableItem;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      onPress={onPress}
      style={{
        backgroundColor: isSelected ? theme.colors.accentMuted : theme.colors.surfaceElevated,
        borderColor: isSelected ? theme.colors.accent : theme.colors.border,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        gap: theme.spacing.xs,
        padding: theme.spacing.md,
      }}
    >
      <Text style={{ color: theme.colors.textPrimary, fontSize: 15, fontWeight: "800" }}>
        {item.title || "Untitled item"}
      </Text>
      <Text style={{ color: theme.colors.textSecondary, fontSize: 13 }}>
        {item.category ? categoryLabels[item.category] : "No category"}
        {item.size ? ` / ${sizeLabels[item.size]}` : ""}
      </Text>
    </Pressable>
  );
}

function DetailPanel({ rows, title }: { rows: [string, string][]; title: string }) {
  const theme = useTheme();

  return (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        gap: theme.spacing.md,
        padding: theme.spacing.lg,
      }}
    >
      <Text style={{ color: theme.colors.textPrimary, fontSize: 18, fontWeight: "900" }}>
        {title}
      </Text>
      {rows.map(([label, value]) => (
        <View
          key={label}
          style={{ flexDirection: "row", justifyContent: "space-between", gap: theme.spacing.md }}
        >
          <Text style={{ color: theme.colors.textSecondary, flex: 1 }}>{label}</Text>
          <Text
            style={{
              color: theme.colors.textPrimary,
              flex: 1,
              fontWeight: "700",
              textAlign: "right",
            }}
          >
            {value}
          </Text>
        </View>
      ))}
    </View>
  );
}
