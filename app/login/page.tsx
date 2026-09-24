import type { Metadata } from "next";
import { BrandPanel } from "@/components/login/BrandPanel";
import { LoginForm } from "@/components/login/LoginForm";

export const metadata: Metadata = {
  title: "Iniciar sesión · OpenDayCare",
};

export default function LoginPage() {
  return (
    <div className="grid min-h-screen grid-cols-1 bg-[#FBF4EC] md:grid-cols-[1.05fr_1fr]">
      <BrandPanel />
      <div className="flex items-center justify-center px-7 py-12 sm:px-10 sm:py-10">
        <LoginForm />
      </div>
    </div>
  );
}
