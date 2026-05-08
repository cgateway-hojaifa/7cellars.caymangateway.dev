import { NextResponse } from "next/server";
import axios from "axios";
import { logErrorToDB } from "@/lib/errorLogger";
import {
  GATEWAY_SUCCESS_RESULT_CODE,
  PAYMENT_STATUS_FAILED,
  PAYMENT_STATUS_SUCCESS,
} from "@/constant";
import Payment from "@/models/Payment";
import fs from 'fs';
import path from 'path';

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatCurrency(amount, currency = 'USD') {
  const formattedAmount = parseFloat(amount).toFixed(2);
  return `${currency} $${formattedAmount}`;
}

function generatePaymentSuccessHTML(paymentInfo) {
  const templatePath = path.join(process.cwd(), 'src', 'templates', 'payment-success.html');
  let htmlTemplate = fs.readFileSync(templatePath, 'utf8');

  const customerName = [paymentInfo.title ?? null, paymentInfo.first_name, paymentInfo.last_name].filter(Boolean).join(' ').trim();
  const formattedAmount = formatCurrency(paymentInfo.amount, paymentInfo.currency);
  const formattedDate = formatDate(paymentInfo.updated_at || new Date());
  const cardNumber = paymentInfo.card_number;
  const transactionId = paymentInfo.transaction_id;
  const customerEmail = paymentInfo.email;
  const supportEmail = process.env.SUPPORT_MAIL_ADDRESS;
  const phoneNumber = paymentInfo.phone_number;
  const invoice = paymentInfo.invoice;
  const address = paymentInfo.address;
  const city = paymentInfo.city;
  const country = paymentInfo.country;
  const postalCode = paymentInfo.postal_code;
  const retRefnum = paymentInfo.ret_ref_num;
  const logoUrl = process.env.NEXT_PUBLIC_APP_URL + '/logo.png';
  const successIconUrl = process.env.NEXT_PUBLIC_APP_URL + '/check.png';

  let phoneRow = '';

  if (phoneNumber) {
    phoneRow = `
    <tr>
      <td style="padding:8px 0; color:#555;">Phone Number</td>
      <td style="padding:8px 0; text-align:right; font-weight:700;">${phoneNumber}</td>
    </tr>
    `;
  }

  let invoiceRow = '';
  if (invoice) {
    invoiceRow = `
    <tr>
      <td style="padding:8px 0; color:#555;">Invoice Number</td>
      <td style="padding:8px 0; text-align:right; font-weight:700;">${invoice}</td>
    </tr>
    `;
  }

  htmlTemplate = htmlTemplate
    .replace(/{{customerName}}/g, customerName)
    .replace(/{{amount}}/g, formattedAmount)
    .replace(/{{date}}/g, formattedDate)
    .replace(/{{cardNumber}}/g, cardNumber)
    .replace(/{{transactionId}}/g, transactionId)
    .replace(/{{email}}/g, customerEmail)
    .replace(/{{supportEmail}}/g, supportEmail)
    .replace(/{{phoneRow}}/g, phoneRow)
    .replace(/{{invoiceRow}}/g, invoiceRow)
    .replace(/{{address}}/g, address)
    .replace(/{{city}}/g, city)
    .replace(/{{country}}/g, country)
    .replace(/{{postalCode}}/g, postalCode)
    .replace(/{{retRefnum}}/g, retRefnum)
    .replace(/{{logoUrl}}/g, logoUrl)
    .replace(/{{successIconUrl}}/g, successIconUrl);

  return htmlTemplate;
}

async function sendEmailWithBrevo(paymentInfo) {
  const apiKey = process.env.BREVO_API_KEY;
  const apiURL = process.env.BREVO_API_URL + "smtp/email";
  const fromEmail = process.env.MAIL_FROM_ADDRESS;
  const fromName = process.env.MAIL_FROM_NAME;
  const bccEmails = process.env.MAIL_BCC_ADDRESS ? process.env.MAIL_BCC_ADDRESS.split(",") : [];
  const toName = [paymentInfo.title ?? null, paymentInfo.first_name, paymentInfo.last_name].filter(Boolean).join(' ').trim() || 'Valued Customer';
  const toEmail = paymentInfo.email;
  const emailHTML = generatePaymentSuccessHTML(paymentInfo);

  const payload = {
    sender: {
      name: fromName,
      email: fromEmail,
    },
    to: [{
      name: toName,
      email: toEmail,
    }],
    ...(bccEmails.length > 0 && {
      bcc: bccEmails.map(email => ({
        email: email.trim(),
      })),
    }),
    subject: `Your Payment Has Been Successfully Received`,
    htmlContent: emailHTML,
  };

  try {
    await axios.post(apiURL, payload, {
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error(
      "Brevo email failed:",
      error?.response?.data || error.message
    );
    throw error;
  }
}

export async function POST(request) {
  let requestBodyJson;
  try {
    requestBodyJson = await request.json();

    const webhookPayload = {
      transactionId: requestBodyJson["transaction-id"],
      address: requestBodyJson.billing?.address1 || "",
      city: requestBodyJson.billing?.city || "",
      zip: requestBodyJson.billing?.postal || "",
      cardNumber: requestBodyJson.maskedPAN || "",
      currency: requestBodyJson.currency,
      resultCode: requestBodyJson["result-code"],
      authCode: requestBodyJson["authorization-code"] || "",
      subscriptionId: requestBodyJson["vault-sub-id"] || "",
      retRefnum: requestBodyJson.retRefnum || "",
      customerVaultId: requestBodyJson["customer-vault-id"] || "",
    };

    if (webhookPayload.resultCode === GATEWAY_SUCCESS_RESULT_CODE) {
      const payment = await Payment.findOne({
        where: { transaction_id: webhookPayload.transactionId },
      });

      if (!payment) {
        return NextResponse.json(
          { message: "Payment record not found." },
          { status: 404 }
        );
      }

      await payment.update({
        response: JSON.stringify(requestBodyJson),
        card_number: webhookPayload.cardNumber,
        status: PAYMENT_STATUS_SUCCESS,
        updated_at: new Date(),
      });

      const paymentData = payment.toJSON();

      const emailPayload = {
        first_name: paymentData.first_name,
        last_name: paymentData.last_name,
        email: paymentData.email,
        address: paymentData.address,
        city: paymentData.city,
        country: paymentData.country,
        postal_code: paymentData.zip,
        amount: paymentData.amount,
        invoice: paymentData.invoice || null,
        currency: paymentData.currency,
        transaction_id: paymentData.transaction_id,
        ret_ref_num: requestBodyJson.retRefnum,
        card_number: webhookPayload.cardNumber || paymentData.card_number,
        updated_at: paymentData.updated_at,
      };

      if (paymentData.phone) {
        emailPayload.phone_number = paymentData.phone;
      }

      await sendEmailWithBrevo(emailPayload);

      return NextResponse.json(
        { message: "Payment successful" },
        { status: 200 }
      );
    }

    const payment = await Payment.findOne({
      where: { transaction_id: webhookPayload.transactionId },
    });

    if (payment) {
      await payment.update({
        response: JSON.stringify(requestBodyJson),
        status: PAYMENT_STATUS_FAILED,
        updated_at: new Date(),
      });
    }

    return NextResponse.json(
      { message: "Payment failed" },
      { status: 200 }
    );

  } catch (error) {
    await logErrorToDB({
      error,
      url: request.url,
      requestData: requestBodyJson,
    });
    return NextResponse.json(
      { message: "Internal server error processing notification." },
      { status: 500 }
    );
  }
}