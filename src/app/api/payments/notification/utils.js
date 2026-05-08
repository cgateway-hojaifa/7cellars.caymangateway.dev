import { base64Logo } from "@/constant/base64Logo"
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export function formatTransactionDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${day} ${now.toLocaleString("default", {
    month: "short",
  })} ${year} ${hours}:${minutes}:${seconds}`;
}

export async function generateContractPDF(data) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const marginX = 40;
  let cursorY = height - 40;

  const drawText = (
    text,
    x = marginX,
    y = cursorY,
    size = 11,
    fontType = font
  ) => {
    page.drawText(String(text), {
      x,
      y,
      size,
      font: fontType,
      color: rgb(0, 0, 0),
    });
    cursorY = y - 16;
  };

  const drawRightAlignedText = (text, y, size = 11, fontType = font) => {
    const textWidth = fontType.widthOfTextAtSize(text, size);
    const x = width - marginX - textWidth;
    page.drawText(text, {
      x,
      y,
      size,
      font: fontType,
      color: rgb(0, 0, 0),
    });
    cursorY = y - 16;
  };

  const drawParagraph = (text, widthLimit = 520, size = 10) => {
    const words = text.split(" ");
    let line = "";
    const lines = [];

    for (let word of words) {
      const testLine = line + word + " ";
      const testWidth = font.widthOfTextAtSize(testLine, size);
      if (testWidth > widthLimit) {
        lines.push(line.trim());
        line = "";
      }
      line += word + " ";
    }
    if (line) lines.push(line.trim());

    lines.forEach((l) => drawText(l, marginX, cursorY, size));
    cursorY -= 5;
  };

  // Header: Left aligned
  // Logo

  const logoBytes = Uint8Array.from(atob(base64Logo.split(",")[1]), (c) =>
    c.charCodeAt(0)
  );

  const logoImage = await pdfDoc.embedPng(logoBytes);
  const logoDims = logoImage.scale(0.25);
  page.drawImage(logoImage, {
    x: marginX,
    y: cursorY - logoDims.height + 10,
    width: logoDims.width,
    height: logoDims.height,
  });

  drawRightAlignedText("Card Authorization - Chelsea Flynn", cursorY, 14, bold);
  drawRightAlignedText("Coaching", cursorY, 14, bold);
  drawRightAlignedText("Postal Address:", (cursorY -= 5), 11, bold);
  drawRightAlignedText("PO box 712 KY1 1107", cursorY);

  cursorY -= 30;
  drawText(`${data.first_name} ${data.last_name}`);
  drawText(data.address);
  drawText(`${data.city},`);
  drawText(data.country);

  cursorY -= 20;
  drawText(
    "Card Authorization - Chelsea Flynn Coaching",
    marginX,
    cursorY,
    12,
    bold
  );

  // body text
  cursorY -= 10;
  drawParagraph(
    "The information provided will be kept confidential and stored securely within Cayman Gateway® encrypted software."
  );
  const currency = data.currency || "USD";
  const amountValue = Number(data.amount ?? 0).toFixed(2);
  const amountLabel = `${currency}$${amountValue}`;
  drawParagraph(
    `An initial ${amountLabel} transaction is authorized to be made immediately upon submission in order to validate the card for future payments.`
  );
  drawParagraph(
    "I authorize funds to be drawn prior for the forthcoming month's billing cycle on each new month using the card provided below:"
  );

  cursorY -= 10;
  page.drawText("Debit/Credit Card Number:", {
    x: marginX,
    y: cursorY,
    size: 11,
    font: bold,
    color: rgb(0, 0, 0),
  });
  page.drawText(data.card_number || "**** **** **** ****", {
    x: marginX + 145,
    y: cursorY,
    size: 11,
    font,
    color: rgb(0, 0, 0),
  });

  cursorY -= 20;

  page.drawText("CVC:", {
    x: marginX + 215,
    y: cursorY,
    size: 11,
    font: bold,
    color: rgb(0, 0, 0),
  });
  page.drawText("***", {
    x: marginX + 245,
    y: cursorY,
    size: 11,
    font,
    color: rgb(0, 0, 0),
  });

  cursorY -= 25;
  drawParagraph(
    "I hereby authorize Chelsea Flynn Coaching to debit my bank account using the debit/credit card details listed each month for the sole purpose of paying my Chelsea Flynn Coaching membership fees. I understand that this authorization will remain in effect until I modify or cancel it in writing by contacting chelseaflynncoaching@gmail.com."
  );

  cursorY -= 30;
  drawText(formatTransactionDate(), marginX, cursorY, 10);

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
