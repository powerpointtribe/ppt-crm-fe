/**
 * Frontend validation utilities for email and phone validation
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export class ValidationUtils {
  /**
   * Nigerian phone number regex pattern
   * Supports: +2348012345678, 08012345678
   * Networks: MTN, Airtel, Glo, 9mobile
   */
  static readonly NIGERIAN_PHONE_REGEX = /^(\+234|0)[789][01]\d{8}$/;

  /**
   * Email regex pattern (RFC 5322 compliant)
   */
  static readonly EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  /**
   * Validates Nigerian phone number
   * @param phone - Phone number to validate
   * @returns ValidationResult - Result with validity and error message
   */
  static validatePhone(phone: string): ValidationResult {
    if (!phone || phone.trim().length === 0) {
      return { isValid: false, error: 'Phone number is required' };
    }

    const cleanPhone = phone.trim();

    if (!this.NIGERIAN_PHONE_REGEX.test(cleanPhone)) {
      return {
        isValid: false,
        error: 'Please enter a valid Nigerian phone number (e.g., +2348012345678 or 08012345678)'
      };
    }

    return { isValid: true };
  }

  /**
   * Validates email address
   * @param email - Email address to validate
   * @returns ValidationResult - Result with validity and error message
   */
  static validateEmail(email: string): ValidationResult {
    if (!email || email.trim().length === 0) {
      return { isValid: false, error: 'Email address is required' };
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!this.EMAIL_REGEX.test(cleanEmail)) {
      return {
        isValid: false,
        error: 'Please enter a valid email address'
      };
    }

    return { isValid: true };
  }

  /**
   * Validates optional email (can be empty)
   * @param email - Email address to validate
   * @returns ValidationResult - Result with validity and error message
   */
  static validateOptionalEmail(email: string): ValidationResult {
    if (!email || email.trim().length === 0) {
      return { isValid: true };
    }

    return this.validateEmail(email);
  }

  /**
   * Validates optional phone (can be empty)
   * @param phone - Phone number to validate
   * @returns ValidationResult - Result with validity and error message
   */
  static validateOptionalPhone(phone: string): ValidationResult {
    if (!phone || phone.trim().length === 0) {
      return { isValid: true };
    }

    return this.validatePhone(phone);
  }

  /**
   * Normalizes Nigerian phone number to +234 format
   * @param phone - Phone number to normalize
   * @returns string - Normalized phone number
   */
  static normalizePhone(phone: string): string {
    if (!phone) return phone;

    const cleaned = phone.trim().replace(/\s+/g, '').replace(/[-()]/g, '');

    // If already starts with +234, return as is
    if (cleaned.startsWith('+234')) {
      return cleaned;
    }

    // If starts with 0, replace with +234
    if (cleaned.startsWith('0')) {
      return '+234' + cleaned.substring(1);
    }

    // If starts with 234, add +
    if (cleaned.startsWith('234')) {
      return '+' + cleaned;
    }

    return phone; // Return original if can't normalize
  }

  /**
   * Normalizes email address to lowercase
   * @param email - Email address to normalize
   * @returns string - Normalized email address
   */
  static normalizeEmail(email: string): string {
    if (!email) return email;
    return email.trim().toLowerCase();
  }

  /**
   * Validates contact information (requires at least one contact method)
   * @param email - Email address
   * @param phone - Phone number
   * @returns ValidationResult - Result with validity and error message
   */
  static validateContactInfo(email: string, phone: string): ValidationResult {
    const hasEmail = email && email.trim().length > 0;
    const hasPhone = phone && phone.trim().length > 0;

    if (!hasEmail && !hasPhone) {
      return {
        isValid: false,
        error: 'At least one contact method (email or phone) is required'
      };
    }

    if (hasEmail) {
      const emailResult = this.validateEmail(email);
      if (!emailResult.isValid) {
        return emailResult;
      }
    }

    if (hasPhone) {
      const phoneResult = this.validatePhone(phone);
      if (!phoneResult.isValid) {
        return phoneResult;
      }
    }

    return { isValid: true };
  }

  /**
   * Validates form data with multiple fields
   * @param data - Object with fields to validate
   * @param rules - Validation rules for each field
   * @returns Object with field errors
   */
  static validateForm(
    data: Record<string, any>,
    rules: Record<string, (value: any) => ValidationResult>
  ): Record<string, string> {
    const errors: Record<string, string> = {};

    Object.keys(rules).forEach(field => {
      const value = data[field];
      const result = rules[field](value);

      if (!result.isValid && result.error) {
        errors[field] = result.error;
      }
    });

    return errors;
  }

  /**
   * Format phone number for display (adds dashes for readability)
   * @param phone - Phone number to format
   * @returns string - Formatted phone number
   */
  static formatPhoneForDisplay(phone: string): string {
    if (!phone) return phone;

    const normalized = this.normalizePhone(phone);

    // Format as +234-801-234-5678
    if (normalized.startsWith('+234') && normalized.length === 14) {
      return `${normalized.substring(0, 4)}-${normalized.substring(4, 7)}-${normalized.substring(7, 10)}-${normalized.substring(10)}`;
    }

    return phone;
  }

  /**
   * Get phone number network provider
   * @param phone - Phone number
   * @returns string - Network provider name
   */
  static getPhoneNetwork(phone: string): string {
    if (!phone) return 'Unknown';

    const normalized = this.normalizePhone(phone);
    const prefix = normalized.substring(4, 7); // Get first 3 digits after +234

    // MTN prefixes
    if (['803', '806', '813', '816', '810', '814', '903', '906'].includes(prefix)) {
      return 'MTN';
    }

    // Airtel prefixes
    if (['802', '808', '812', '701', '708', '901', '902', '904', '907', '912'].includes(prefix)) {
      return 'Airtel';
    }

    // Glo prefixes
    if (['805', '807', '815', '811', '705', '905', '915'].includes(prefix)) {
      return 'Glo';
    }

    // 9mobile prefixes
    if (['809', '817', '818', '819', '908', '909'].includes(prefix)) {
      return '9mobile';
    }

    return 'Unknown';
  }
}

/**
 * React hook for form validation
 */
export const useFormValidation = () => {
  const validateField = (value: string, type: 'email' | 'phone' | 'optionalEmail' | 'optionalPhone'): ValidationResult => {
    switch (type) {
      case 'email':
        return ValidationUtils.validateEmail(value);
      case 'phone':
        return ValidationUtils.validatePhone(value);
      case 'optionalEmail':
        return ValidationUtils.validateOptionalEmail(value);
      case 'optionalPhone':
        return ValidationUtils.validateOptionalPhone(value);
      default:
        return { isValid: true };
    }
  };

  const validateContactInfo = (email: string, phone: string): ValidationResult => {
    return ValidationUtils.validateContactInfo(email, phone);
  };

  return {
    validateField,
    validateContactInfo,
    normalizeEmail: ValidationUtils.normalizeEmail,
    normalizePhone: ValidationUtils.normalizePhone,
    formatPhone: ValidationUtils.formatPhoneForDisplay,
    getPhoneNetwork: ValidationUtils.getPhoneNetwork
  };
};

export default ValidationUtils;