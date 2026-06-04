import { redirect } from "next/navigation";

// Inscription = même flow OTP que la connexion
export default function RegisterPage() {
  redirect("/login");
}
