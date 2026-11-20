import { useLocation } from "react-router-dom";
import { PaymentForm } from "../components/PaymentForm";

// Keyed by the query string so switching recipients starts with a fresh form.
export const SendMoney = () => {
  const { search } = useLocation();
  return <PaymentForm key={search} mode="send" />;
};
