import { StyleSheet, View } from "react-native";
import { Screen } from "@/design/primitives/Screen";
import { COPY } from "@/content/copy";
import { useCopilot } from "./hooks";
import { Composer } from "./components/Composer";
import { CopilotHeader } from "./components/CopilotHeader";
import { CopilotLoadingState } from "./components/CopilotLoadingState";
import { CopilotErrorState } from "./components/CopilotErrorState";
import { CopilotEmptyState } from "./components/CopilotEmptyState";
import { CopilotSuccessState } from "./components/CopilotSuccessState";

export function CopilotScreen() {
  const copilot = useCopilot();

  return (
    <Screen withKeyboardAvoid padded={false} edges={["top"]}>
      <CopilotHeader subtitle={copilot.view?.subtitle ?? COPY.copilot.subtitle} />
      <View style={styles.body}>
        <Body copilot={copilot} />
      </View>
      <Composer
        draft={copilot.draft}
        onChangeDraft={copilot.setDraft}
        onSend={copilot.send}
        isSending={copilot.isSending}
      />
    </Screen>
  );
}

interface BodyProps {
  copilot: ReturnType<typeof useCopilot>;
}

function Body({ copilot }: BodyProps) {
  if (copilot.isLoading) return <CopilotLoadingState />;
  if (copilot.isError) return <CopilotErrorState onRetry={copilot.refetch} />;

  const view = copilot.view;
  if (!view) return <CopilotLoadingState />;

  if (!view.hasMessages) {
    return (
      <CopilotEmptyState
        prompts={view.suggestedPrompts}
        onSelectPrompt={copilot.usePrompt}
      />
    );
  }

  return (
    <CopilotSuccessState
      view={view}
      onSelectPrompt={copilot.usePrompt}
      isSending={copilot.isSending}
    />
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
  },
});
