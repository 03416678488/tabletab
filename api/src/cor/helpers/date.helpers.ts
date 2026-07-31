export function toDefaultFormatDate(dateTimeStamp: Date) {
  return new Date(dateTimeStamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function getDateFromTimestamp(dateTimeStamp: Date) {
  return new Date(dateTimeStamp).toISOString().split('T')[0];
}
