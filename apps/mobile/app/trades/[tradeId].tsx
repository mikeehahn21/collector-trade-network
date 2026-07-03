import { useCallback, useEffect, useRef, useState } from "react";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import type {
  Trade,
  TradeCarrier,
  TradeShippingSide,
  TradeStatus,
  TradeableItem,
} from "@ctn/types";

import { useApiClient } from "@/api/use-api-client";
import { AppButton } from "@/components/app-button";
import { AppTextField } from "@/components/app-text-field";
import { Screen } from "@/components/screen";
import { ScreenState } from "@/components/screen-state";
import { categoryLabels, sizeLabels } from "@/lib/item-display";
import { tradeStatusLabels } from "@/lib/trade-display";
import { useCollectionState } from "@/state/collection-state";
import { useTheme } from "@/theme/theme-provider";

const carrierOptions: TradeCarrier[] = ["usps", "ups", "fedex", "dhl", "other"];

const carrierLabels: Record<TradeCarrier, string> = {
  dhl: "DHL",
  fedex: "FedEx",
  other: "Other",
  ups: "UPS",
  usps: "USPS",
};

const shippingStatusLabels: Record<TradeShippingSide["status"], string> = {
  delivered: "Delivered",
  pending: "Pending",
  shipped: "Shipped",
};

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
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState<TradeCarrier>("usps");
  const [disputeReason, setDisputeReason] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(false);
  const [isOpeningConversation, setIsOpeningConversation] = useState(false);
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

  async function updateStatus(status: Extract<TradeStatus, "accepted" | "declined" | "cancelled">) {
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

  async function openTradeConversation() {
    if (!trade) {
      return;
    }

    setIsOpeningConversation(true);
    setError(undefined);

    try {
      const response = await apiRef.current.createConversation({
        contextType: "trade",
        contextId: trade.id,
      });
      router.push(`/conversations/${response.conversation.id}`);
    } catch {
      setError("The trade conversation could not be opened.");
    } finally {
      setIsOpeningConversation(false);
    }
  }

  async function shipMyItem() {
    if (!trade) {
      return;
    }

    setIsWorking(true);
    setError(undefined);

    try {
      const response = await apiRef.current.shipTrade(trade.id, {
        trackingNumber,
        carrier,
      });
      setTrade(response.trade);
      setTrackingNumber("");
    } catch {
      setError("Shipping details could not be saved.");
    } finally {
      setIsWorking(false);
    }
  }

  async function confirmReceipt() {
    if (!trade) {
      return;
    }

    setIsWorking(true);
    setError(undefined);

    try {
      const response = await apiRef.current.receiveTrade(trade.id);
      setTrade(response.trade);
    } catch {
      setError("Receipt could not be confirmed yet.");
    } finally {
      setIsWorking(false);
    }
  }

  async function completeTrade() {
    if (!trade) {
      return;
    }

    setIsWorking(true);
    setError(undefined);

    try {
      const response = await apiRef.current.completeTrade(trade.id);
      setTrade(response.trade);
    } catch {
      setError("Both sides must confirm receipt before completion.");
    } finally {
      setIsWorking(false);
    }
  }

  async function openDispute() {
    if (!trade) {
      return;
    }

    setIsWorking(true);
    setError(undefined);

    try {
      const response = await apiRef.current.disputeTrade(trade.id, { reason: disputeReason });
      setTrade(response.trade);
    } catch {
      setError("Dispute could not be opened with that reason.");
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
  const myShipping =
    trade.viewerRole === "proposer" ? trade.proposerShipping : trade.counterpartyShipping;
  const theirShipping =
    trade.viewerRole === "proposer" ? trade.counterpartyShipping : trade.proposerShipping;
  const canShip = trade.status === "accepted" && myShipping.status === "pending";
  const canReceive = trade.status === "accepted" && theirShipping.status === "shipped";
  const canComplete =
    trade.status === "accepted" &&
    trade.proposerShipping.status === "delivered" &&
    trade.counterpartyShipping.status === "delivered";
  const canDispute =
    trade.status === "accepted" &&
    (trade.proposerShipping.status !== "pending" ||
      trade.counterpartyShipping.status !== "pending");

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
            Track shipping, confirm receipt, and complete the trade only after both sides arrive.
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

        {["accepted", "completed", "disputed"].includes(trade.status) ? (
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
            <Text style={{ color: theme.colors.textPrimary, fontSize: 20, fontWeight: "900" }}>
              Shipping tracker
            </Text>
            <ShippingProgress label="Your item" shipping={myShipping} />
            <ShippingProgress label="Their item" shipping={theirShipping} />
          </View>
        ) : null}

        {canShip ? (
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
              Add tracking
            </Text>
            <AppTextField
              label="Tracking number"
              onChangeText={setTrackingNumber}
              placeholder="Enter the carrier tracking number."
              value={trackingNumber}
            />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm }}>
              {carrierOptions.map((option) => (
                <CarrierChoice
                  carrier={option}
                  isSelected={carrier === option}
                  key={option}
                  onPress={() => setCarrier(option)}
                />
              ))}
            </View>
            <AppButton
              accessibilityLabel="I've shipped my item"
              disabled={!trackingNumber.trim()}
              loading={isWorking}
              onPress={() => void shipMyItem()}
            >
              I've Shipped My Item
            </AppButton>
          </View>
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
          <AppButton
            accessibilityLabel="Open trade conversation"
            loading={isOpeningConversation}
            onPress={() => void openTradeConversation()}
            variant="secondary"
          >
            Open Trade Conversation
          </AppButton>

          {canReceive ? (
            <AppButton
              accessibilityLabel="I've received the item"
              loading={isWorking}
              onPress={() => void confirmReceipt()}
            >
              I've Received the Item
            </AppButton>
          ) : null}

          {canComplete ? (
            <AppButton
              accessibilityLabel="Complete trade"
              loading={isWorking}
              onPress={() => void completeTrade()}
            >
              Complete Trade
            </AppButton>
          ) : null}

          {canDispute ? (
            <View style={{ gap: theme.spacing.md }}>
              <AppTextField
                label="Dispute reason"
                multiline
                onChangeText={setDisputeReason}
                placeholder="Describe the issue clearly."
                style={{ minHeight: 92, textAlignVertical: "top" }}
                value={disputeReason}
              />
              <AppButton
                accessibilityLabel="Report an issue"
                disabled={disputeReason.trim().length < 10}
                loading={isWorking}
                onPress={() => void openDispute()}
                variant="secondary"
              >
                Report an Issue
              </AppButton>
            </View>
          ) : null}

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

function ShippingProgress({ label, shipping }: { label: string; shipping: TradeShippingSide }) {
  const theme = useTheme();
  const steps: TradeShippingSide["status"][] = ["pending", "shipped", "delivered"];
  const activeIndex = steps.indexOf(shipping.status);

  return (
    <View style={{ gap: theme.spacing.sm }}>
      <View
        style={{ flexDirection: "row", justifyContent: "space-between", gap: theme.spacing.md }}
      >
        <Text style={{ color: theme.colors.textPrimary, fontSize: 16, fontWeight: "900" }}>
          {label}
        </Text>
        <Text style={{ color: theme.colors.accent, fontSize: 13, fontWeight: "900" }}>
          {shippingStatusLabels[shipping.status]}
        </Text>
      </View>
      <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
        {steps.map((step, index) => (
          <View
            key={step}
            style={{
              backgroundColor:
                index <= activeIndex ? theme.colors.accent : theme.colors.surfaceElevated,
              borderRadius: 999,
              flex: 1,
              height: 8,
            }}
          />
        ))}
      </View>
      {shipping.trackingNumber ? (
        <Pressable
          accessibilityLabel={`Open ${carrierLabels[shipping.carrier ?? "other"]} tracking`}
          accessibilityRole="link"
          onPress={() => {
            void Linking.openURL(
              getTrackingUrl(shipping.carrier ?? "other", shipping.trackingNumber ?? ""),
            );
          }}
        >
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontSize: 13,
              textDecorationLine: "underline",
            }}
          >
            {carrierLabels[shipping.carrier ?? "other"]}: {shipping.trackingNumber}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function CarrierChoice({
  carrier,
  isSelected,
  onPress,
}: {
  carrier: TradeCarrier;
  isSelected: boolean;
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
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
      }}
    >
      <Text style={{ color: theme.colors.textPrimary, fontSize: 13, fontWeight: "800" }}>
        {carrierLabels[carrier]}
      </Text>
    </Pressable>
  );
}

function getTrackingUrl(carrier: TradeCarrier, trackingNumber: string): string {
  const encoded = encodeURIComponent(trackingNumber);

  if (carrier === "ups") {
    return `https://www.ups.com/track?tracknum=${encoded}`;
  }

  if (carrier === "fedex") {
    return `https://www.fedex.com/fedextrack/?trknbr=${encoded}`;
  }

  if (carrier === "dhl") {
    return `https://www.dhl.com/us-en/home/tracking.html?tracking-id=${encoded}`;
  }

  if (carrier === "usps") {
    return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encoded}`;
  }

  return `https://www.google.com/search?q=${encoded}+tracking`;
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
