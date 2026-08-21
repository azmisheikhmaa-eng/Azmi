function parseDay(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return undefined;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
  if (date.getFullYear() !== Number(match[1]) || date.getMonth() !== Number(match[2]) - 1 || date.getDate() !== Number(match[3])) return undefined;
  return date;
}

function annualDate(year: number, month: number, day: number) {
  const candidate = new Date(year, month, day, 9);
  if (candidate.getMonth() === month) return candidate;
  return new Date(year, month + 1, 0, 9);
}

export function nextAnnualOccurrence(value: string, reference = new Date()) {
  const source = parseDay(value);
  if (!source) return undefined;
  const today = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate(), 0).getTime();
  let candidate = annualDate(reference.getFullYear(), source.getMonth(), source.getDate());
  if (candidate.getTime() < today) candidate = annualDate(reference.getFullYear() + 1, source.getMonth(), source.getDate());
  return candidate;
}
