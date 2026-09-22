"use client";

import { QRCodeSVG } from "qrcode.react";

export function VoucherQr({ token }: { token: string }) {
  const verificationUrl = typeof window === "undefined"
    ? ""
    : `${window.location.origin}/verify/${encodeURIComponent(token)}`;

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
      {verificationUrl ? <QRCodeSVG value={verificationUrl} size={176} includeMargin aria-label="QR de verificación del voucher" /> : <div className="h-[176px] w-[176px] animate-pulse rounded bg-slate-100" aria-hidden="true" />}
      <p className="text-center text-xs text-slate-500">Escanea para verificar este voucher</p>
    </div>
  );
}