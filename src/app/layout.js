import localFont from "next/font/local";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css"; 

const ivyMode = localFont({
  src: "../fonts/IvyMode_SemiBold.otf",
  variable: "--font-ivy-mode",
  weight: "600",
});

const celebes = localFont({
  src: "../fonts/Celebes-SemiBold.ttf", 
  weight: "600",
  variable: "--font-celebes-mode",
});

export const metadata = {
  title: "Pay Now | Cayman Gateway Ltd",
  description: "Easy & secure payment with Cayman Gateway",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${ivyMode.variable} ${celebes.variable} `}>
        {children}
      </body>
    </html>
  );
}
