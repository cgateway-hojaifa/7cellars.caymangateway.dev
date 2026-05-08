import { NextResponse } from "next/server";
import axios from "axios";
import { logErrorToDB } from "@/lib/errorLogger";
import { PAYMENT_STATUS_PENDING } from "@/constant";
import Payment from "@/models/Payment";
import BlockedIP from "@/models/BlockedIP";
import { getIpAddress } from "@/lib/getIpAddress";

async function handleGatewayPayment(paymentInputData) {

  const gatewayApiUrl = `${process.env.GATEWAY_API_URL}/three-step`;
  const gatewayApiKey = process.env.GATEWAY_API_KEY;
  const gatewayUsername = process.env.GATEWAY_USERNAME;
  const gatewayPassword = process.env.GATEWAY_PASSWORD;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  const basicAuthToken = Buffer.from(
    `${gatewayUsername}:${gatewayPassword}`
  ).toString("base64");

  const gatewayPayload = {
    "api-key": gatewayApiKey,
    returnUrl: appUrl + "/finalize-payment",
    notificationUrl: appUrl + "/api/payments/notification",
    amount: paymentInputData.amount,
    currency: paymentInputData.currency || "KYD",
    country: paymentInputData.country || "KY",
    firstName: paymentInputData.firstName,
    lastName: paymentInputData.lastName,
    email: paymentInputData.email,
    street1: paymentInputData.address,
    city: paymentInputData.city,
    zip: paymentInputData.zip,
  };

  if (paymentInputData.phone) {
    gatewayPayload.phone = paymentInputData.phone;
  }

  try {
    const { data } = await axios.post(
      gatewayApiUrl,
      { "sale": gatewayPayload },
      {
        headers: {
          Authorization: `Basic ${basicAuthToken}`,
        },
      }
    );
    return data;
  } catch (error) {
    throw new Error("Failed to create payment: " + error.message);
  }
}

export async function POST(request) {
  let paymentRecord;
  let paymentInputData;

  try {
    const body = await request.json();
    const clientIP = getIpAddress(request);

    const allowedKeys = [
      "recaptchaToken", "firstName", "lastName", "email", "address", "city", "zip",
      "country", "phone", "amount", "currency", "invoice",
    ];
    paymentInputData = {};
    for (const key of allowedKeys) {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        paymentInputData[key] = body[key];
      }
    }

    const blocked = await BlockedIP.findOne({
      where: { ip: clientIP },
    });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const recaptchaToken = paymentInputData.recaptchaToken;

    const secret = process.env.HCAPTCHA_SECRET_KEY;
    if (secret && !recaptchaToken) {
      throw new Error("hCaptcha verification failed.");
    }
    if (secret) {
      const verifyUrl = "https://api.hcaptcha.com/siteverify";
      const verifyRes = await axios.post(
        verifyUrl,
        new URLSearchParams({
          secret,
          response: recaptchaToken,
          ...(clientIP ? { remoteip: clientIP } : {}),
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
      if (!verifyRes.data?.success) {
        throw new Error("hCaptcha verification failed.");
      }
    }

    if (blocked) {
      throw new Error("Security Error");
    }

    const trim = (v) => (typeof v === "string" ? v.trim() : v);

    if (!trim(paymentInputData.firstName)) {
      throw new Error("First name is required");
    }
    if (!trim(paymentInputData.lastName)) {
      throw new Error("Last name is required");
    }
    if (!trim(paymentInputData.email)) {
      throw new Error("Email is required");
    }
    if (!emailRegex.test(trim(paymentInputData.email))) {
      throw new Error("Invalid email format");
    }
    if (!trim(paymentInputData.address)) {
      throw new Error("Address is required");
    }
    if (!trim(paymentInputData.city)) {
      throw new Error("City is required");
    }
    if (!trim(paymentInputData.zip)) {
      throw new Error("Zip code is required");
    }
    if (!paymentInputData.country || !trim(paymentInputData.country)) {
      throw new Error("Country is required");
    }
    if (paymentInputData.amount == null || paymentInputData.amount === "" || Number(paymentInputData.amount) <= 0) {
      throw new Error("Valid amount is required");
    }
    if(!trim(paymentInputData.invoice)) {
      throw new Error("Invoice is required")
    }
    const currencyVal = trim(paymentInputData.currency) || "KYD";
    if (!["USD", "KYD"].includes(currencyVal)) {
      throw new Error("Currency must be USD or KYD");
    }

    const amount = Number(paymentInputData.amount);

    paymentRecord = await Payment.create({
      first_name: paymentInputData.firstName,
      last_name: paymentInputData.lastName,
      email: paymentInputData.email,
      address: paymentInputData.address,
      city: paymentInputData.city,
      zip: paymentInputData.zip,
      country: paymentInputData.country || "KY",
      phone: paymentInputData.phone || null,
      invoice: paymentInputData.invoice || null,
      amount,
      currency: currencyVal,
      status: PAYMENT_STATUS_PENDING,
      ip: clientIP || "",
    });

    const gatewayData = await handleGatewayPayment({
      amount,
      currency: currencyVal,
      country: paymentInputData.country || "KY",
      firstName: paymentInputData.firstName,
      lastName: paymentInputData.lastName,
      email: paymentInputData.email,
      address: paymentInputData.address,
      city: paymentInputData.city,
      zip: paymentInputData.zip,
      phone: paymentInputData.phone,
    });

    const formURL = gatewayData["consumer-url"] ?? false;
    const transactionId = gatewayData["transaction-id"] ?? "";

    if (formURL && transactionId) {
      await paymentRecord.update({ transaction_id: transactionId });

      return NextResponse.json(
        {
          success: true,
          formURL,
        },
        { status: 200 }
      );
    } else {
      throw new Error(
        "Form URL or Transaction ID missing from gateway response."
      );
    }
  } catch (error) {
    await logErrorToDB({
      error,
      url: request.url,
      requestData: paymentInputData,
    });

    return NextResponse.json(
      {
        success: false,
        message: error.message,
        error: error,
      },
      { status: 500 }
    );
  }
}