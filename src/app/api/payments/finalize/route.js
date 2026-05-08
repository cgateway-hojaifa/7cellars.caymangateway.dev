import { NextResponse } from "next/server";
import { logErrorToDB } from "@/lib/errorLogger";
import { PAYMENT_STATUS_FAILED } from "@/constant";
import Payment from "@/models/Payment";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const transactionId = searchParams.get("transactionId");
  
  try {
    const payment = await Payment.findOne({
      where: { transaction_id: transactionId },
      attributes: [
        "status",
        "transaction_id",
        "amount",
        "invoice",
        "currency",
        "first_name",
        "last_name",
        "email",
        "address",
        "city",
        "zip",
        "country",
        "phone",
        "card_number",
      ],
    });

    if (!payment) {
      return NextResponse.json(
        {
          success: false,
          view: PAYMENT_STATUS_FAILED,
          message: `Payment with ID ${transactionId} not found.`,
        },
        { status: 200 }
      );
    }

    const paymentData = payment.toJSON();

    return NextResponse.json(
      { success: true, data: paymentData },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching payment:", error);

    await logErrorToDB({
      error: error,
      url: request.url,
    });

    return NextResponse.json(
      {
        success: false,
        view: PAYMENT_STATUS_FAILED,
        message: "An internal server error occurred.",
        error: error,
      },
      { status: 500 }
    );
  }
}
