import { useCallback, useState } from "react";
import { useSignIn } from "@/services/auth";
import { useAuthStore } from "@/state/authStore";
import { loginFormInitialState, selectCanSubmitLogin } from "./selectors";
import type { LoginFormField, LoginFormState } from "./types";

export interface UseLoginFormResult {
  state: LoginFormState;
  canSubmit: boolean;
  setField: (field: LoginFormField, value: string) => void;
  submit: () => Promise<void>;
  reset: () => void;
}

export function useLoginForm(): UseLoginFormResult {
  const [state, setState] = useState<LoginFormState>(loginFormInitialState);
  const signIn = useSignIn();
  const storeSignIn = useAuthStore((s) => s.signIn);

  const setField = useCallback((field: LoginFormField, value: string) => {
    setState((prev) => ({ ...prev, [field]: value, error: null }));
  }, []);

  const reset = useCallback(() => setState(loginFormInitialState), []);

  const submit = useCallback(async () => {
    if (!selectCanSubmitLogin(state)) return;
    setState((prev) => ({ ...prev, submitting: true, error: null }));
    try {
      const result = await signIn.mutateAsync({
        email: state.email.trim(),
        password: state.password,
      });
      storeSignIn(result);
      setState(loginFormInitialState);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "We couldn't sign you in. Check your email and password.";
      setState((prev) => ({ ...prev, submitting: false, error: message }));
    }
  }, [signIn, state, storeSignIn]);

  return {
    state,
    canSubmit: selectCanSubmitLogin(state),
    setField,
    submit,
    reset,
  };
}
