import type { PropsWithChildren } from "react";
import { Component } from "react";
import { Text, View } from "react-native";

type State = {
  hasError: boolean;
};

export class AppErrorBoundary extends Component<PropsWithChildren, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error): void {
    // Sentry wiring belongs here once monitoring credentials are available.
    console.error(error);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: "700" }}>Something went wrong.</Text>
          <Text style={{ marginTop: 8, textAlign: "center" }}>
            Please restart the app. If this keeps happening, contact support.
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}
