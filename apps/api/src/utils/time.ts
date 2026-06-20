const HHMM_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidHHMM(value: string): boolean {
  return HHMM_PATTERN.test(value);
}

export function timeToMinutes(value: string): number {
  if (!isValidHHMM(value)) {
    throw new Error("Invalid time format. Expected HH:mm");
  }

  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function assertStartBeforeEnd(startTime: string, endTime: string): void {
  if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
    throw new Error("startTime must be less than endTime");
  }
}

export function doTimeRangesOverlap(
  existingStart: string,
  existingEnd: string,
  newStart: string,
  newEnd: string
): boolean {
  return (
    timeToMinutes(existingStart) < timeToMinutes(newEnd) &&
    timeToMinutes(existingEnd) > timeToMinutes(newStart)
  );
}
