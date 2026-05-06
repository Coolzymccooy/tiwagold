import { useCallback, useState } from "react";
import { router } from "expo-router";
import { useForgotPassword, useSignIn, useSignUp } from "@/services/auth";
import { useAuthStore } from "@/state/authStore";
import {
  forgotPasswordFormInitialState,
  loginFormInitialState,
  selectCanSubmitForgotPassword,
  selectCanSubmitLogin,
  selectCanSubmitSignup,
  signupFormInitialState,
} from "./selectors";
import type {
  ForgotPasswordFormField,
  ForgotPasswordFormState,
  LoginFormField,
  LoginFormState,
  SignupFormField,
  SignupFormState,
} from "./types";

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
      router.replace("/");
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

export interface UseSignupFormResult {
  state: SignupFormState;
  canSubmit: boolean;
  setField: (field: SignupFormField, value: string) => void;
  submit: () => Promise<void>;
  reset: () => void;
}

export function useSignupForm(): UseSignupFormResult {
  const [state, setState] = useState<SignupFormState>(signupFormInitialState);
  const signUp = useSignUp();
  const storeSignIn = useAuthStore((s) => s.signIn);

  const setField = useCallback((field: SignupFormField, value: string) => {
    setState((prev) => ({ ...prev, [field]: value, error: null }));
  }, []);

  const reset = useCallback(() => setState(signupFormInitialState), []);

  const submit = useCallback(async () => {
    if (!selectCanSubmitSignup(state)) return;
    setState((prev) => ({ ...prev, submitting: true, error: null }));
    try {
      const result = await signUp.mutateAsync({
        email: state.email.trim(),
        password: state.password,
        displayName: state.name.trim(),
      });
      storeSignIn(result);
      setState(signupFormInitialState);
      router.replace("/");
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "We couldn't create your account. Try again.";
      setState((prev) => ({ ...prev, submitting: false, error: message }));
    }
  }, [signUp, state, storeSignIn]);

  return {
    state,
    canSubmit: selectCanSubmitSignup(state),
    setField,
    submit,
    reset,
  };
}

export interface UseForgotPasswordFormResult {
  state: ForgotPasswordFormState;
  canSubmit: boolean;
  setField: (field: ForgotPasswordFormField, value: string) => void;
  submit: () => Promise<void>;
  reset: () => void;
}

export function useForgotPasswordForm(): UseForgotPasswordFormResult {
  const [state, setState] = useState<ForgotPasswordFormState>(
    forgotPasswordFormInitialState,
  );
  const forgotPassword = useForgotPassword();

  const setField = useCallback(
    (field: ForgotPasswordFormField, value: string) => {
      setState((prev) => ({
        ...prev,
        [field]: value,
        error: null,
        success: false,
      }));
    },
    [],
  );

  const reset = useCallback(
    () => setState(forgotPasswordFormInitialState),
    [],
  );

  const submit = useCallback(async () => {
    if (!selectCanSubmitForgotPassword(state)) return;
    setState((prev) => ({
      ...prev,
      submitting: true,
      error: null,
      success: false,
    }));
    try {
      await forgotPassword.mutateAsync({ email: state.email.trim() });
      setState((prev) => ({
        ...prev,
        submitting: false,
        error: null,
        success: true,
      }));
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Couldn't send a reset link. Try again shortly.";
      setState((prev) => ({
        ...prev,
        submitting: false,
        error: message,
        success: false,
      }));
    }
  }, [forgotPassword, state]);

  return {
    state,
    canSubmit: selectCanSubmitForgotPassword(state),
    setField,
    submit,
    reset,
  };
}
