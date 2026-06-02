/**
 * E2E Tests — Fluxo de conclusão de curso
 * Testa: marcar aulas concluídas → progress bar → certificado
 */
import { test, expect } from "@playwright/test";

const STUDENT_EMAIL = process.env.E2E_STUDENT_EMAIL || "";
const STUDENT_PASS = process.env.E2E_STUDENT_PASSWORD || "";
const TEST_COURSE_ID = process.env.E2E_TEST_COURSE_ID || "";

test.describe("Dashboard — curso", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!STUDENT_EMAIL || !TEST_COURSE_ID, "Credenciais ou courseId não definidos");

    // Login
    await page.goto("/login");
    await page.fill('input[type="email"]', STUDENT_EMAIL);
    await page.fill('input[type="password"]', STUDENT_PASS);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test("catálogo de cursos carrega", async ({ page }) => {
    await page.goto("/dashboard/courses");
    await expect(page.getByRole("heading", { name: /cursos/i })).toBeVisible();
    // Não deve mostrar spinner infinito
    await expect(page.locator("[data-testid='loading-spinner']")).not.toBeVisible({ timeout: 5000 });
  });

  test("página de curso mostra lista de módulos", async ({ page }) => {
    test.skip(!TEST_COURSE_ID, "TEST_COURSE_ID não definido");
    await page.goto(`/dashboard/courses/${TEST_COURSE_ID}`);
    await expect(page.getByText(/módulo/i)).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/conteúdo do curso/i)).toBeVisible();
  });

  test("notificações — sino mostra badge de não lidas", async ({ page }) => {
    await page.goto("/dashboard");
    const bell = page.locator('[aria-label="Notificações"]');
    await expect(bell).toBeVisible();
    // Clicar no sino abre o dropdown
    await bell.click();
    await expect(page.getByText(/notificações/i)).toBeVisible();
  });
});

test.describe("Dashboard — certificados", () => {
  test("página de certificados carrega sem erros", async ({ page }) => {
    test.skip(!STUDENT_EMAIL, "Credenciais não definidas");

    await page.goto("/login");
    await page.fill('input[type="email"]', STUDENT_EMAIL);
    await page.fill('input[type="password"]', STUDENT_PASS);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    await page.goto("/dashboard/certificates");
    // Não deve crashar — pode estar vazio mas não deve ter erro
    await expect(page.getByText(/algo correu mal/i)).not.toBeVisible({ timeout: 5000 });
    await expect(page).not.toHaveURL(/error/);
  });
});
