export interface LoginFormState {
  email: string;
  password: string;
  submitting: boolean;
  error: string | null;
}

export type LoginFormField = "email" | "password";
