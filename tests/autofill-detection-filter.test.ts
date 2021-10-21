/* eslint-disable sonarjs/no-duplicate-string */
import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { expect, test } from '@playwright/test'
import { BrowserContext, chromium, Frame, Page } from 'playwright'

// Mark the tests as slow
test.slow()

/** Opens a browser with the extension loaded. */
const createContext = async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'chromium-'))
  // eslint-disable-next-line unicorn/prefer-module
  const extension: string = path.join(__dirname, '../extension')
  return chromium.launchPersistentContext(tmp, {
    headless: false,
    args: [
      `--disable-extensions-except=${extension}`,
      `--load-extension=${extension}`,
    ],
    locale: 'en-GB',
    permissions: ['notifications'],
  })
}

/** Expects the fields selected to have an outline. */
const expectDataAttribute = async (
  parent: Page | Frame,
  ...selectors: string[]
) => {
  for (const selector of selectors) {
    await parent.waitForSelector(selector)
    expect(
      await parent.$eval(selector, (e) => e.dataset.autofillPrototypeInput)
    ).toBeTruthy()
  }
}

// Start the test suite
test.describe('Fields are detected on', async () => {
  /** A browser context. */
  let context: BrowserContext

  /** Opens a site and runs `fn`. */
  const testSite = async (
    site: string,
    fn: ({ page }: { page: Page }) => Promise<void>,
    only = false
  ) => {
    ;(only ? test.only : test)(new URL(site).hostname, async () => {
      if (!context) context = await createContext()

      const page = await context.newPage()
      await page.goto(site)
      await fn({ page })
      await page.close()
    })
  }

  const testSiteOnly = async (
    site: string,
    fn: ({ page }: { page: Page }) => Promise<void>
  ) => testSite(site, fn, true)

  /** A test suite that should work for most websites. */
  const testBasicSite = async (site: string, ...selectors: string[]) =>
    testSite(site, async ({ page }) => {
      await expectDataAttribute(page, ...selectors)
    })

  // === Tests ===
  // === Copy here the test that you want to try ===

  void testSite('https://www.cultura.com/', async ({ page }) => {
    await page.click('text=Accepter')
    await page.click('text=Mon compte')
    await page.click('id=usernameletter')
    await expectDataAttribute(page, '[name=login[username]]')
    await expectDataAttribute(page, '[name=login[password]]')
  })
})
