/**
 * Error extraction and formatting utilities for GraphQL and API errors in stance-booking.
 */

export interface ExtractedErrorInfo {
  message: string;
  field?: 'email' | 'phone' | 'firstName' | 'general';
}

/**
 * Extracts a user-friendly error message and identifies the relevant form field (if any)
 * from an ApolloError, GraphQL error response, or standard Error object.
 */
export function extractErrorMessage(error: any): ExtractedErrorInfo {
  if (!error) {
    return { message: 'An unexpected error occurred. Please try again.' };
  }

  // 1. Inspect graphQLErrors metadata / originalError / MongoDB error details
  const graphQLErrors = error.graphQLErrors || (Array.isArray(error) ? error : []);
  const firstGraphQLError = graphQLErrors[0] || error;

  const origError =
    firstGraphQLError?.info?.metadata?.originalError ||
    error?.info?.metadata?.originalError ||
    firstGraphQLError?.metadata?.originalError ||
    error?.metadata?.originalError;

  const isDuplicateKey =
    origError?.code === 11000 ||
    origError?.codeName === 'DuplicateKey' ||
    origError?.errorResponse?.code === 11000 ||
    origError?.errorResponse?.codeName === 'DuplicateKey';

  if (isDuplicateKey) {
    const keyPattern =
      origError?.keyPattern ||
      origError?.errorResponse?.keyPattern ||
      origError?.keyValue ||
      origError?.errorResponse?.keyValue ||
      {};
    const errmsg = origError?.errmsg || origError?.errorResponse?.errmsg || '';

    if ('email' in keyPattern || errmsg.includes('email_1') || errmsg.includes('dup key: { email')) {
      return {
        message: 'This email is already registered. Please use a different email address.',
        field: 'email',
      };
    }

    if ('phone' in keyPattern || errmsg.includes('phone_1') || errmsg.includes('dup key: { phone')) {
      return {
        message: 'This phone number is already registered. Please use a different phone number.',
        field: 'phone',
      };
    }

    return {
      message: 'This record already exists with the provided information. Please check your details.',
      field: 'general',
    };
  }

  // 2. Check message string for known error phrases
  const rawMsg =
    firstGraphQLError?.message ||
    error?.message ||
    (typeof error === 'string' ? error : '');
  const lowerMsg = rawMsg.toLowerCase();

  // Email duplicate / validation issues
  if (
    lowerMsg.includes('email already exists') ||
    lowerMsg.includes('account with this email already exists') ||
    lowerMsg.includes('email_1 dup key') ||
    (lowerMsg.includes('duplicate key') && lowerMsg.includes('email'))
  ) {
    return {
      message: 'This email is already registered. Please use a different email address.',
      field: 'email',
    };
  }

  // Phone duplicate / validation issues
  if (
    lowerMsg.includes('phone already exists') ||
    lowerMsg.includes('account with this phone already exists') ||
    lowerMsg.includes('phone_1 dup key') ||
    (lowerMsg.includes('duplicate key') && lowerMsg.includes('phone'))
  ) {
    return {
      message: 'This phone number is already registered. Please use a different phone number.',
      field: 'phone',
    };
  }

  if (
    lowerMsg.includes('invalid email address') ||
    lowerMsg.includes('invalid email format')
  ) {
    return {
      message: 'Please enter a valid email address.',
      field: 'email',
    };
  }

  if (
    lowerMsg.includes('phone number must be 10 digits') ||
    lowerMsg.includes('not a valid phone number')
  ) {
    return {
      message: 'Phone number must be a valid 10-digit number.',
      field: 'phone',
    };
  }

  // 3. Filter out cryptic backend/internal exception phrases
  if (
    lowerMsg.includes('unexpected error') ||
    lowerMsg.includes('plan executor error') ||
    lowerMsg.includes('db_update_failed') ||
    lowerMsg.includes('dbdataupdateerror') ||
    lowerMsg.includes('failed to update unexpected error')
  ) {
    return {
      message: 'Failed to update profile. Please check your details and try again.',
      field: 'general',
    };
  }

  if (rawMsg && rawMsg.trim().length > 0) {
    return { message: rawMsg };
  }

  return { message: 'Failed to update profile. Please try again.' };
}
