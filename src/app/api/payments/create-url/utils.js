export function formatCardDate(expMonth, expYear) {
  const formattedExpYear = expYear ? String(expYear).slice(-2) : "";
  const expDate =
    expMonth && formattedExpYear
      ? `${String(expMonth).padStart(2, "0")}${formattedExpYear}`
      : "";

  return expDate;
}
