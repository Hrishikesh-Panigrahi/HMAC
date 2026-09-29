import { useId } from "react";
import "./Brand.css";

// HMAC mark: a fountain-pen nib (handwriting) crossed by a scan line (machine reading).
export const LogoMark = ({ size = 34 }) => {
  const maskId = `nib-${useId().replace(/:/g, "")}`;

  return (
    <svg className="logo-mark" width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <mask id={maskId}>
          <rect width="48" height="48" fill="#fff" />
          <circle cx="24" cy="21" r="3.2" fill="#000" />
          <path d="M24 24.5V40" stroke="#000" strokeWidth="1.9" strokeLinecap="round" />
          <path d="M15 12h18" stroke="#000" strokeWidth="1.7" />
        </mask>
      </defs>
      <path className="logo-mark__nib" d="M15 6h18v10c0 7-3.5 12.5-9 25-5.5-12.5-9-18-9-25z" mask={`url(#${maskId})`} />
      <g className="logo-mark__scan">
        <path className="logo-mark__glow" d="M6 30h36" />
        <path className="logo-mark__line" d="M6 30h36" />
      </g>
    </svg>
  );
};

const Brand = ({ compact = false }) => (
  <span className={`brand ${compact ? "brand--compact" : ""}`}>
    <LogoMark size={compact ? 30 : 38} />
    <span className="brand__name">HMAC</span>
  </span>
);

export default Brand;
