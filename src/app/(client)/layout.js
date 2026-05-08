"use client"
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import ProtectedPassword from "../protected-password";

const Layout = ({ children }) => {
  const isPasswordProtected = process.env.NEXT_PUBLIC_PROTECTED_PASSWORD;
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [hasCheckedStorage, setHasCheckedStorage] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isPasswordProtected !== "true") {
      setHasCheckedStorage(true);
      return;
    }
    const checkPasswordVerification = () => {
      const verified = sessionStorage.getItem("password_verified");
      if (verified === "true") {
        setIsPasswordVerified(true);
      }
    };
    checkPasswordVerification();
    setHasCheckedStorage(true);

    const handlePasswordVerified = () => {
      checkPasswordVerification();
    };
    window.addEventListener("passwordVerified", handlePasswordVerified);
    return () => {
      window.removeEventListener("passwordVerified", handlePasswordVerified);
    };
  }, [isPasswordProtected]);

  return (
    <>
      <div
        className="main-area"
      >
        <div className="header">
          <div className="container mt-3 mb-3">
            <div className="text-center">
              <Link href="/">
                <Image
                  width={110}
                  height={110}
                  className="logo"
                  src="/logo.png"
                  alt="The 7 Cellars Logo"
                />
              </Link>
            </div>
          </div>
        </div>

        <div className="container mx-auto">
          <div className="row justify-content-center" style={{ minHeight: "calc(100vh - 204.78px)" }}>
            {isPasswordProtected === "true" && !hasCheckedStorage ? (
              <div className="col-md-10" aria-hidden="true" />
            ) : isPasswordProtected === "true" && !isPasswordVerified ? (
              <ProtectedPassword />
            ) : (
              <div className="col-md-10">{children}</div>
            )}
          </div>
        </div>

        <div className="footer">
          <div className="container">
            <div className="row m-0 justify-content-between">
                <div className="col-md-6 pt-3 pb-md-3">
                  <p className="footer__copy-right-text">
                    © {new Date().getFullYear()} 7Cellars. All Rights Reserved.
                  </p>
                </div>
                <div className="col-md-6 pb-3 pt-md-3">
                  <p className="footer__powered-text">
                    Powered By{" "}
                    <a
                      href="https://www.caymangateway.com"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Cayman Gateway Ltd
                    </a>
                  </p>
                </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Layout;
