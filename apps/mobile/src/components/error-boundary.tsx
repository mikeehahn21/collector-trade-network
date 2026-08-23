import type { PropsWithChildren } from "react";
import { Component } from "react";
import { Pressable, Text, View } from "react-native";

import { betaTokens as beta } from "@/manual/beta-tokens";

type State = {
  hasError: boolean;
  message?: string | undefined;
};

export class AppErrorBoundary extends Component<PropsWithChildren, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  public componentDidCatch(error: Error): void {
    // Sentry wiring belongs here once monitoring credentials are available.
    console.error(error);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <View
          style={{
            alignItems: "center",
            backgroundColor: beta.colors.background,
            flex: 1,
            justifyContent: "center",
            padding: 24,
          }}
        >
          <Text
            style={{
              color: beta.colors.orange,
              fontSize: 12,
              fontWeight: "900",
              letterSpacing: 0,
            }}
          >
            KONNESOR STABILITY
          </Text>
          <Text
            style={{
              color: beta.colors.ink,
              fontSize: 26,
              fontWeight: "900",
              marginTop: 10,
              textAlign: "center",
            }}
          >
            The app caught a screen error.
          </Text>
          <Text
            style={{
              color: beta.colors.inkMuted,
              fontSize: 15,
              lineHeight: 22,
              marginTop: 10,
              textAlign: "center",
            }}
          >
            This beta stayed open instead of closing. Restart this screen, then send the error text
            if it repeats.
          </Text>
          {this.state.message ? (
            <Text
              style={{
                color: beta.colors.inkMuted,
                fontSize: 12,
                lineHeight: 17,
                marginTop: 16,
                textAlign: "center",
              }}
            >
              {this.state.message}
            </Text>
          ) : null}
          <Pressable
            accessibilityLabel="Try loading Konnesor again"
            accessibilityRole="button"
            onPress={() => this.setState({ hasError: false, message: undefined })}
            style={({ pressed }) => ({
              alignItems: "center",
              backgroundColor: beta.colors.orange,
              borderRadius: beta.radius.md,
              justifyContent: "center",
              marginTop: 22,
              minHeight: 46,
              opacity: pressed ? 0.86 : 1,
              paddingHorizontal: beta.spacing.xl,
            })}
          >
            <Text style={{ color: beta.colors.background, fontSize: 14, fontWeight: "900" }}>
              Try again
            </Text>
          </Pressable>
          <Text
            style={{
              color: beta.colors.inkMuted,
              fontSize: 12,
              lineHeight: 17,
              marginTop: 14,
              textAlign: "center",
            }}
          >
            If Try again fails, fully close and reopen Konnesor.
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}
