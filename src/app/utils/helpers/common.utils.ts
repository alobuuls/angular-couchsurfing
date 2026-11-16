// Check whether a value contains valid information.
export const hasValue = (value: unknown): boolean => {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.some(item => hasValue(item));
  }

  // Numbers (including 0) and booleans (including false) are valid.
  return true;
};

// Return only values that contain valid information.
export const getValidValues = <T>(values: T[] | null | undefined): T[] => {
  return (values ?? []).filter(value => hasValue(value));
};

// Format location values without empty parts.
export const formatLocation = (...values: unknown[]): string => {
  return values
    .filter(value => hasValue(value))
    .map(value => String(value).trim())
    .join(', ');
};
