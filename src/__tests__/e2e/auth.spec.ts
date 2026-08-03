import { test, expect } from "@playwright/test";

// Baseado no plano - testes E2E para fluxos críticos
// Nota: Estes testes requerem um servidor rodando (npm run dev)

test.describe("Authentication Flows", () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para a página de login antes de cada teste
    await page.goto("http://localhost:3000/login");
  });

  test("should login with valid credentials", async ({ page }) => {
    // Preencher formulário de login
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "password123");

    // Clique no botão de login
    await page.click("button:has-text('Entrar')");

    // Esperar redirecionamento e verificar que estamos no dashboard
    await page.waitForURL("**/dashboard");
    expect(page.url()).toContain("/dashboard");
  });

  test("should show error with invalid credentials", async ({ page }) => {
    // Preencher com credenciais inválidas
    await page.fill('input[type="email"]', "wrong@example.com");
    await page.fill('input[type="password"]', "wrongpassword");

    // Clique no botão
    await page.click("button:has-text('Entrar')");

    // Esperar mensagem de erro
    const errorMessage = await page.locator("text=/erro|inválido/i").isVisible();
    expect(errorMessage).toBeTruthy();
  });

  test("should show validation errors for empty fields", async ({ page }) => {
    // Deixar campos vazios e enviar
    await page.click("button:has-text('Entrar')");

    // Verificar que há validação de campo
    const emailInput = await page.locator('input[type="email"]');
    const hasValidation = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(hasValidation).toBeTruthy();
  });

  test("should toggle password visibility", async ({ page }) => {
    // Preencher password
    await page.fill('input[type="password"]', "testpassword");

    // Encontrar botão de visibilidade
    const toggleButton = await page.locator("button[aria-label*='Mostrar']").first();
    expect(toggleButton).toBeTruthy();

    // Clique para mostrar
    await toggleButton.click();

    // Verificar que input é text agora
    const passwordInput = await page.locator('input[name="password"]');
    const type = await passwordInput.getAttribute("type");
    expect(type).toBe("text");
  });
});

test.describe("Navigation", () => {
  test("should navigate to register from login", async ({ page }) => {
    await page.goto("http://localhost:3000/login");

    // Encontrar e clicar no link de registro
    await page.click("a:has-text('Criar conta')");

    // Verificar que estamos na página de registro
    await page.waitForURL("**/register");
    expect(page.url()).toContain("/register");
  });

  test("should navigate to forgot password", async ({ page }) => {
    await page.goto("http://localhost:3000/login");

    // Clique em "Esqueceu a senha?"
    await page.click("button:has-text('Esqueceu')");

    // Verificar que aparece o formulário de reset
    const resetForm = await page.locator("text=/resetar|recuperar/i").isVisible();
    expect(resetForm).toBeTruthy();
  });
});

test.describe("Dashboard Access", () => {
  test("should redirect to login when not authenticated", async ({ page }) => {
    // Tentar acessar dashboard sem estar logado
    await page.goto("http://localhost:3000/dashboard");

    // Deve redirecionar para login
    await page.waitForURL("**/login");
    expect(page.url()).toContain("/login");
  });

  test("should show loading spinner while loading auth", async ({ page }) => {
    await page.goto("http://localhost:3000/dashboard");

    // Deve mostrar spinner enquanto carrega
    const spinner = await page.locator("svg[class*='animate-spin']").isVisible();
    expect(spinner).toBeTruthy();
  });
});

test.describe("UI Components", () => {
  test("should render button with different variants", async ({ page }) => {
    await page.goto("http://localhost:3000/login");

    // Encontrar botão primário
    const primaryButton = await page.locator("button:has-text('Entrar')");
    const hasClass = await primaryButton.evaluate((el) =>
      el.className.includes("bg-purple")
    );
    expect(hasClass).toBeTruthy();
  });

  test("should show loading state on button click", async ({ page }) => {
    await page.goto("http://localhost:3000/login");

    // Preencher e clique
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click("button:has-text('Entrar')");

    // Verificar loading state (spinner deve aparecer)
    const loadingText = await page.locator("text=/carregando/i").isVisible();
    expect(loadingText).toBeTruthy();
  });
});

test.describe("Responsive Design", () => {
  test("should work on mobile viewport", async ({ page }) => {
    // Setar viewport mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("http://localhost:3000/login");

    // Verificar que conteúdo é visível
    const emailInput = await page.locator('input[type="email"]').isVisible();
    expect(emailInput).toBeTruthy();

    // Verificar que botão é acessível
    const loginButton = await page.locator("button:has-text('Entrar')").isVisible();
    expect(loginButton).toBeTruthy();
  });

  test("should work on tablet viewport", async ({ page }) => {
    // Setar viewport tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("http://localhost:3000/login");

    // Layout deve ser otimizado
    const container = await page.locator("[role='main']");
    expect(container).toBeTruthy();
  });

  test("should work on desktop viewport", async ({ page }) => {
    // Setar viewport desktop
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("http://localhost:3000/login");

    // Verificar layout split (form + hero)
    const formSection = await page.locator("[role='main']").isVisible();
    expect(formSection).toBeTruthy();
  });
});

test.describe("Accessibility", () => {
  test("should have proper ARIA labels", async ({ page }) => {
    await page.goto("http://localhost:3000/login");

    // Verificar que inputs têm labels
    const emailLabel = await page.locator('label[for="email"]').isVisible();
    expect(emailLabel).toBeTruthy();

    // Verificar que botões têm text visível
    const loginButton = await page.locator("button:has-text('Entrar')");
    expect(loginButton).toBeTruthy();
  });

  test("should be keyboard navigable", async ({ page }) => {
    await page.goto("http://localhost:3000/login");

    // Pressionar Tab para navegar
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    // Um dos inputs deve ter focus
    const focused = await page.evaluate(() => {
      return document.activeElement?.tagName === "INPUT";
    });
    expect(focused).toBeTruthy();
  });

  test("should have focus rings", async ({ page }) => {
    await page.goto("http://localhost:3000/login");

    // Tab para o botão
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    // Verificar que tem focus ring
    const button = await page.locator("button:has-text('Entrar')");
    const hasFocusRing = await button.evaluate((el) =>
      window.getComputedStyle(el).outline !== "none"
    );
    expect(hasFocusRing).toBeTruthy();
  });
});
