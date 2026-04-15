import type { LoginFormState } from "../types";

import {
  isValidEmail,
  isValidPassword,
  loginFormInitialState,
  selectCanSubmitLogin,
  selectEmailError,
  selectPasswordError,
} from "../selectors";

function makeState(overrides: Partial<LoginFormState> = {}): LoginFormState {
  return { ...loginFormInitialState, ...overrides };
}

describe("auth selectors — isValidEmail", () => {
  it.each([
    "user@example.com",
    "a.b+tag@sub.domain.co",
    "USER@EXAMPLE.COM",
    "  user@example.com  ",
  ])("accepts %s", (email) => {
    expect(isValidEmail(email)).toBe(true);
  });

  it.each([
    "",
    "user",
    "user@",
    "@example.com",
    "user@example",
    "user @example.com",
    "user@exa mple.com",
  ])("rejects %s", (email) => {
    expect(isValidEmail(email)).toBe(false);
  });
});

describe("auth selectors — isValidPassword", () => {
  it("rejects passwords under 8 characters", () => {
    expect(isValidPassword("")).toBe(false);
    expect(isValidPassword("1234567")).toBe(false);
  });

  it("accepts passwords at or above 8 characters", () => {
    expect(isValidPassword("12345678")).toBe(true);
    expect(isValidPassword("a very long password")).toBe(true);
  });
});

describe("auth selectors — selectCanSubmitLogin", () => {
  it("returns false while submitting even with valid inputs", () => {
    const state = makeState({
      email: "user@example.com",
      password: "password1",
      submitting: true,
    });
    expect(selectCanSubmitLogin(state)).toBe(false);
  });

  it("returns false when email is invalid", () => {
    const state = makeState({ email: "nope", password: "password1" });
    expect(selectCanSubmitLogin(state)).toBe(false);
  });

  it("returns false when password is too short", () => {
    const state = makeState({ email: "user@example.com", password: "short" });
    expect(selectCanSubmitLogin(state)).toBe(false);
  });

  it("returns true when both are valid and not submitting", () => {
    const state = makeState({
      email: "user@example.com",
      password: "password1",
    });
    expect(selectCanSubmitLogin(state)).toBe(true);
  });
});

describe("auth selectors — selectEmailError", () => {
  it("returns null when email is empty", () => {
    expect(selectEmailError(makeState({ email: "" }))).toBeNull();
  });

  it("returns null when email is valid", () => {
    expect(selectEmailError(makeState({ email: "user@example.com" }))).toBeNull();
  });

  it("returns an error string when email is non-empty and invalid", () => {
    expect(selectEmailError(makeState({ email: "nope" }))).toBe(
      "Enter a valid email address.",
    );
  });
});

describe("auth selectors — selectPasswordError", () => {
  it("returns null when password is empty", () => {
    expect(selectPasswordError(makeState({ password: "" }))).toBeNull();
  });

  it("returns null when password meets minimum length", () => {
    expect(
      selectPasswordError(makeState({ password: "password1" })),
    ).toBeNull();
  });

  it("returns an error string when password is non-empty and too short", () => {
    expect(selectPasswordError(makeState({ password: "short" }))).toBe(
      "Password must be at least 8 characters.",
    );
  });
});

describe("auth selectors — loginFormInitialState", () => {
  it("is a clean, non-submitting state", () => {
    expect(loginFormInitialState).toEqual({
      email: "",
      password: "",
      submitting: false,
      error: null,
    });
  });
});
