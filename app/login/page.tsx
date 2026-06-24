import { Suspense } from "react";
import { LoginForm } from "./login-form";

function LoginSkeleton() {
  return (
    <div className="page-surface flex min-h-screen items-center justify-center" aria-busy="true">
      <div className="space-y-3 text-center">
        <div className="mx-auto h-8 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="mx-auto h-4 w-32 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}
