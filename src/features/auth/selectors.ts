import type { LoginFormState } from "./types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

export function isValidPassword(password: string): boolean {
  return password.length >= MIN_PASSWORD_LENGTH;
}

export function selectCanSubmitLogin(state: LoginFormState): boolean {
  if (state.submitting) return false;
  return isValidEmail(state.email) && isValidPassword(state.password);
}

export function selectEmailError(state: LoginFormState): string | null {
  if (state.email.length === 0) return null;
  return isValidEmail(state.email) ? null : "Enter a valid email address.";
}

export function selectPasswordError(state: LoginFormState): string | null {
  if (state.password.length === 0) return null;
  return isValidPassword(state.password)
    ? null
    : `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
}

export const loginFormInitialState: LoginFormState = {
  email: "",
  password: "",
  submitting: false,
  error: null,
};
