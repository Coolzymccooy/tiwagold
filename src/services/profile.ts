import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { MOCK_USER } from "@/mocks/user";
import type { NotificationPreferences, UserProfile } from "@/types/user";
import { createId, simulateFetch } from "./client";

export const profileKeys = {
  me: ["user", "me"] as const,
  avatar: ["user", "me", "avatar"] as const,
};

export interface UserProfilePatch {
  displayName?: string;
  email?: string;
  locale?: string;
  timezone?: string;
  riskProfile?: UserProfile["riskProfile"];
  notifications?: Partial<NotificationPreferences>;
}

export interface UploadAvatarInput {
  uri: string;
  mimeType: "image/jpeg" | "image/png";
  fileName?: string;
}

export interface UploadAvatarResult {
  avatarUrl: string;
  uploadedAt: string;
}

let profileStore: UserProfile = { ...MOCK_USER };

function applyPatch(current: UserProfile, patch: UserProfilePatch): UserProfile {
  return {
    ...current,
    ...(patch.displayName !== undefined ? { displayName: patch.displayName } : {}),
    ...(patch.email !== undefined ? { email: patch.email } : {}),
    ...(patch.locale !== undefined ? { locale: patch.locale } : {}),
    ...(patch.timezone !== undefined ? { timezone: patch.timezone } : {}),
    ...(patch.riskProfile !== undefined ? { riskProfile: patch.riskProfile } : {}),
    ...(patch.notifications !== undefined
      ? { notifications: { ...current.notifications, ...patch.notifications } }
      : {}),
  };
}

export function useProfile(enabled = true): UseQueryResult<UserProfile, Error> {
  return useQuery({
    queryKey: profileKeys.me,
    queryFn: () => simulateFetch(() => ({ ...profileStore })),
    enabled,
    staleTime: 60_000,
  });
}

export function useUpdateProfile(): UseMutationResult<
  UserProfile,
  Error,
  UserProfilePatch
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: UserProfilePatch) =>
      simulateFetch<UserProfile>(() => {
        profileStore = applyPatch(profileStore, patch);
        return { ...profileStore };
      }),
    onSuccess: (user) => {
      queryClient.setQueryData(profileKeys.me, user);
    },
  });
}

export function useUploadAvatar(): UseMutationResult<
  UploadAvatarResult,
  Error,
  UploadAvatarInput
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UploadAvatarInput) =>
      simulateFetch<UploadAvatarResult>(() => {
        if (!input.uri) throw new Error("Missing avatar file");
        const uploadedAt = new Date().toISOString();
        const avatarUrl = `https://cdn.tiwagold.app/avatars/${createId("av")}.${
          input.mimeType === "image/png" ? "png" : "jpg"
        }`;
        profileStore = { ...profileStore, avatarUrl };
        return { avatarUrl, uploadedAt };
      }),
    onSuccess: ({ avatarUrl }) => {
      queryClient.setQueryData<UserProfile | undefined>(profileKeys.me, (prev) =>
        prev ? { ...prev, avatarUrl } : prev,
      );
      queryClient.invalidateQueries({ queryKey: profileKeys.me });
    },
  });
}
