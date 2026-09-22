import { expect, test } from '@playwright/test';

const agencyEmail = process.env.E2E_AGENCY_EMAIL ?? 'e2e-agency@example.test';
const agencyPassword = process.env.E2E_AGENCY_PASSWORD ?? 'E2E-Password!42';

test('agency login → search → reservation → operator redemption', async ({ page, context, browser }) => {
  await page.goto('/');

  await page.getByLabel('Correo electrónico').fill(agencyEmail);
  await page.getByLabel('Contraseña').fill(agencyPassword);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();

  await expect(page).toHaveURL(/\/agency$/);
  await expect(page.getByText(/E2E Galapagos Agency · comisión 20%/)).toBeVisible();

  await page.getByLabel('Destino').fill('Puerto Villamil');
  await page.getByLabel('Número de pasajeros').fill('2');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();

  await expect(page.getByText('E2E Ferry Isabela', { exact: true })).toBeVisible();
  await expect(page.getByText('10 cupos libres', { exact: true })).toBeVisible();
  await expect(page.getByText('Comisión: 20%', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: /Reservar \/ Bloquear/ }).click();

  const dialog = page.getByRole('dialog', { name: 'Confirmar reserva' });
  await expect(dialog).toBeVisible();
  await dialog.getByPlaceholder('Nombre completo del titular').fill('Ada Galapagos E2E');
  await dialog.getByPlaceholder('Pasaporte / Cédula').fill('E2E-001');
  await dialog.getByRole('button', { name: 'Confirmar reserva' }).click();

  await expect(dialog.getByRole('heading', { name: 'Reserva confirmada' })).toBeVisible();
  await expect(dialog.getByText('$80.00', { exact: true })).toBeVisible();
  await expect(dialog.getByText('$16.00', { exact: true })).toBeVisible();

  const voucherPagePromise = context.waitForEvent('page');
  await dialog.getByRole('link', { name: 'Abrir voucher' }).click();
  const voucherPage = await voucherPagePromise;
  await voucherPage.waitForLoadState('domcontentloaded');

  await expect(voucherPage.getByRole('heading', { name: 'Válido' })).toBeVisible();
  await expect(voucherPage.getByText('Ada Galapagos E2E', { exact: true })).toBeVisible();
  await expect(voucherPage.getByText('E2E Ferry One', { exact: true })).toBeVisible();
  await expect(voucherPage.getByText('E2E Santa Cruz → Isabela', { exact: true })).toBeVisible();
  await expect(voucherPage.getByText('E2E Galapagos Agency', { exact: true })).toBeVisible();

  const voucherToken = new URL(voucherPage.url()).pathname.split('/').filter(Boolean).at(-1);
  expect(voucherToken).toBeTruthy();

  const operatorContext = await browser.newContext();
  const operatorPage = await operatorContext.newPage();
  await operatorPage.goto('/');
  await operatorPage.getByLabel('Correo electrónico').fill(process.env.E2E_OPERATOR_EMAIL ?? 'e2e-operator@example.test');
  await operatorPage.getByLabel('Contraseña').fill(process.env.E2E_OPERATOR_PASSWORD ?? 'E2E-Operator-Password!42');
  await operatorPage.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(operatorPage).toHaveURL(/\/operator$/);

  await operatorPage.goto('/operator/redeem');
  await operatorPage.getByLabel('Token o contenido del QR').fill(voucherPage.url());
  await operatorPage.getByRole('button', { name: 'Verificar', exact: true }).click();
  await expect(operatorPage.getByText('Listo para redimir', { exact: true })).toBeVisible();
  await operatorPage.getByRole('button', { name: 'Confirmar redención', exact: true }).click();
  await expect(operatorPage.getByRole('status')).toHaveText('Voucher redimido correctamente.');
  await expect(operatorPage.getByText('Ya redimido', { exact: true })).toBeVisible();

  await operatorPage.getByLabel('Token o contenido del QR').fill(voucherPage.url());
  await operatorPage.getByRole('button', { name: 'Verificar', exact: true }).click();
  await expect(operatorPage.getByText('Ya redimido', { exact: true })).toBeVisible();
  await expect(operatorPage.getByText('No se puede redimir nuevamente este voucher.', { exact: true })).toBeVisible();
  await operatorContext.close();

  await dialog.getByRole('button', { name: 'Cerrar' }).click();
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page.getByText('8 cupos libres', { exact: true })).toBeVisible();
});
