import { describe, it } from "node:test";
import assert from "node:assert";

interface RouteGuardSimulationParams {
  user: { id: string; email: string } | null;
  profile: { is_profile_complete: boolean } | null;
  pathname: string;
}

function simulateRouteGuard({ user, profile, pathname }: RouteGuardSimulationParams): {
  redirectUrl: string | null;
  allowed: boolean;
} {
  const isAppRoute = pathname.startsWith("/app");
  const isCompleteProfileRoute = pathname === "/completar-cadastro";

  // 1. Unauthenticated user trying to access /app/* -> redirect to /login
  if (!user && isAppRoute) {
    return { redirectUrl: "/login", allowed: false };
  }

  // 2. Authenticated user flow on /app/* or /completar-cadastro
  if (user && (isAppRoute || isCompleteProfileRoute)) {
    const isComplete = profile?.is_profile_complete === true;

    // Incomplete profile trying to access /app/* -> redirect to /completar-cadastro
    if (!isComplete && isAppRoute) {
      return { redirectUrl: "/completar-cadastro", allowed: false };
    }

    // Complete profile trying to access /completar-cadastro -> redirect to /app
    if (isComplete && isCompleteProfileRoute) {
      return { redirectUrl: "/app", allowed: false };
    }
  }

  return { redirectUrl: null, allowed: true };
}

describe("Route Protection Middleware Guard Unit Tests", () => {
  const mockUser = { id: "user-123", email: "user@example.com" };

  it("Scenario A: unauthenticated user -> /app should redirect to /login", () => {
    const res = simulateRouteGuard({
      user: null,
      profile: null,
      pathname: "/app",
    });
    assert.strictEqual(res.redirectUrl, "/login");
    assert.strictEqual(res.allowed, false);
  });

  it("Scenario A.2: unauthenticated user -> /app/transacoes should redirect to /login", () => {
    const res = simulateRouteGuard({
      user: null,
      profile: null,
      pathname: "/app/transacoes",
    });
    assert.strictEqual(res.redirectUrl, "/login");
    assert.strictEqual(res.allowed, false);
  });

  it("Scenario B: authenticated user + incomplete profile -> /app should redirect to /completar-cadastro", () => {
    const res = simulateRouteGuard({
      user: mockUser,
      profile: { is_profile_complete: false },
      pathname: "/app",
    });
    assert.strictEqual(res.redirectUrl, "/completar-cadastro");
    assert.strictEqual(res.allowed, false);
  });

  it("Scenario B.2: authenticated user + incomplete profile -> /app/cartoes should redirect to /completar-cadastro", () => {
    const res = simulateRouteGuard({
      user: mockUser,
      profile: { is_profile_complete: false },
      pathname: "/app/cartoes",
    });
    assert.strictEqual(res.redirectUrl, "/completar-cadastro");
    assert.strictEqual(res.allowed, false);
  });

  it("Scenario C: authenticated user + incomplete profile -> /completar-cadastro should stay on page (no redirect loop)", () => {
    const res = simulateRouteGuard({
      user: mockUser,
      profile: { is_profile_complete: false },
      pathname: "/completar-cadastro",
    });
    assert.strictEqual(res.redirectUrl, null);
    assert.strictEqual(res.allowed, true);
  });

  it("Scenario D: authenticated user + complete profile -> /app should be allowed", () => {
    const res = simulateRouteGuard({
      user: mockUser,
      profile: { is_profile_complete: true },
      pathname: "/app",
    });
    assert.strictEqual(res.redirectUrl, null);
    assert.strictEqual(res.allowed, true);
  });

  it("Scenario E: authenticated user + complete profile -> /completar-cadastro should redirect to /app", () => {
    const res = simulateRouteGuard({
      user: mockUser,
      profile: { is_profile_complete: true },
      pathname: "/completar-cadastro",
    });
    assert.strictEqual(res.redirectUrl, "/app");
    assert.strictEqual(res.allowed, false);
  });

  it("Scenario F: public routes like /login, /register, /auth/callback should be allowed without interception", () => {
    const resLogin = simulateRouteGuard({
      user: null,
      profile: null,
      pathname: "/login",
    });
    assert.strictEqual(resLogin.redirectUrl, null);
    assert.strictEqual(resLogin.allowed, true);

    const resRegister = simulateRouteGuard({
      user: null,
      profile: null,
      pathname: "/register",
    });
    assert.strictEqual(resRegister.redirectUrl, null);
    assert.strictEqual(resRegister.allowed, true);

    const resCallback = simulateRouteGuard({
      user: null,
      profile: null,
      pathname: "/auth/callback",
    });
    assert.strictEqual(resCallback.redirectUrl, null);
    assert.strictEqual(resCallback.allowed, true);
  });
});
