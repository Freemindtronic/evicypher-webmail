/* eslint-disable sonarjs/no-identical-functions */
/* eslint-disable sonarjs/no-duplicate-string */
import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { BrowserContext, expect, test } from '@playwright/test'
import { chromium, Frame, Page } from 'playwright'

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

/** A test suite that should work for most websites. */
const testBasicSite = async (site: string, ...selectors: string[]) =>
  testSite(site, async ({ page }) => {
    await expectDataAttribute(page, ...selectors)
  })

// Start the test suite in parallel for faster test
test.describe.parallel('Fields are detected on', async () => {
  // === Tests ===
  // Please keep the tests in alphabetical order

  /* cSpell:disable */

  // ===0 - 9 ===
  void testSite('https://www.1001-deco-table.com/', async ({ page }) => {
    await page.click('text=Tout accepter')
    await page.hover('text=Espace client')
    await expectDataAttribute(
      page,
      '[placeholder="Email"]',
      '[placeholder="Mot de passe"]'
    )
  })
  void testBasicSite(
    'https://www.123digit.be/fr/login/',
    '[placeholder="Votre mail"]',
    '[placeholder="Mot de passe"]'
  )
  void testSite('https://www.20minutes.fr/', async ({ page }) => {
    await page.click('text=Accepter et fermer')
    await page.click('text=Connexion')
    await expectDataAttribute(
      page,
      'input:below(:text("Email"))',
      'input:below(:text("Mot de passe"))'
    )
  })
  void testSite('https://24xbtc.com/', async ({ page }) => {
    await page.click('[class="button blue bordered"]')
    await expectDataAttribute(
      page,
      '[name="LoginForm[username]"]',
      '[name="LoginForm[password]"]'
    )
  })

  void testSite('https://www.6play.fr/', async ({ page }) => {
    await page.click('text=Continuer sans accepter')
    await page.click('text=Mon compte')
    await expectDataAttribute(page, '[name=email]', '[name=password]')
  })

  void testBasicSite(
    'https://i.360.cn/login/',
    '[placeholder="手机号/用户名/邮箱"]',
    '[placeholder="密码"]'
  )

  // === #A ===
  void testSite('https://ams.com/login', async ({ page }) => {
    await page.click('text=Accept All Cookies (incl. US)')
    await expectDataAttribute(
      page,
      '[name="_com_liferay_login_web_portlet_LoginPortlet_login"]',
      '[name="_com_liferay_login_web_portlet_LoginPortlet_password"]'
    )
  })

  void testBasicSite(
    'https://vip.anpi.com/login',
    '[placeholder="Username"]',
    '[placeholder="Password"]'
  )

  void testSite(
    'https://auth.services.adobe.com/en_US/index.html',
    async ({ page }) => {
      await expectDataAttribute(page, 'input:visible')
      await page.type('input:visible', 'test@example.org')
      await page.press('input:visible', 'Enter')
      await expectDataAttribute(page, 'input:visible')
    }
  )

  void testSite('https://www.aliexpress.com/', async ({ page }) => {
    await page.click('.btn-close')
    await page.hover('text=Account')
    await page.click('text=Sign in')
    void expectDataAttribute(
      page,
      '[placeholder="Email address or member ID"]',
      '[placeholder="Password"]'
    )
  })
  void testSite('https://www.amazon.com/', async ({ page }) => {
    await page.hover('text=Account & Lists')
    await page.click('text=Sign in')
    await expectDataAttribute(page, 'input:visible')
    await page.type('input:visible', 'test@example.org')
    await page.press('input:visible', 'Enter')
    await expectDataAttribute(page, 'input:visible')
  })
  void testSite('https://www.aparat.com/login', async ({ page }) => {
    await expectDataAttribute(page, 'input:visible')
    await page.type('input:visible', 'test')
    await page.press('input:visible', 'Enter')
    await expectDataAttribute(page, 'input:visible')
  })
  void testSite('https://appleid.apple.com/', async ({ page }) => {
    const frame = page.frame('aid-auth-widget')
    if (frame === null) throw new Error('frame not found')

    await expectDataAttribute(frame, '[placeholder="Apple ID"]')
    await frame.type('[placeholder="Apple ID"]', 'test@example.org')
    await frame.click('#sign-in')
    await expectDataAttribute(frame, '[placeholder="Password"]')
  })

  void testBasicSite(
    'https://passport.alibaba.com/',
    '[placeholder="Email address or member ID"]',
    '[placeholder="Password"]'
  )

  // === #B ===
  void testSite('https://baidu.com/', async ({ page }) => {
    await page.click('#s-top-loginbtn')
    await page.click('text=帐号登录')
    await expectDataAttribute(
      page,
      '[placeholder="手机号/用户名/邮箱"]',
      '[placeholder="密码"]'
    )
  })

  void testBasicSite(
    'https://www.backerkit.com/admins/sign_in',
    '[placeholder="email@gmail.com"]',
    '[placeholder="Password"]'
  )

  void testBasicSite(
    'https://account.bbc.com/signin',
    ':nth-match(input:visible, 1)',
    ':nth-match(input:visible, 2)'
  )
  void testBasicSite(
    'https://login.bigcommerce.com/login',
    '[name="user[email]"]',
    '[name="user[password]"]'
  )
  void testSite('https://accounts.binance.com/en/login', async ({ page }) => {
    await page.click('text="Email"')
    await expectDataAttribute(page, '[name="email"]', '[name="password"]')
  })

  // === #C ===

  void testSite('https://www.coingecko.com/en', async ({ page }) => {
    await page.click('text="Login"')
    await expectDataAttribute(
      page,
      '[name="user[email]"]',
      '[name="user[password]"]'
    )
  })
  void testSite('https://coinmarketcap.com/', async ({ page }) => {
    await page.click('text=Log in')
    await expectDataAttribute(
      page,
      '[placeholder="Enter your email address..."]',
      '[placeholder="Enter your password..."]'
    )
  })

  // === #D ===

  void testSite('https://fr.depositphotos.com/', async ({ page }) => {
    await page.click('text=Connexion')
    await page.click('text=Connexion par ')
    await expectDataAttribute(page, '[name=username]')
    await expectDataAttribute(page, '[name=password]')
  })

  void testBasicSite(
    'https://discord.com/login',
    ':nth-match(input:visible, 1)',
    ':nth-match(input:visible, 2)'
  )

  // === #E ===

  void testBasicSite(
    'https://my.ecwid.com/cp/',
    '[name="email"]',
    '[name="password"]'
  )
  void testBasicSite(
    'https://etherscan.io/login',
    '[placeholder="Username"]',
    '[placeholder="Password"]'
  )

  // === #F ===
  void testBasicSite(
    'https://fr-fr.facebook.com/',
    '[placeholder="Adresse e-mail ou numéro de tél."]',
    '[placeholder="Mot de passe"]'
  )
  void testBasicSite(
    'https://www.feda.ad/',
    '[placeholder="Usuari"]',
    '[placeholder="Contrasenya"]'
  )

  // === #G ===
  void testBasicSite(
    'https://github.com/login',
    'input:below(:text("Username or email address"))',
    'input:below(:text("Password"))'
  )
  void testSite('https://accounts.google.com/signin', async ({ page }) => {
    await expectDataAttribute(page, 'input:visible')
    await page.type('input:visible', 'test@example.org')
    await page.press('input:visible', 'Enter')
    await expectDataAttribute(page, 'input:visible')
  })

  // === #H ===

  // === #I ===
  void testSite('https://www.instagram.com/', async ({ page }) => {
    await page.click('text=Accept all')
    await expectDataAttribute(
      page,
      '[aria-label="Phone number, username or email address"]',
      '[aria-label="Password"]'
    )
  })

  // === #J ===
  void testSite('https://passport.jd.com/new/login.aspx', async ({ page }) => {
    await page.click('text=账户登录')
    await expectDataAttribute(
      page,
      '[placeholder="邮箱/用户名/登录手机"]',
      '[placeholder="密码"]'
    )
  })

  // === #K ===
  void testBasicSite(
    'https://www.kraken.com/sign-in',
    ':nth-match(input:visible, 1)',
    ':nth-match(input:visible, 2)'
  )

  // === #L ===
  void testBasicSite(
    'https://www.linkedin.com/uas/login',
    ':nth-match(input:visible, 1)',
    ':nth-match(input:visible, 2)'
  )
  void testSite('https://login.live.com/', async ({ page }) => {
    await expectDataAttribute(page, 'input:visible')
    await page.type('input:visible', 'test@example.com')
    await page.press('input:visible', 'Enter')
    await expectDataAttribute(page, 'input:visible')
  })

  // === #M ===
  void testBasicSite(
    'https://mega.nz/login',
    '[placeholder*="Your Email"]',
    '[placeholder*="Password"]'
  )

  // === #N ===
  void testBasicSite(
    'https://nid.naver.com/nidlogin.login',
    '[placeholder="Username"]',
    '[placeholder="Password"]'
  )
  void testBasicSite(
    'https://www.netflix.com/fr-en/login',
    '[name="userLoginId"]',
    '[name="password"]'
  )

  // === #O ===

  void testBasicSite(
    'https://www.odoo.com/fr_FR/web/login',
    '[name="login"]',
    '[name="password"]'
  )
  void testBasicSite(
    'https://id.okezone.com/users/sign_in',
    '[placeholder="Email"]',
    '[placeholder="Password"]'
  )

  void testBasicSite(
    'https://account.oneplus.com/signin/',
    '[name="input-email"]',
    '[name="input-password"]'
  )

  void testBasicSite(
    'https://www.opencart.com/index.php?route=account/login',
    '[name="email"]',
    '[name="password"]'
  )
  void testSite('https://login.orange.fr/', async ({ page }) => {
    await page.click('text=Tout accepter')
    await expectDataAttribute(page, '[name=login]')
    await page.type('[name=login]', 'test@example.org')
    await page.press('[name=login]', 'Enter')
    await expectDataAttribute(page, '[name=password]')
  })

  // === #P ===

  void testSite('https://www.paypal.com/fr/signin', async ({ page }) => {
    await expectDataAttribute(page, 'input:visible')
    await page.type('input:visible', 'test@example.org')
    await page.press('input:visible', 'Enter')
    await expectDataAttribute(page, 'input:visible')
  })

  void testBasicSite(
    'https://account.protonmail.com/login',
    ':nth-match(input:visible, 1)',
    ':nth-match(input:visible, 2)'
  )

  // === #Q ===
  void testSite('https://aq.qq.com/cn2/index', async ({ page }) => {
    await page.click('text="登录"')
    const iframe = await page.waitForSelector(
      'iframe[src^="https://xui.ptlogin2.qq.com/"]'
    )
    const frame = await iframe.contentFrame()
    expect(frame).not.toBeNull()
    if (!frame) return
    await frame.waitForLoadState()
    await expectDataAttribute(frame, '[name="u"]', '[name="p"]')
  })

  // === #R ===
  void testSite('https://www.reddit.com/', async ({ page }) => {
    await page.click('text=Log In')
    const iframe = await page.waitForSelector(
      'iframe[src^="https://www.reddit.com/login/"]'
    )
    const frame = await iframe.contentFrame()
    expect(frame).not.toBeNull()
    if (!frame) return
    await frame.waitForLoadState()
    await expectDataAttribute(
      frame,
      '[placeholder*="Username"]',
      '[placeholder*="Password"]'
    )
  })

  // === #S ===
  void testSite('https://www.sohu.com/', async ({ page }) => {
    await page.click('text=登录')
    await page.click('text=账号密码登录')
    await expectDataAttribute(
      page,
      '[placeholder="邮箱/手机号"]',
      '[placeholder="请输入密码"]'
    )
  })
  void testBasicSite(
    'https://stackoverflow.com/users/login',
    '[name="email"]',
    '[name="password"]'
  )

  // === #T ===
  void testBasicSite(
    'https://login.taobao.com/',
    '[placeholder="会员名/邮箱/手机号"]',
    '[placeholder="请输入登录密码"]'
  )
  void testSite('https://www.tradingview.com/', async ({ page }) => {
    await page.click('[aria-label="Open user menu"]')
    await page.click('text=Sign in')
    await page.click('text=Email')
    await expectDataAttribute(
      page,
      ':nth-match(input:visible, 1)',
      ':nth-match(input:visible, 2)'
    )
  })
  void testSite('https://www.twitch.tv/', async ({ page }) => {
    await page.click('text=Log in')
    await expectDataAttribute(page, '#login-username', '#password-input')
  })
  void testSite('https://twitter.com/i/flow/login', async ({ page }) => {
    await page.fill('input:visible', 'service-clients@evivault.com')
    await page.press('input:visible', 'Enter')
    await page.fill('input:visible', 'EviVault')
    await page.press('input:visible', 'Enter')
    await expectDataAttribute(page, '[name="password"]')
  })

  // === #U ===
  void testBasicSite(
    'https://www.udemy.com/join/login-popup/',
    '[placeholder="Email"]',
    '[placeholder="Password"]'
  )

  // === #V ===
  void testSite('https://vimeo.com/', async ({ page }) => {
    await page.click('text="Log in"')
    await expectDataAttribute(
      page,
      '[placeholder="Email address"]',
      '[placeholder="Password"]'
    )
  })
  void testBasicSite(
    'https://vk.com/',
    '[placeholder="Phone or email"]',
    '[placeholder="Password"]'
  )

  // === #W ===

  void testBasicSite(
    'https://www.webador.fr/connexion',
    '[name="identity"]',
    '[name="credential"]'
  )
  void testBasicSite(
    'https://en.wikipedia.org/w/index.php?title=Special:UserLogin&returnto=Main+Page',
    '[placeholder="Enter your username"]',
    '[placeholder="Enter your password"]'
  )

  void testBasicSite(
    'https://www.wish.com/?hide_login_modal=true',
    '[placeholder="Email Address"]',
    '[placeholder="Password"]'
  )
  void testSite('https://wordpress.com/log-in', async ({ page }) => {
    await expectDataAttribute(page, 'input:visible')
    await page.fill('input:visible', 'test@example.org')
    await page.press('input:visible', 'Enter')
    await expectDataAttribute(page, '[name="password"]')
  })

  // === #X ===

  // === #Y ===
  void testSite('https://passport.yandex.ru/auth', async ({ page }) => {
    await expectDataAttribute(page, 'input:visible')
    await page.type('input:visible', 'test')
    await page.press('input:visible', 'Enter')
    await expectDataAttribute(page, 'input:visible')
  })

  // === #Z ===
  void testBasicSite(
    'https://zoom.us/signin',
    '[placeholder="Email Address"]',
    '[placeholder="Password"]'
  )

  /* CSpell:enable */
})
