"use client";

import { Command } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import {
  loginApi,
  registerOwnerApi,
  registerUserApi,
} from "@/features/auth/auth-api";
import { setCredentials } from "@/features/auth/auth-slice";
import { useAppDispatch } from "@/store/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDashboardRoute } from "@/lib/auth-routes";
import { ROUTES } from "@/lib/routes";

type AuthFormProps = {
  mode: "login" | "register";
  registerType?: RegisterType;
};

type RegisterType = "user" | "owner";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}

export function AuthForm({
  mode,
  registerType: initialRegisterType = "user",
}: AuthFormProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [registerType, setRegisterType] =
    useState<RegisterType>(initialRegisterType);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLogin = mode === "login";
  const isOwnerRegistration = registerType === "owner";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    setIsSubmitting(true);

    try {
      if (isLogin) {
        const session = await loginApi({ email, password });
        dispatch(setCredentials(session));

        toast.success("Login successful", {
          description: "Welcome back to Book My Venue.",
        });

        router.push(getDashboardRoute(session.user.role));

        return;
      }

      const fullName = String(formData.get("fullName") ?? "");
      const phone = String(formData.get("phone") ?? "");

      if (isOwnerRegistration) {
        await registerOwnerApi({
          fullName,
          email,
          phone,
          password,
          businessName: String(formData.get("businessName") ?? ""),
          city: String(formData.get("city") ?? ""),
        });
      } else {
        await registerUserApi({
          fullName,
          email,
          phone,
          password,
        });
      }

      toast.success("Account created", {
        description: isOwnerRegistration
          ? "Your venue owner registration was submitted."
          : "Your user account was created.",
      });

      router.push(ROUTES.auth.login);
    } catch (error) {
      toast.error(isLogin ? "Login failed" : "Registration failed", {
        description: getErrorMessage(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="bg-background flex min-h-screen p-4">
      <div className="border-border grid min-h-[calc(100vh-2rem)] w-full overflow-hidden rounded-xl border md:grid-cols-2">
        <section className="bg-muted relative hidden p-8 md:block">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Command className="size-4" />
            Book My Venue
          </div>
          <blockquote className="absolute bottom-8 left-8 max-w-xl text-sm leading-6">
            “Find the right venue faster, manage bookings simply, and keep every
            event moving without the chaos.”
          </blockquote>
        </section>

        <section className="relative flex items-center justify-center p-6">
          <div className="absolute top-8 right-8 text-sm font-medium">
            {isLogin ? (
              <Link href={ROUTES.auth.register}>Register</Link>
            ) : (
              <Link href={ROUTES.auth.login}>Login</Link>
            )}
          </div>

          <div className="w-full max-w-sm">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">
                {isLogin
                  ? "Login to your account"
                  : isOwnerRegistration
                    ? "Register your venue"
                    : "Create an account"}
              </h1>
              <p className="text-muted-foreground mt-2 text-sm">
                {isLogin
                  ? "Enter your email below to login"
                  : "Enter your details below to create your account"}
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {!isLogin ? (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    placeholder="John Doe"
                    required
                  />
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                />
              </div>

              {!isLogin ? (
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    required
                  />
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                />
              </div>

              {isOwnerRegistration ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business name</Label>
                    <Input
                      id="businessName"
                      name="businessName"
                      placeholder="Grand Palace Venue"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" name="city" placeholder="Mumbai" required />
                  </div>
                </>
              ) : null}

              <Button className="w-full" type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Please wait..."
                  : isLogin
                    ? "Login with Email"
                    : isOwnerRegistration
                      ? "Register as Owner"
                      : "Sign Up with Email"}
              </Button>
            </form>

            {!isLogin ? (
              <Button
                className="mt-4 w-full"
                variant="outline"
                type="button"
                onClick={() => {
                  const nextRegisterType = isOwnerRegistration
                    ? "user"
                    : "owner";

                  setRegisterType(nextRegisterType);
                  router.push(
                    nextRegisterType === "owner"
                      ? ROUTES.auth.registerOwner
                      : ROUTES.auth.registerUser,
                  );
                }}
              >
                {isOwnerRegistration
                  ? "Register as a user instead"
                  : "Are you a venue owner?"}
              </Button>
            ) : null}

            <p className="text-muted-foreground mt-6 text-center text-sm">
              {isLogin ? "Don’t have an account?" : "Already have an account?"}{" "}
              <Link
                href={isLogin ? ROUTES.auth.register : ROUTES.auth.login}
                className="text-foreground underline underline-offset-4"
              >
                {isLogin ? "Register" : "Login"}
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
