export const getCardLogo = (cardNumber) => {
  const firstFour = cardNumber.replace(/\s/g, "").slice(0, 4); // Remove spaces
  if (/^34|^37/.test(firstFour)) {
    return "/amex.png";
  } else if (/^35/.test(firstFour)) {
    return "/jcb.png";
  } else if (/^5[1-5]/.test(firstFour)) {
    return "/mastercard.png";
  } else if (/^4/.test(firstFour)) {
    return "/visa.png";
  } else {
    return "/default-card.png";
  }
};

export const formatCardNumber = (value) => {
  const cleanValue = value.replace(/\D/g, "");
  const limitedValue = cleanValue.slice(0, 19); // Allow up to 19 digits

  let formattedValue = "";
  for (let i = 0; i < limitedValue.length; i++) {
    if (i > 0 && i % 4 === 0) {
      formattedValue += " ";
    }
    formattedValue += limitedValue[i];
  }

  return formattedValue;
};

export const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isValidLuhn = (cardNumber) => {
  if (/[^0-9-\s]+/.test(cardNumber)) return false;

  let nCheck = 0,
    bEven = false;
  const val = cardNumber.replace(/\D/g, "");

  for (var n = val.length - 1; n >= 0; n--) {
    var cDigit = val.charAt(n),
      nDigit = parseInt(cDigit, 10);

    if (bEven && (nDigit *= 2) > 9) nDigit -= 9;

    nCheck += nDigit;
    bEven = !bEven;
  }

  return nCheck % 10 == 0;
};

export const validateCardNumber = (cardNumber) => {
  const cleanedCardNumber = cardNumber.replace(/\D/g, "");

  if (cleanedCardNumber.length < 13 || cleanedCardNumber.length > 19) {
    return "Card number must be 13 to 19 digits";
  }
  if (!isValidLuhn(cleanedCardNumber)) {
    return "Please enter a valid card number";
  }
  return "";
};

export const validateCVC = (cvc) => {
  const cleanedCVC = cvc.replace(/\D/g, "");
  if (cleanedCVC.length < 3 || cleanedCVC.length > 4) {
    return "CVC must be 3 or 4 digits";
  }
  return "";
};


export const calculateAmount = (dailyRate) => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const currentDay = today.getDate();
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const remainingDays = lastDayOfMonth - currentDay;
  return remainingDays * dailyRate;
};

const DAYS_PER_MONTH = 30;

export function getAmountByPlanName(planName) {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const currentDay = today.getDate();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const remainingDays = daysInMonth - currentDay + 1;
  const proratedMonthly = (monthlyAmount) =>
    Math.round((monthlyAmount * remainingDays) / DAYS_PER_MONTH * 100) / 100;

  switch (planName) {
    case "Chelsea Flynn Coaching Membership":
      return proratedMonthly(200);
    case "1:1 Life Transformation Programme":
      return 2000;
    case "1:1 Life Transformation Programme - Instalment":
      return 1000;
    case "1 Hour Breakthrough Session":
      return 250;
    default:
      return calculateAmount(process.env.PER_DAY_AMOUNT || 5);
  }
}

export function toTitleCase(text) {
  return text
    .toLowerCase()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}