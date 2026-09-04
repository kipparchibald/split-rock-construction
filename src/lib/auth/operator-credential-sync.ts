export type OperatorCredential = {
  name: string;
  email: string;
  password: string;
};

export type OperatorAuth = {
  $context: Promise<{
    internalAdapter: {
      findUserByEmail: (
        email: string,
        options?: { includeAccounts: boolean },
      ) => Promise<{
        user: { id: string; email: string };
        accounts: Array<{ id: string; providerId: string; password?: string | null }>;
      } | null>;
      updatePassword: (userId: string, passwordHash: string) => Promise<void>;
      linkAccount: (account: {
        userId: string;
        providerId: string;
        accountId: string;
        password: string;
      }) => Promise<unknown>;
    };
    password: { hash: (password: string) => Promise<string> };
  }>;
  api: {
    signUpEmail: (args: {
      body: { name: string; email: string; password: string };
    }) => Promise<unknown>;
  };
};

/**
 * Ensure an operator can sign in with email/password:
 * - new user → Better Auth sign-up (hashes password correctly)
 * - existing user → upsert credential account password via internal adapter
 *
 * Scoped to SPLIT_ROCK_OPERATORS entries only — never logs plaintext passwords.
 */
export async function syncOperatorCredential(
  op: OperatorCredential,
  authInstance: OperatorAuth,
): Promise<"created" | "updated"> {
  const ctx = await authInstance.$context;
  const existing = await ctx.internalAdapter.findUserByEmail(op.email, {
    includeAccounts: true,
  });

  if (!existing) {
    await authInstance.api.signUpEmail({
      body: {
        name: op.name,
        email: op.email,
        password: op.password,
      },
    });
    return "created";
  }

  const passwordHash = await ctx.password.hash(op.password);
  const credentialAccount = existing.accounts.find(
    (account) => account.providerId === "credential",
  );

  if (credentialAccount) {
    await ctx.internalAdapter.updatePassword(existing.user.id, passwordHash);
  } else {
    await ctx.internalAdapter.linkAccount({
      userId: existing.user.id,
      providerId: "credential",
      accountId: existing.user.id,
      password: passwordHash,
    });
  }

  return "updated";
}
