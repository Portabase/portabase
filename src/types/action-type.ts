import { SafeActionResult } from "next-safe-action";
import { ZodString } from "zod";

export type ServerActionResult<T> =
  | { success: true; value?: T; actionSuccess?: ActionSuccessMessage }
  | {
      success: false;
      actionError?: ActionErrorMessage;
    };

export type ActionErrorMessage = {
  message?: string;
  status?: number;
  cause?: string;
  messageParams?: Record<string, string | number>;
};

export type ActionSuccessMessage = {
  message?: string;
  messageParams?: Record<string, string | number>;
};

export type ActionResult<T> = SafeActionResult<
  string,
  ZodString,
  readonly [],
  {
    formErrors: string[];
    fieldErrors: {};
  },
  readonly [],
  ServerActionResult<T>,
  object
>;
