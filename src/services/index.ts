export { nowIso, createId } from "./client";
export type { SimulatedFetchOptions } from "./client";

export { HttpError, createHttpClient } from "./http";
export type { HttpRequest } from "./http";

export {
  isLiveBackendEnabled,
  readLiveBackendConfig,
  liveFetch,
  LiveBackendDisabledError,
  LiveBackendUnconfiguredError,
  LiveBackendHttpError,
} from "./liveBackend";
export type { LiveBackendConfig, LiveFetchOptions } from "./liveBackend";

export { mt5StatusKeys, useMt5Status } from "./mt5Status";

export {
  authKeys,
  useSignIn,
  useSignUp,
  useAuthSession,
  useRefreshSession,
  useCurrentUser,
  useSignOut,
  useForgotPassword,
  useResetPassword,
} from "./auth";
export type { SignInInput, SignUpInput } from "./auth";

export {
  tradeKeys,
  useTrades,
  useTrade,
  useUpdateTradeStatus,
  useApproveTrade,
  useExecuteTrade,
  useExecutionStatus,
} from "./trades";
export type {
  UpdateTradeStatusInput,
  ApproveTradeVariables,
  ExecuteTradeVariables,
} from "./trades";

export {
  analyticsKeys,
  useAnalyticsSummary,
  useAnalyticsEquity,
} from "./analytics";

export { macroKeys, useMacroEvents, useMacroEventDetail } from "./macro";

export {
  copilotKeys,
  useCopilotConversations,
  useCopilotSession,
  useCopilotSuggestedPrompts,
  useSendCopilotMessage,
  useCopilotChat,
} from "./copilot";
export type { SendCopilotMessageInput } from "./copilot";

export { profileKeys, useProfile, useUpdateProfile, useUploadAvatar } from "./profile";
export type {
  UserProfilePatch,
  UploadAvatarInput,
  UploadAvatarResult,
} from "./profile";

export {
  settingsKeys,
  useRiskSettings,
  useUpdateRiskSettings,
  useEngineSettings,
  useUpdateEngineSettings,
} from "./settings";
export type {
  RiskSettingsPatch,
  EngineToggleUpdate,
  EngineSettingsPatch,
} from "./settings";

export {
  brokerKeys,
  useBrokerConnections,
  useBrokerConnection,
  useConnectBroker,
  useDisconnectBroker,
  useUpdateBrokerConnection,
  useTestBroker,
} from "./broker";
export type {
  DisconnectBrokerInput,
  UpdateBrokerConnectionInput,
  TestBrokerInput,
} from "./broker";

export { safetyKeys, useKillSwitchStatus, useConfirmKillSwitch } from "./safety";

export {
  SignedIntentError,
  useRequestSignedIntent,
  assertSignedIntentInProduction,
  isMockSignedIntentToken,
} from "./signedIntent";
export type {
  RequestSignedIntentInput,
  SignedIntentErrorCode,
} from "./signedIntent";
