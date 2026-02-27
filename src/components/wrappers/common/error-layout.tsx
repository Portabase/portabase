"use client";

import { useSearchParams } from "next/navigation";
import type React from "react";
import { useEffect } from "react";
import { toast } from "sonner";
export const ErrorLayout = ({ children }: { children: React.ReactNode }) => {
  const url = useSearchParams();

  useEffect(() => {
    const error = url.get("error");

    if (!error) return;

    const errorMessages: Record<string, string> = {
      pending: "Your account is not active.",
      invalid_or_expired_token: "Password reset invalid token.",
      account_already_linked_to_different_user:
        "An account already exists with the same email address but different sign-in credentials. Sign in using a provider associated with this email address.",
      USER_NOT_FOUND: "User not found",
      FAILED_TO_CREATE_USER: "Failed to create user",
      FAILED_TO_CREATE_SESSION: "Failed to create session",
      FAILED_TO_UPDATE_USER: "Failed to update user",
      FAILED_TO_GET_SESSION: "Failed to get session",
      INVALID_PASSWORD: "Invalid password",
      INVALID_EMAIL: "Invalid email",
      INVALID_EMAIL_OR_PASSWORD: "Invalid email or password",
      INVALID_USER: "Invalid user",
      SOCIAL_ACCOUNT_ALREADY_LINKED: "Social account already linked",
      PROVIDER_NOT_FOUND: "Provider not found",
      INVALID_TOKEN: "Invalid token",
      TOKEN_EXPIRED: "Token expired",
      ID_TOKEN_NOT_SUPPORTED: "id_token not supported",
      FAILED_TO_GET_USER_INFO: "Failed to get user info",
      USER_EMAIL_NOT_FOUND: "User email not found",
      EMAIL_NOT_VERIFIED: "Email not verified",
      PASSWORD_TOO_SHORT: "Password too short",
      PASSWORD_TOO_LONG: "Password too long",
      USER_ALREADY_EXISTS: "User already exists.",
      USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
        "User already exists. Use another email.",
      EMAIL_CAN_NOT_BE_UPDATED: "Email can not be updated",
      CREDENTIAL_ACCOUNT_NOT_FOUND: "Credential account not found",
      SESSION_EXPIRED:
        "Session expired. Re-authenticate to perform this action.",
      FAILED_TO_UNLINK_LAST_ACCOUNT: "You can't unlink your last account",
      ACCOUNT_NOT_FOUND: "Account not found",
      USER_ALREADY_HAS_PASSWORD:
        "User already has a password. Provide that to delete the account.",
      CROSS_SITE_NAVIGATION_LOGIN_BLOCKED:
        "Cross-site navigation login blocked. This request appears to be a CSRF attack.",
      VERIFICATION_EMAIL_NOT_ENABLED: "Verification email isn't enabled",
      EMAIL_ALREADY_VERIFIED: "Email is already verified",
      EMAIL_MISMATCH: "Email mismatch",
      SESSION_NOT_FRESH: "Session is not fresh",
      LINKED_ACCOUNT_ALREADY_EXISTS: "Linked account already exists",
      INVALID_ORIGIN: "Invalid origin",
      INVALID_CALLBACK_URL: "Invalid callbackURL",
      INVALID_REDIRECT_URL: "Invalid redirectURL",
      INVALID_ERROR_CALLBACK_URL: "Invalid errorCallbackURL",
      INVALID_NEW_USER_CALLBACK_URL: "Invalid newUserCallbackURL",
      MISSING_OR_NULL_ORIGIN: "Missing or null Origin",
      CALLBACK_URL_REQUIRED: "callbackURL is required",
      FAILED_TO_CREATE_VERIFICATION: "Unable to create verification",
      FIELD_NOT_ALLOWED: "Field not allowed to be set",
      ASYNC_VALIDATION_NOT_SUPPORTED: "Async validation is not supported",
      VALIDATION_ERROR: "Validation Error",
      MISSING_FIELD: "Field is required",
      METHOD_NOT_ALLOWED_DEFER_SESSION_REQUIRED:
        "POST method requires deferSessionRefresh to be enabled in session config",
      BODY_MUST_BE_AN_OBJECT: "Body must be an object",
      PASSWORD_ALREADY_SET: "User already has a password set",
      Sign_up_is_disabled: "Sign up is disabled by the administrator",
    };

    const match = Object.entries(errorMessages).find(([key]) =>
      error.includes(key),
    );

    if (!match) return;

    toast.error(match[1]);

    const params = new URLSearchParams(url.toString());
    params.delete("error");
    const newUrl =
      window.location.pathname +
      (params.toString() ? `?${params.toString()}` : "");

    window.history.replaceState({}, document.title, newUrl);
  }, [url]);

  return <>{children}</>;
};
