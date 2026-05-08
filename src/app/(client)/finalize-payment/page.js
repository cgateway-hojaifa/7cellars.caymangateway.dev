"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import axios from "axios";
import { PAYMENT_STATUS_FAILED, PAYMENT_STATUS_SUCCESS } from "@/constant";
import { toTitleCase } from "@/utils";

function PaymentStatus() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const transactionId = searchParams.get("transactionId");
  const supportEmail = process.env.SUPPORT_MAIL_ADDRESS || "hello@example.com";

  const [loading, setLoading] = useState(true);
  const [view, setView] = useState(null);
  const [paymentData, setPaymentData] = useState(null);

  useEffect(() => {
    if (transactionId) {
      let intervalId;

      const checkPayment = async () => {
        try {
          const { data } = await axios.get(
            `/api/payments/finalize?transactionId=${transactionId}`
          );
          if (data.success && data.data) {
            const status = data.data.status?.toLowerCase();
            if (status === PAYMENT_STATUS_SUCCESS) {
              setView(PAYMENT_STATUS_SUCCESS);
              setPaymentData(data.data);
              setLoading(false);
              clearInterval(intervalId);
            } else if (status === PAYMENT_STATUS_FAILED) {
              setView("error");
              setLoading(false);
              clearInterval(intervalId);
            }
          } else {
            setView("error");
            setLoading(false);
            clearInterval(intervalId);
          }
        } catch (error) {
          console.error("Error fetching payment details:", error);
          setView("error");
          setLoading(false);
          clearInterval(intervalId);
        }
      };

      checkPayment();

      intervalId = setInterval(checkPayment, 5000);
      return () => clearInterval(intervalId);
    } else {
      setLoading(false);
      setView("error");
    }
  }, [transactionId]);

  return (
      <div
        style={{ backgroundColor: "#ffffff", boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)", padding: 30 }}
        className="container finalize-status"
      >
        <div className="row justify-content-center align-items-center">
          <div>
            <div className="text-center">
              {loading && (
                <div className="loading">
                  <div
                    className="spinner-border text-primary"
                    role="status"
                    style={{ width: "3rem", height: "3rem" }}
                  >
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <h4 className="mt-3 text-dark">Awaiting Confirmation</h4>
                  <p className="text-muted">
                    The system is awaiting payment confirmation from the payment
                    gateway. This may take a few seconds
                  </p>
                </div>
              )}

              {!loading && view === PAYMENT_STATUS_SUCCESS && paymentData && (
                <div className="col">
                  <h1 className="text-center payment-status-title">Thank You!</h1>
                  <p className="text-muted payment-status-desc mb-4">
                    Your payment has been successfully processed. A confirmation email has been sent to your registered email address.
                  </p>
                  <div className="table-responsive mb-2" style={{ overflowX: "auto" }}>
                    <table className="table table-bordered w-100" style={{ minWidth: "280px" }}>
                      <tbody>
                        <tr>
                          <th className="bg-light text-start">Transaction ID</th>
                          <td className="text-end text-break">{paymentData.transaction_id || "—"}</td>
                        </tr>
                        {paymentData.invoice && (
                          <tr>
                            <th className="bg-light text-start">Invoice Number</th>
                            <td className="text-end text-break">{paymentData.invoice}</td>
                          </tr>
                        )}
                        <tr>
                          <th className="bg-light text-start">Card Number</th>
                          <td className="text-end text-break">{paymentData.card_number || "—"}</td>
                        </tr>
                        <tr>
                          <th className="bg-light text-start" style={{ width: "35%" }}>Amount</th>
                          <td className="text-end">{paymentData.currency} ${Number(paymentData.amount).toFixed(2)}</td>
                        </tr>
                        <tr>
                          <th className="bg-light text-start">Name</th>
                          <td className="text-end">
                            {[paymentData.title ?? null, paymentData.first_name, paymentData.last_name].filter(Boolean).join(" ") || "—"}
                          </td>
                        </tr>
                        <tr>
                          <th className="bg-light text-start">Email Address</th>
                          <td className="text-end text-break">{paymentData.email || "—"}</td>
                        </tr>
                        {paymentData.phone && (
                          <tr>
                            <th className="bg-light text-start">Phone Number</th>
                            <td className="text-end text-break">{paymentData.phone}</td>
                          </tr>
                        )}
                        <tr>
                          <th className="bg-light text-start">Address</th>
                          <td className="text-end">
                            {[paymentData.address, paymentData.city, paymentData.zip, paymentData.country]
                              .filter(Boolean)
                              .join(", ") || "—"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <button onClick={() => router.push("/")} className="px-4 payment-success">
                    Back To Homepage
                  </button>
                </div>
              )}
              { !loading && view === "error" && (
                <div>
                  <h1 className="mb-3 fw-semibold payment-status-title">
                    Payment Failed
                  </h1>
                  <p className="mb-4">
                    Please click the button below to go back & try another card.
                  </p>
                  <button
                    onClick={() => router.push("/")}
                    className="px-4 payment-fail"
                  >
                    Go Back & Try Again
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
  );
}

function ShowLoading() {
  return (
    <div className="text-center">
      <div
        className="spinner-border text-primary"
        role="status"
        style={{ width: "3rem", height: "3rem" }}
      >
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
}

export default function FinalizePayment() {
  return (
    <Suspense fallback={<ShowLoading />}>
      <PaymentStatus />
    </Suspense>
  );
}
