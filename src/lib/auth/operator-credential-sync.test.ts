import { describe, expect, it } from "vitest";
import { betterAuth } from "better-auth";
import { syncOperatorCredential } from "./operator-credential-sync";
import { DEMO_OPERATORS } from "@/lib/demo-credentials";

function createTestAuth() {
  return betterAuth({
    baseURL: "http://localhost:8080",
    secret: "test-secret-that-is-long-enough-for-validation-12345",
    emailAndPassword: { enabled: true },
    rateLimit: { enabled: false },
    advanced: { cookies: {} },
  });
}

describe("syncOperatorCredential", () => {
  it("creates a new operator via sign-up", async () => {
    const auth = createTestAuth();
    const op = {
      name: DEMO_OPERATORS.kipp.name,
      email: "seed-new-kipp@splitrockconst.com",
      password: DEMO_OPERATORS.kipp.password,
    };

    const result = await syncOperatorCredential(op, auth);
    expect(result).toBe("created");

    const signIn = await auth.api.signInEmail({
      body: { email: op.email, password: op.password },
    });
    expect(signIn.user.email).toBe(op.email.toLowerCase());
  });

  it("updates credential password for an existing OAuth-only operator", async () => {
    const auth = createTestAuth();
    const ctx = await auth.$context;
    const email = "seed-existing-kipp@splitrockconst.com";
    const targetPassword = DEMO_OPERATORS.kipp.password;

    const user = await ctx.internalAdapter.createUser({
      email,
      name: DEMO_OPERATORS.kipp.name,
      emailVerified: true,
    });
    await ctx.internalAdapter.linkAccount({
      userId: user.id,
      providerId: "google",
      accountId: "google-oauth-subject",
    });

    await expect(
      auth.api.signInEmail({
        body: { email, password: targetPassword },
      }),
    ).rejects.toThrow();

    const result = await syncOperatorCredential(
      {
        name: DEMO_OPERATORS.kipp.name,
        email,
        password: targetPassword,
      },
      auth,
    );
    expect(result).toBe("updated");

    const signIn = await auth.api.signInEmail({
      body: { email, password: targetPassword },
    });
    expect(signIn.user.email).toBe(email.toLowerCase());
  });

  it("re-hashes credential password when operator already has a credential account", async () => {
    const auth = createTestAuth();
    const email = "seed-credential-kipp@splitrockconst.com";
    const oldPassword = "Old-SplitRock-Kipp-2025!";
    const newPassword = DEMO_OPERATORS.kipp.password;

    await auth.api.signUpEmail({
      body: {
        name: DEMO_OPERATORS.kipp.name,
        email,
        password: oldPassword,
      },
    });

    await expect(
      auth.api.signInEmail({
        body: { email, password: newPassword },
      }),
    ).rejects.toThrow();

    const result = await syncOperatorCredential(
      {
        name: DEMO_OPERATORS.kipp.name,
        email,
        password: newPassword,
      },
      auth,
    );
    expect(result).toBe("updated");

    const signIn = await auth.api.signInEmail({
      body: { email, password: newPassword },
    });
    expect(signIn.user.email).toBe(email.toLowerCase());
  });
});
