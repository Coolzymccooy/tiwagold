export interface LoginFormState {
  email: string;
  password: string;
  submitting: boolean;
  error: string | null;
}

export type LoginFormField = "email" | "password";

export interface SignupFormState {
  name: string;
  email: string;
  password: string;
  submitting: boolean;
  error: string | null;
}

export type SignupFormField = "name" | "email" | "password";

export interface ForgotPasswordFormState {
  email: string;
  submitting: boolean;
  error: string | null;
  success: boolean;
}

export type ForgotPasswordFormField = "email";
