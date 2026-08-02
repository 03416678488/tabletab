export function toDefaultFormatDate(dateTimeStamp: Date) {
  return new Date(dateTimeStamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** Full ISO-8601 timestamp (UTC) — the API contract for createdAt/updatedAt. */
export function toIsoTimestamp(dateTimeStamp: Date) {
  return new Date(dateTimeStamp).toISOString();
}

export function getDateFromTimestamp(dateTimeStamp: Date) {
  return new Date(dateTimeStamp).toISOString().split('T')[0];
}
