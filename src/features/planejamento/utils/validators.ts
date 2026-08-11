import type { ValidationResult } from "../types";

export function success<T>(data: T): ValidationResult<T> {
  return { success: true, data };
}

export function failure<T>(...errors: string[]): ValidationResult<T> {
  return { success: false, errors };
}

export function combineErrors(...errorLists: string[][]) {
  return errorLists.flat().filter(Boolean);
}
