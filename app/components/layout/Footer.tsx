import { Suspense, useState } from 'react';
import { SallaAppsIcons } from '@salla.sa/twilight-components-react/apps-icons';
import { SallaContacts } from '@salla.sa/twilight-components-react/contacts';
import { SallaSocial } from '@salla.sa/twilight-components-react/social';
import { SallaMenu } from '@salla.sa/twilight-components-react/menu';
import { SallaTrustBadges } from '@salla.sa/twilight-components-react/trust-badges';
import { SallaPayments } from '@salla.sa/twilight-components-react/payments';
import { useQuery } from '@tanstack/react-query';
import { useTwilight } from '@salla.sa/twilight-theme-engine/providers';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { HookSlot, useIsClient } from '@salla.sa/twilight-theme-engine/hooks';
import { Link, Image } from '@salla.sa/twilight-theme-engine/common';
import { ImageModal } from '@salla.sa/twilight-theme-engine/modal';
import { MadeWithSalla } from '@salla.sa/twilight-theme-engine/layout';
import { menu } from '@salla.sa/twilight-theme-engine/api/menu';
import { localizedText, safeUrl } from '../../lib/settings';

/** Salla's value-added-tax badge icon (70×70, CDN-resized) — a platform
 *  asset shared by every store, not specific to any one theme. */
const TAX_ICON_URL =
  'https://cdn.salla.network/cdn-cgi/image/fit=scale-down,width=70,height=70,onerror=redirect,format=auto/images/tax.png?v=2.0.5';

/**
 * The store's value-added-tax registration: the tax number, plus the certificate as
 * the tax icon that opens the certificate image full size in a modal. Nothing shows
 * when the store has no tax number.
 */
function FooterTax({ dark }: { dark: boolean }) {
  const { store } = useTwilight();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const number = store.settings?.tax?.number;
  const certificate = store.settings?.tax?.certificate;
  if (!number) return null;

  return (
    <div
      data-testid="store-footer-tax"
      className="store-footer__tax flex items-end gap-2 rtl:space-x-reverse"
    >
      {certificate && (
        <>
          <button
            type="button"
            data-testid="store-footer-tax-certificate"
            className="store-footer__tax-cert shrink-0"
            aria-label={t('common.elements.tax_certificate', 'Tax Certificate')}
            aria-haspopup="dialog"
            onClick={() => setOpen(true)}
          >
            <img
              src={TAX_ICON_URL}
              alt={t('common.elements.tax_certificate', 'Tax Certificate')}
              width={40}
              height={50}
              loading="lazy"
              decoding="async"
              className="w-10 rounded-sm transition-opacity hover:opacity-80"
            />
          </button>
          {/* Its own boundary: the modal's code loads lazily, and the footer must not wait for it
              to hydrate (see `ThemeLayout`). */}
          <Suspense fallback={null}>
            <ImageModal
              isOpen={open}
              onClose={() => setOpen(false)}
              src={certificate}
              alt={t('common.elements.tax_certificate', 'Tax Certificate')}
              title={t('common.elements.tax_certificate', 'Tax Certificate')}
            />
          </Suspense>
        </>
      )}
      <div>
        <p className={`mb-1 text-sm opacity-70 ${dark ? 'text-white' : ''}`}>
          {t('common.elements.tax_number', 'Tax Number')}
        </p>
        <b className="text-sm">{number}</b>
      </div>
    </div>
  );
}

/** Saudi Business Center (SBC) logo, CDN-versioned like the tax icon -- also a
 *  platform asset, not theme-specific. */
const SBC_ICON_URL = 'https://cdn.salla.network/images/sbc.png?v=2.0.5';

/**
 * The store's Saudi Business Center certificate: a "Trusted by Business Platform" badge that
 * opens the certificate's page on the SBC site so visitors can verify the merchant. Nothing
 * shows when the store has no certificate.
 */
function FooterSbc({ dark }: { dark: boolean }) {
  const { store } = useTwilight();
  const { t } = useTranslation();
  const id = store.settings?.certificate?.id;
  if (!id) return null;

  return (
    <a
      href={`https://eauthenticate.saudibusiness.gov.sa/certificate-details/${encodeURIComponent(id)}`}
      target="_blank"
      rel="noopener noreferrer"
      data-testid="store-footer-sbc"
      className="store-footer__sbc flex items-center gap-2.5 transition-opacity hover:opacity-75"
    >
      <img
        src={SBC_ICON_URL}
        alt={`SBC ${id}`}
        width={56}
        height={40}
        loading="lazy"
        decoding="async"
        className="h-10 w-14 rounded-sm"
      />
      <div>
        <p className={`text-xs opacity-70 ${dark ? 'text-white' : ''}`}>
          {t('blocks.footer.sbc_trusted_by', 'Trusted by')}
        </p>
        <b className="text-sm">{t('blocks.footer.sbc_platform', 'Business Platform')}</b>
      </div>
    </a>
  );
}

/** Trust badges, the tax registration and the SBC badge, side by side (wrapping on narrow columns). */
function FooterTrust({ dark, centered }: { dark: boolean; centered: boolean }) {
  return (
    <div
      data-testid="store-footer-trust"
      className={`store-footer__trust flex flex-wrap items-end gap-x-6 gap-y-3${centered ? ' justify-center' : ''}`}
    >
      <FooterTax dark={dark} />
      <FooterSbc dark={dark} />
      <SallaTrustBadges {...(dark ? { dark: true } : {})} />
    </div>
  );
}

/**
 * The footer's own menu of ("important") links -- skipped entirely when
 * `inSheet`, for a theme that opens it from somewhere else of its own (a
 * mobile account sheet, a dedicated links screen, …) instead; showing it
 * again down here would just be a redundant second copy. `heading` wraps it
 * in the grid layout's own `.store-footer__links` column; the centered
 * layout's inline row has none. Nothing shows once the footer menu comes back
 * empty.
 */
function FooterLinksMenu({
  inSheet,
  className,
  heading,
  dark,
}: {
  inSheet: boolean;
  className: string;
  heading?: string;
  dark: boolean;
}) {
  const { locale } = useTranslation();
  // Loaded and empty: no column, so no heading over nothing. Shown while loading.
  const { data: items, isSuccess } = useQuery({
    queryKey: ['menus', 'footer', locale],
    queryFn: () => menu.footer(),
    staleTime: 5 * 60 * 1000,
    enabled: !inSheet,
  });
  if (inSheet || (isSuccess && !items?.length)) return null;

  const links = <SallaMenu source="footer" className={className} suppressHydrationWarning />;
  if (!heading) return links;

  return (
    <div className="store-footer__links">
      <h3 className={`mb-3 text-lg font-bold lg:mb-5 ${dark ? 'text-white' : 'text-gray-900'}`}>
        {heading}
      </h3>
      {links}
    </div>
  );
}

/** App-store / Google-Play buttons. Nothing shows -- not even the wrapping
 *  div -- when the store has neither link set. */
function FooterApps({ className }: { className: string }) {
  const { store } = useTwilight();
  const { t } = useTranslation();
  // The web component fills its light DOM before React hydrates the footer, a hydration error.
  const isClient = useIsClient();
  if (!store.apps?.appstore && !store.apps?.googleplay) return null;

  return (
    <div data-testid="store-footer-apps" className={`store-footer__apps ${className}`}>
      {isClient && (
        <SallaAppsIcons
          apps={store.apps}
          appsTitle={t('blocks.footer.download_apps', 'Get our apps')}
        />
      )}
    </div>
  );
}

/** The logo link, same shape in both layouts -- only its own spacing differs. */
function FooterLogo({ className }: { className: string }) {
  const { store, theme } = useTwilight();
  // A light version of the logo for the dark footer (`footer_logo` setting).
  const footerLogo = safeUrl((theme?.settings as Record<string, unknown> | undefined)?.footer_logo);
  return (
    <Link
      to="/"
      className={`store-footer__logo inline-flex items-center m-0 transition-opacity hover:opacity-75 ${className}`}
    >
      <Image
        src={footerLogo || store.logo}
        alt={store.name || 'Store'}
        width={150}
        height={96}
        objectFit="contain"
        className="h-20 w-auto max-w-[180px] lg:h-24"
      />
    </Link>
  );
}

/** Merchant-authored description HTML -- mirrors the Twig theme's
 *  `store.description|raw`. Renders nothing when the store has none set. */
function FooterDescription({ className }: { className: string }) {
  const { store } = useTwilight();
  if (!store.description) return null;
  return (
    <div
      className={`store-footer__desc opacity-80 ${className}`}
      dangerouslySetInnerHTML={{ __html: store.description }}
    />
  );
}

/** The store's contacts (WhatsApp, mobile, phone, email, Telegram) as their own
 *  labeled column, one row per channel, as in Twig Raed's footer. Renders nothing
 *  when the store has none, or in the account sheet, which lists them itself. */
function FooterContactsColumn({ inSheet, dark }: { inSheet: boolean; dark: boolean }) {
  const { store } = useTwilight();
  const { t } = useTranslation();
  // See FooterContacts: the web component would fill its light DOM before hydration.
  const isClient = useIsClient();
  const contacts = store.contacts;
  const hasAny = Object.values(contacts ?? {}).some(Boolean);
  if (inSheet || !hasAny) return null;

  return (
    <div className="store-footer__contact-list">
      <h3 className={`mb-3 text-lg font-bold lg:mb-5 ${dark ? 'text-white' : 'text-gray-900'}`}>
        {t('blocks.footer.social', 'Contact us')}
      </h3>
      {isClient && <SallaContacts contacts={contacts} hideTitle />}
    </div>
  );
}

export interface FooterProps {
  /**
   * Renders as a plain `<div>` (no second `<footer>` landmark) with the
   * `footer:start` / `footer:end` hook slots skipped -- for the mobile account
   * sheet, which repeats these widgets outside the page footer.
   */
  inSheet?: boolean;
}

/** Short line under the logo: the theme's `footer_tagline` setting (plain text),
 *  else the store description the merchant wrote in the dashboard. */
function FooterTagline() {
  const { theme } = useTwilight();
  const { locale } = useTranslation();
  const tagline = localizedText(
    (theme?.settings as Record<string, unknown> | undefined)?.footer_tagline,
    locale
  );
  if (tagline) return <p className="hd-footer__tagline">{tagline}</p>;
  return <FooterDescription className="hd-footer__tagline" />;
}

/**
 * Hudoo footer -- Figma «03 · Theme – Mobile → Footer»: a primary-deep band with
 * the logo, a one-line tagline, the footer menu as a highlight-coloured row, a
 * divider, then payment methods and the copyright line. On desktop the same
 * pieces spread into columns (brand · links · contacts · trust).
 *
 * Fork of the engine `Footer` (see `FORKS.md`): same data and Salla widgets
 * (menu, contacts, social, trust badges, tax / SBC, apps, payments), new layout.
 * The `footer_layout` / `footer_is_dark` starter settings no longer apply: the
 * footer always sits on the deep brand colour.
 */
export function Footer({ inSheet = false }: FooterProps = {}) {
  const { store } = useTwilight();
  const { t } = useTranslation();
  const year = new Date().getFullYear();
  const Root = inSheet ? 'div' : 'footer';

  return (
    <Root
      className={`store-footer hd-footer${inSheet ? ' store-footer--sheet hd-footer--sheet' : ''}`}
      suppressHydrationWarning
    >
      {!inSheet && <HookSlot name="footer:start" />}

      <div className="hd-footer__inner container">
        <div className="hd-footer__brand">
          {!inSheet && <FooterLogo className="hd-footer__logo" />}
          <FooterTagline />
          <SallaSocial className="hd-footer__social" />
        </div>

        <FooterLinksMenu
          inSheet={inSheet}
          className="store-footer__menu hd-footer__menu"
          heading={t('blocks.footer.important_links', 'Important links')}
          dark
        />

        <FooterContactsColumn inSheet={inSheet} dark />

        <div className="hd-footer__extras">
          <FooterTrust dark centered={false} />
          <FooterApps className="" />
        </div>
      </div>

      <div className="hd-footer__bottom container">
        <span className="hd-footer__copyright">
          <HookSlot
            name="copyright"
            context={{ storeName: store.name }}
            fallback={
              <>
                © {store.name} {year} · {t('blocks.footer.copyright', 'All rights reserved')}
                <MadeWithSalla className="ms-2" />
              </>
            }
          />
        </span>
        <SallaPayments />
      </div>

      {!inSheet && <HookSlot name="footer:end" />}
    </Root>
  );
}
