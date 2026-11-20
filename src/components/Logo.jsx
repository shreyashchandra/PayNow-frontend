/* eslint-disable react/prop-types */
import { Link } from "react-router-dom";

export function Logo({ to = "/", className = "" }) {
  return (
    <Link to={to} className={`group inline-flex items-baseline gap-1.5 ${className}`}>
      <span className="font-serif text-[22px] font-semibold tracking-tight text-ink">PayNow</span>
      <span className="h-1.5 w-1.5 translate-y-[-2px] rounded-full bg-ledger transition-transform group-hover:scale-125" />
    </Link>
  );
}
