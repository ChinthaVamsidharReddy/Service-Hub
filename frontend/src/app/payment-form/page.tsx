import PaymentForm from "../../components/PaymentForm";
export default function Page() {
  return <PaymentForm bookingId={1003} amount={25} onPaymentComplete={function (): void {
      throw new Error("Function not implemented.");
  } } />;
}

