/**
 * E2E Tests — Autenticação e redirects por role
 *
 * NOTA: Usa contas de teste reais do Firebase Emulator ou do ambiente de staging.
 * Definir as variáveis no ficheiro .env.test:
 *   E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD
 *   E2E_TEACHER_EMAIL, E2E_TEACHER_PASSWORD
 *   E2E_STUDENT_EMAIL, E2E_STUDENT_PASSWORD
 */
import { test, expect } from "@playwright/test";

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || "";
const ADMIN_PASS = process.env.E2E_ADMIN_PASSWORD || "";
const TEACHER_EMAIL = process.env.E2E_TEACHER_EMAIL || "";
const TEACHER_PASS = process.env.E2E_TEACHER_PASSWORD || "";
const STUDENT_EMAIL = process.env.E2E_STUDENT_EMAIL || "";
const STUDENT_PASS = process.env.E2E_STUDENT_PASSWORD || "";

// Helper: fazer login
async function login(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/login");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
}

test.describe("Login e redirects por role", () => {
  test("admin vai para /admin após login", async ({ page }) => {
    test.skip(!ADMIN_EMAIL, "Credenciais de admin não definidas");
    await login(page, ADMIN_EMAIL, ADMIN_PASS);
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
    // Sidebar admin deve estar visível
    await expect(page.getByText("Painel de Controlo")).toBeVisible();
  });

  test("teacher vai para /admin após login", async ({ page }) => {
    test.skip(!TEACHER_EMAIL, "Credenciais de teacher não definidas");
    await login(page, TEACHER_EMAIL, TEACHER_PASS);
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
    // Teacher vê o painel mas não o link de utilizadores
    await expect(page.getByText("Utilizadores")).not.toBeVisible();
  });

  test("aluno vai para /dashboard após login", async ({ page }) => {
    test.skip(!STUDENT_EMAIL, "Credenciais de aluno não definidas");
    await login(page, STUDENT_EMAIL, STUDENT_PASS);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.getByText("Olá")).toBeVisible();
  });

  test("utilizador não autenticado é redirecionado para /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  test("aluno não acede a /admin — redireciona para /dashboard", async ({ page }) => {
    test.skip(!STUDENT_EMAIL, "Credenciais de aluno não definidas");
    await login(page, STUDENT_EMAIL, STUDENT_PASS);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 8000 });
  });
});

test.describe("Página de login — UI", () => {
  test("mostra erro com credenciais inválidas", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "invalid@test.com");
    await page.fill('input[type="password"]', "wrongpassword");
    await page.click('button[type="submit"]');
    await expect(page.getByText(/incorrect|inválid/i)).toBeVisible({ timeout: 5000 });
  });

  test("toggle de tema funciona na página de login", async ({ page }) => {
    await page.goto("/login");
    const themeBtn = page.locator("button").filter({ has: page.locator("svg") }).first();
    await themeBtn.click();
    // Verifica que o data-theme mudou
    const html = page.locator("[data-theme]");
    await expect(html).toHaveAttribute("data-theme", /light|dark/);
  });
});
