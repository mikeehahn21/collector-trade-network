import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";

import type { Trade } from "@ctn/types";

import { useApiClient } from "@/api/use-api-client";
import { AppButton } from "@/components/app-button";
import { Screen } from "@/components/screen";
import { ScreenState } from "@/components/screen-state";
import { isTradeHistorical, tradeStatusLabels } from "@/lib/trade-display";
import { useTheme } from "@/theme/theme-provider";

type TradeTab = "incoming" | "sent" | "history";

export default function TradeListScreen() {
  const api = useApiClient();
  const apiRef = useRef(api);
  const router = useRouter();
  const theme = useTheme();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [tab, setTab] = useState<TradeTab>("incoming");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    apiRef.current = api;
  }, [api]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);

    try {
      const response = await apiRef.current.listTrades();
      setTrades(response.trades);
    } catch {
      setError("Trade offers could not be refreshed.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const visibleTrades = trades.filter((trade) => {
    if (tab === "history") {
      return isTradeHistorical(trade.status);
    }

    if (tab === "incoming") {
      return trade.viewerRole === "counterparty" && !isTradeHistorical(trade.status);
    }

    return trade.viewerRole === "proposer" && !isTradeHistorical(trade.status);
  });

  return (
    <Screen>
      <View style={{ flex: 1, gap: theme.spacing.lg }}>
        <View style={{ gap: theme.spacing.sm }}>
          <Text style={{ color: theme.colors.accent, fontSize: 12, fontWeight: "900" }}>
            TRADES
          </Text>
          <Text style={{ color: theme.colors.textPrimary, fontSize: 32, fontWeight: "900" }}>
            Trade offers
          </Text>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 16, lineHeight: 24 }}>
            Review incoming proposals, sent offers, and completed trade history.
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
          {(["incoming", "sent", "history"] as const).map((item) => (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: tab === item }}
              key={item}
              onPress={() => setTab(item)}
              style={{
                backgroundColor: tab === item ? theme.colors.accentMuted : theme.colors.surface,
                borderColor: tab === item ? theme.colors.accent : theme.colors.border,
                borderRadius: theme.radius.md,
                borderWidth: 1,
                flex: 1,
                padding: theme.spacing.md,
              }}
            >
              <Text
                style={{
                  color: tab === item ? theme.colors.textPrimary : theme.colors.textSecondary,
                  fontSize: 13,
                  fontWeight: "900",
                  textAlign: "center",
                }}
              >
                {item.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>

        {isLoading ? (
          <ScreenState message="Loading active and past trade offers." title="Loading trades" />
        ) : null}
        {error ? (
          <View style={{ gap: theme.spacing.md }}>
            <ScreenState message={error} title="Trades unavailable" tone="warning" />
            <AppButton accessibilityLabel="Retry trades" onPress={() => void refresh()} variant="secondary">
              Retry
            </AppButton>
          </View>
        ) : null}

        {!isLoading && !error ? (
          <ScrollView contentContainerStyle={{ gap: theme.spacing.md, paddingBottom: theme.spacing.xl }}>
            {visibleTrades.length === 0 ? (
              <Text style={{ color: theme.colors.textSecondary, fontSize: 15, lineHeight: 22 }}>
                No trade offers in this section yet.
              </Text>
            ) : (
              visibleTrades.map((trade) => (
                <TradeCard key={trade.id} onPress={() => router.push(`/trades/${trade.id}`)} trade={trade} />
              ))
            )}
          </ScrollView>
        ) : null}

        <AppButton accessibilityLabel="Back to Home" onPress={() => router.replace("/home")} variant="ghost">
          Back to Home
        </AppButton>
      </View>
    </Screen>
  );
}

function TradeCard({ onPress, trade }: { onPress: () => void; trade: Trade }) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        gap: theme.spacing.sm,
        padding: theme.spacing.lg,
      }}
    >
      <Text style={{ color: theme.colors.accent, fontSize: 12, fontWeight: "900" }}>
        {tradeStatusLabels[trade.status]}
      </Text>
      <Text style={{ color: theme.colors.textPrimary, fontSize: 18, fontWeight: "900" }}>
        {trade.proposerItem.title} for {trade.counterpartyItem.title}
      </Text>
      <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>
        {trade.proposerDisplayName} -> {trade.counterpartyDisplayName}
      </Text>
    </Pressable>
  );
}
