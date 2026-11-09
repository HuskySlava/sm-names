import { expect, test, type Page } from '@playwright/test';

/** Mobile-first check: nothing sticks out sideways. */
async function expectNoSideScroll(page: Page) {
  const fits = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth + 1,
  );
  expect(fits).toBe(true);
}

async function startGame(
  page: Page,
  gender: 'boy' | 'girl' | 'any',
  difficulty = 'normal',
  community: 'jewish' | 'arab' | 'any' = 'any',
) {
  await page.getByTestId('mode-quick').click();
  await page.getByTestId(`gender-${gender}`).click();
  // Start stays disabled until a community is chosen too
  await expect(page.getByTestId('start')).toBeDisabled();
  await page.getByTestId(`community-${community}`).click();
  await page.getByTestId(`difficulty-${difficulty}`).click();
  await expectNoSideScroll(page);
  await page.getByTestId('start').click();
}

async function playToWinner(page: Page) {
  for (let step = 1; step <= 10; step++) {
    await expect(page.getByTestId('step')).toHaveAttribute('data-step', String(step));
    const cards = page.getByTestId('name-card');
    await expect(cards).toHaveCount(3);
    if (step === 1) await expectNoSideScroll(page);
    await cards.nth(step % 3).click();
  }
  await expect(page.getByTestId('winner-name')).toBeVisible();
}

test('Hebrew by default: right-to-left, full game, restart', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('html')).toHaveAttribute('lang', 'he');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('מוצאים את השם הנכון');
  await expectNoSideScroll(page);

  await startGame(page, 'boy', 'normal', 'jewish');
  await expect(page.getByTestId('name-card').first()).toHaveText(/[֐-׿]/);
  await playToWinner(page);
  await expect(page.getByTestId('history').locator('li')).toHaveCount(10);
  await expectNoSideScroll(page);

  await page.getByTestId('restart').click();
  await expect(page.getByTestId('step')).toHaveAttribute('data-step', '1');
});

test('English: UI text and names switch, left-to-right, and it is remembered', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('lang-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Find the right name');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');

  await startGame(page, 'girl', 'normal', 'arab');
  await expect(page.getByTestId('name-card').first()).toHaveText(/[A-Za-z]/);
  await playToWinner(page);
  await expect(page.getByTestId('winner-name')).toHaveText(/[A-Za-z]/);
});

test('when time runs out, the same step shows 3 new names', async ({ page }) => {
  await page.goto('/');
  await startGame(page, 'any', 'hard');
  const cards = page.getByTestId('name-card');
  await expect(cards).toHaveCount(3);
  const before = await cards.locator('bdi').allTextContents();

  await expect(page.getByText('נגמר הזמן! הנה שמות חדשים.')).toBeVisible({ timeout: 6000 });
  await expect(cards).toHaveCount(3);
  const after = await cards.locator('bdi').allTextContents();
  expect(after.some((n) => before.includes(n))).toBe(false);
  await expect(page.getByTestId('step')).toHaveAttribute('data-step', '1');
});

test('change gender goes back to the setup with the previous choices', async ({ page }) => {
  await page.goto('/');
  await startGame(page, 'boy', 'easy', 'arab');
  await playToWinner(page);
  await page.getByTestId('change-gender').click();
  await expect(page).toHaveURL(/#\/quick$/);
  await expect(page.getByTestId('difficulty-easy')).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByTestId('gender-boy')).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByTestId('community-arab')).toHaveAttribute('aria-checked', 'true');
});

test('theme follows the system until toggled, and the choice is remembered', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  const html = page.locator('html');
  await expect(html).not.toHaveAttribute('data-theme', /.*/);
  const bg = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await expect.poll(bg).toBe('rgb(20, 19, 18)');

  await page.getByTestId('theme-toggle').click();
  await expect(html).toHaveAttribute('data-theme', 'light');
  await expect.poll(bg).toBe('rgb(246, 245, 243)');

  await page.reload();
  await expect(html).toHaveAttribute('data-theme', 'light');
});

test('skip shows 3 new names on the same step, like when time runs out', async ({ page }) => {
  await page.goto('/');
  await startGame(page, 'any', 'easy');
  await page.getByTestId('name-card').first().click();
  await expect(page.getByTestId('step')).toHaveAttribute('data-step', '2');
  const cards = page.getByTestId('name-card');
  await expect(cards).toHaveCount(3);
  const before = await cards.locator('bdi').allTextContents();

  await expect(page.getByTestId('skip')).toHaveText('דילוג');
  await page.getByTestId('skip').click();
  await expect(cards).toHaveCount(3);
  const after = await cards.locator('bdi').allTextContents();
  // all 3 are new, including the carried-over name
  expect(after.some((n) => before.includes(n))).toBe(false);
  await expect(page.getByTestId('step')).toHaveAttribute('data-step', '2');
  await expect(page.getByText('נגמר הזמן! הנה שמות חדשים.')).toHaveCount(0);
});
