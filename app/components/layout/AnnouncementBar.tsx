import { useTwilight } from '@salla.sa/twilight-theme-engine/providers';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { isOn, localizedText, safeUrl } from '../../lib/settings';

/**
 * The theme's own announcement bar (settings: `announcement_enabled`,
 * `announcement_text`, `announcement_link`). It sits above Salla's announcement
 * bars (`PageAdvertisements`), which the merchant manages per page in the
 * dashboard. Text is shown as plain text, never as HTML.
 */
export function AnnouncementBar() {
  const { theme } = useTwilight();
  const { locale } = useTranslation();
  const settings = theme?.settings as Record<string, unknown> | undefined;
  if (!isOn(settings?.announcement_enabled)) return null;

  const text = localizedText(settings?.announcement_text, locale);
  if (!text) return null;
  const href = safeUrl(settings?.announcement_link);

  return (
    <div className="hd-announcement" role="region" aria-label={text}>
      {href ? (
        <a className="hd-announcement__text" href={href}>
          {text}
        </a>
      ) : (
        <p className="hd-announcement__text">{text}</p>
      )}
    </div>
  );
}
