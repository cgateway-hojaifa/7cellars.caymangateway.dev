"use client";
import { allCountry } from "@/constant/allCountry";
import React, { useState, useRef } from "react";
import axios from "axios";
import Image from "next/image";
import HCaptcha from "@hcaptcha/react-hcaptcha";

const HCAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;

const MembershipForm = () => {
  const hcaptchaRef = useRef(null);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [recaptchaToken, setRecaptchaToken] = useState("");
  const [recaptchaError, setRecaptchaError] = useState("");

  const country = process.env.NEXT_PUBLIC_HIDDEN_COUNTRY;
  const defaultCurrency = process.env.NEXT_PUBLIC_HIDDEN_CURRENCY || "KYD";

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    address: "",
    city: "",
    zip: "",
    country: country || "",
    phone: "",
    amount: "",
    invoice: "",
    currency: defaultCurrency,
  });

  const displayAmount = formData.amount ? parseFloat(formData.amount) : 0;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "currencyToggle") {
      setFormData((prev) => ({
        ...prev,
        currency: checked ? "KYD" : "USD",
      }));
      if (errors.currency) setErrors((prev) => ({ ...prev, currency: "" }));
      return;
    }

    let newValue = value;
    if (name === "amount") {
      newValue = value
        .replace(/[^\d.]/g, "")
        .replace(/^(\d*\.)(.*)/, (_, a, b) => a + b.replace(/\./g, ""));
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : newValue,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleHCaptchaVerify = (token) => {
    const value = token || "";
    setRecaptchaToken(value);
    if (value) setRecaptchaError("");
  };

  const handleHCaptchaExpire = () => {
    setRecaptchaToken("");
  };

  const validateForm = () => {
    const newErrors = {};
    let formIsValid = true;

    if (!formData.firstName.trim()) {
      newErrors.firstName = "The first name field is required.";
      formIsValid = false;
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "The last name field is required.";
      formIsValid = false;
    }
    if (!formData.email.trim()) {
      newErrors.email = "The email address field is required.";
      formIsValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
      formIsValid = false;
    }
    if (!formData.address.trim()) {
      newErrors.address = "The address field is required.";
      formIsValid = false;
    }
    if (!formData.city.trim()) {
      newErrors.city = "The city field is required.";
      formIsValid = false;
    }
    if (!formData.zip.trim()) {
      newErrors.zip = "The zip field is required.";
      formIsValid = false;
    }
    if (!formData.country || !formData.country.trim()) {
      newErrors.country = "The country field is required.";
      formIsValid = false;
    }
    if (!formData.invoice.trim()) {
      newErrors.invoice = "The invoice number field is required.";
      formIsValid = false;
    }
    const amountNum = parseFloat(formData.amount);
    if (!formData.amount.trim()) {
      newErrors.amount = "The amount field is required.";
      formIsValid = false;
    } else if (isNaN(amountNum) || amountNum <= 0) {
      newErrors.amount = "Please enter a valid amount greater than 0.";
      formIsValid = false;
    }

    setErrors(newErrors);
    return formIsValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (HCAPTCHA_SITE_KEY && !recaptchaToken) {
      setRecaptchaError("Please verify that you are not a robot.");
      return;
    }
    if (!validateForm()) return;

    setIsLoading(true);
    setPaymentError("");

    try {
      const amountNum = parseFloat(formData.amount);
      const apiPayload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        address: formData.address,
        city: formData.city,
        zip: formData.zip,
        phone: formData.phone,
        country: formData.country,
        currency: formData.currency,
        amount: isNaN(amountNum) ? 0 : amountNum,
        invoice: formData.invoice,
        recaptchaToken,
      };

      const { data } = await axios.post("/api/payments/create-url", apiPayload);

      if (!data.formURL) {
        setPaymentError("Payment failed. Please try again.");
        setIsLoading(false);
        return;
      }

      window.location.href = data.formURL;
    } catch (error) {
      hcaptchaRef.current?.resetCaptcha();
      setRecaptchaToken("");
      setPaymentError(
        error.response?.data?.message === "Security Error"
          ? "Payment failed due to security issues."
          : "Payment failed. Please try again."
      );
      setIsLoading(false);
    }
  };

  return (
    <>
      <form className="form-area" noValidate onSubmit={handleSubmit}>
        <h1 className="text-center form-title">Payment to 7Cellars</h1>
        <h2 className="step-title">Your Information</h2>
        <div className="row">
          <div className="mb-4 col-md-6">
            <label htmlFor="firstName" className="form-label">
              First Name <span className="required-asterisk">*</span>
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              placeholder="Please enter your first name"
              className={`form-control ${errors.firstName ? "is-invalid" : ""}`}
            />
            {errors.firstName && (
              <p className="invalid-feedback">{errors.firstName}</p>
            )}
          </div>
          <div className="mb-4 col-md-6">
            <label htmlFor="lastName" className="form-label">
              Last Name <span className="required-asterisk">*</span>
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              placeholder="Please enter your last name"
              className={`form-control ${errors.lastName ? "is-invalid" : ""}`}
            />
            {errors.lastName && (
              <p className="invalid-feedback">{errors.lastName}</p>
            )}
          </div>
          <div className="mb-4 col-md-6">
            <label htmlFor="email" className="form-label">
              Email Address <span className="required-asterisk">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Please enter email address correctly"
              className={`form-control ${errors.email ? "is-invalid" : ""}`}
            />
            {errors.email && (
              <p className="invalid-feedback">{errors.email}</p>
            )}
          </div>
          <div className="mb-4 col-md-6">
            <label htmlFor="address" className="form-label">
              Address (inc. PO Box) <span className="required-asterisk">*</span>
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Please enter your address"
              className={`form-control ${errors.address ? "is-invalid" : ""}`}
            />
            {errors.address && (
              <p className="invalid-feedback">{errors.address}</p>
            )}
          </div>
          <div className="mb-4 col-md-6">
            <label htmlFor="city" className="form-label">
              City <span className="required-asterisk">*</span>
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              placeholder="Please enter city"
              className={`form-control ${errors.city ? "is-invalid" : ""}`}
            />
            {errors.city && <p className="invalid-feedback">{errors.city}</p>}
          </div>
          <div className="mb-4 col-md-6">
            <label htmlFor="zip" className="form-label">
              Zip <span className="required-asterisk">*</span>
            </label>
            <input
              type="text"
              id="zip"
              name="zip"
              value={formData.zip}
              onChange={handleInputChange}
              placeholder="Please enter zip code"
              className={`form-control ${errors.zip ? "is-invalid" : ""}`}
            />
            {errors.zip && <p className="invalid-feedback">{errors.zip}</p>}
          </div>
          <div className="mb-4 col-md-6">
            <label htmlFor="country" className="form-label">
              Country <span className="required-asterisk">*</span>
            </label>
            <select
              id="country"
              name="country"
              value={formData.country}
              onChange={handleInputChange}
              className={`form-control ${errors.country ? "is-invalid" : ""}`}
            >
              {allCountry.map((c) => (
                <option key={c.value || "empty"} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            {errors.country && (
              <p className="invalid-feedback">{errors.country}</p>
            )}
          </div>
          <div className="mb-4 col-md-6">
            <label htmlFor="phone" className="form-label">
              Phone
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="Please enter your phone number"
              className={`form-control ${errors.phone ? "is-invalid" : ""}`}
            />
            {errors.phone && (
              <p className="invalid-feedback">{errors.phone}</p>
            )}
          </div>
        </div>

        <h2 className="step-title">Payment Information</h2>
        <div className="row">
          <div className="mb-4 col-md-4 currency-switch">
            <label className="form-label mb-1">Select Currency</label>
            <div style={{ marginTop: "10px" }} className="form-check form-switch d-flex align-items-center">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                id="currencyToggle"
                name="currencyToggle"
                checked={formData.currency === "KYD"}
                onChange={handleInputChange}
                style={{ width: "3em", height: "1.5em", cursor: "pointer" }}
              />
              <span className="ms-2">{formData.currency}</span>
            </div>
          </div>
          <div className="mb-4 col-md-4">
            <label htmlFor="amount" className="form-label">
              Amount <span className="required-asterisk">*</span>
            </label>
            <input
              type="text"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              placeholder="Enter amount"
              className={`form-control ${errors.amount ? "is-invalid" : ""}`}
              inputMode="decimal"
            />
            {errors.amount && (
              <p className="invalid-feedback">{errors.amount}</p>
            )}
          </div>
          <div className="mb-4 col-md-4">
            <label htmlFor="invoice" className="form-label">
              Invoice Number <span className="required-asterisk">*</span>
            </label>
            <input
              type="text"
              id="invoice"
              name="invoice"
              value={formData.invoice}
              onChange={handleInputChange}
              placeholder="Enter invoice number"
              className={`form-control ${errors.invoice ? "is-invalid" : ""}`}
            />
            {errors.invoice && (
              <p className="invalid-feedback">{errors.invoice}</p>
            )}
          </div>

          
          <div className="d-flex mb-2 justify-content-center">
            <div className="mt-1 mb-4">
              {HCAPTCHA_SITE_KEY && (
                <HCaptcha
                  sitekey={HCAPTCHA_SITE_KEY}
                  onVerify={handleHCaptchaVerify}
                  onExpire={handleHCaptchaExpire}
                  ref={hcaptchaRef}
                />
              )}
              {recaptchaError && (
                <p className="invalid-feedback text-center">{recaptchaError}</p>
              )}
            </div>
          </div>
        </div>

        <div className="d-grid">
          <button
            type="submit"
            disabled={isLoading}
            className="complete-order"
          >
            {isLoading ? (
              <div className="spinner-border spinner spinner-border-md"></div>
            ) : (
              `${formData.currency} $${displayAmount.toFixed(2)}`
            )}
          </button>
        </div>

        {paymentError && (
          <div className="invalid-feedback payment text-center mt-4 mb-2">
            {paymentError}
          </div>
        )}

        <div className="mb-3 mt-3 text-center logos row justify-content-center align-items-center">
          <div className="col-auto">
            <Image className="protected-image" alt="PCI DDS" src="/pci.png" width={100} height={50} />
          </div>
          <div className="col-auto">
            <Image className="protected-image" alt="PCI DDS" src="/3d.png" width={100} height={50} />
          </div>
          <div className="col-auto">
            <Image className="protected-image" alt="PCI DDS" src="/ssl.png" width={100} height={50} />
          </div>
        </div>

        <input type="hidden" name="country" value={formData.country} />
        <input type="hidden" name="amount" value={formData.amount} />
        <input type="hidden" name="currency" value={formData.currency} />
      </form>
    </>
  );
};

export default MembershipForm;