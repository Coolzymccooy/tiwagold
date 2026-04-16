import type {
  ForgotPasswordFormState,
  LoginFormState,
  SignupFormState,
} from "./types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const MIN_NAME_LENGTH = 2;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

export function isValidPassword(password: string): boolean {
  return password.length >= MIN_PASSWORD_LENGTH;
}

export function isValidName(name: string): boolean {
  return name.trim().length >= MIN_NAME_LENGTH;
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

export function selectCanSubmitSignup(state: SignupFormState): boolean {
  if (state.submitting) return false;
  return (
    isValidName(state.name) &&
    isValidEmail(state.email) &&
    isValidPassword(state.password)
  );
}

export function selectSignupNameError(state: SignupFormState): string | null {
  if (state.name.length === 0) return null;
  return isValidName(state.name) ? null : "Enter the name on your account.";
}

export function selectSignupEmailError(state: SignupFormState): string | null {
  if (state.email.length === 0) return null;
  return isValidEmail(state.email) ? null : "Enter a valid email address.";
}

export function selectSignupPasswordError(
  state: SignupFormState,
): string | null {
  if (state.password.length === 0) return null;
  return isValidPassword(state.password)
    ? null
    : `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
}

export const signupFormInitialState: SignupFormState = {
  name: "",
  email: "",
  password: "",
  submitting: false,
  error: null,
};

export function selectCanSubmitForgotPassword(
  state: ForgotPasswordFormState,
): boolean {
  if (state.submitting) return false;
  return isValidEmail(state.email);
}

export function selectForgotPasswordEmailError(
  state: ForgotPasswordFormState,
): string | null {
  if (state.email.length === 0) return null;
  return isValidEmail(state.email) ? null : "Enter a valid email address.";
}

export const forgotPasswordFormInitialState: ForgotPasswordFormState = {
  email: "",
  submitting: false,
  error: null,
  success: false,
};
