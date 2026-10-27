import { format, strings } from '@ns1/i18n';
import {
  Button,
  Checkbox,
  Icon,
  icons,
  LinkButton,
  Logo,
  Notice,
  Placeholder,
  Roundtable,
  Shape,
  shapes,
  Skeleton,
  TextField,
  type IconName,
  type ShapeName,
} from '@ns1/ui';
import { colorTokenNames, contrast, themes, type ThemeName } from '@ns1/tokens';
import { ReadingSettingsForm } from '@/components/ReadingSettings';
import { facts } from '@/content/facts';
import { pageMetadata } from '@/lib/metadata';
import { getNonce } from '@/lib/nonce';

const t = strings();
const g = t.styleguide;

export const metadata = pageMetadata({
  title: g.heading,
  description: g.description,
  path: '/styleguide',
});

const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
const themeLabels: Record<ThemeName, string> = {
  light: g.themeLight,
  dark: g.themeDark,
  lightContrast: g.themeLightContrast,
  darkContrast: g.themeDarkContrast,
};

export default async function StyleguidePage() {
  const nonce = await getNonce();
  // Chips get classes, not style attributes: the production CSP blocks inline style attributes.
  const chipCss = colorTokenNames
    .map((n) => `.chip-${kebab(n)}{background:var(--color-${kebab(n)})}`)
    .join('');

  return (
    <div className="stack">
      <style nonce={nonce} dangerouslySetInnerHTML={{ __html: chipCss }} />
      <h1>{g.heading}</h1>
      <p className="lede">{g.prose}</p>

      <section aria-labelledby="sg-colors">
        <h2 id="sg-colors">{g.colorsHeading}</h2>
        <ul className="swatches">
          {colorTokenNames.map((n) => (
            <li key={n} className="swatch">
              <span className={`swatch__chip chip-${kebab(n)}`} aria-hidden />
              <code>{n}</code>
            </li>
          ))}
        </ul>
        <div className="table-scroll" tabIndex={0} role="region" aria-labelledby="sg-contrast">
          <table className="data-table">
            <caption id="sg-contrast">{g.contrastCaption}</caption>
            <thead>
              <tr>
                <th scope="col">{g.tokenColumn}</th>
                {(Object.keys(themes) as ThemeName[]).map((th) => (
                  <th scope="col" key={th}>
                    {themeLabels[th]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {colorTokenNames
                .filter((n) => n !== 'background')
                .map((n) => (
                  <tr key={n}>
                    <th scope="row">
                      <code>{n}</code>
                    </th>
                    {(Object.keys(themes) as ThemeName[]).map((th) => (
                      <td key={th}>
                        <code>{themes[th][n]}</code>{' '}
                        {contrast(themes[th][n], themes[th].background).toFixed(2)}:1
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="sg-type">
        <h2 id="sg-type">{g.typeHeading}</h2>
        <p className="field__hint">{g.displaySampleLabel}</p>
        <p className="display-sample">{t.sample.displayLine}</p>
        <p className="field__hint">{g.textSampleLabel}</p>
        <p>{t.sample.paragraph}</p>
        <p>
          <em>{t.sample.paragraph}</em>
        </p>
      </section>

      <section aria-labelledby="sg-logo">
        <h2 id="sg-logo">{g.logoHeading}</h2>
        <p>{g.logoProse}</p>
        <div className="logo-showcase">
          <Logo label={t.site.name} />
          <Logo variant="mark" label={t.site.name} />
        </div>
      </section>

      <section aria-labelledby="sg-icons">
        <h2 id="sg-icons">{g.iconsHeading}</h2>
        <ul className="icon-grid">
          {(Object.keys(icons) as IconName[]).map((n) => (
            <li key={n}>
              <Icon name={n} size={32} />
              <code>{n}</code>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="sg-shapes">
        <h2 id="sg-shapes">{g.shapesHeading}</h2>
        <p>{g.shapesProse}</p>
        <div className="shape-row">
          {(Object.keys(shapes) as ShapeName[]).map((n) => (
            <Shape key={n} name={n} />
          ))}
        </div>
        <figure className="stack">
          <div className="shape-row">
            <Roundtable seats={facts.sessionSize.value.max} />
          </div>
          <figcaption>
            {format(g.roundtableCaption, { max: facts.sessionSize.value.max })}
          </figcaption>
        </figure>
      </section>

      <section aria-labelledby="sg-buttons">
        <h2 id="sg-buttons">{g.buttonsHeading}</h2>
        <div className="cluster">
          <Button>{t.sample.actions.primary}</Button>
          <Button variant="secondary">{t.sample.actions.secondary}</Button>
          <Button variant="give" icon="heart">
            {t.sample.actions.give}
          </Button>
          <Button variant="help" icon="hand">
            {t.sample.actions.help}
          </Button>
          <Button disabled>{t.sample.actions.disabled}</Button>
          <LinkButton href="#sg-buttons" variant="secondary" icon="arrow-right">
            {t.sample.actions.secondary}
          </LinkButton>
        </div>
      </section>

      <section aria-labelledby="sg-forms">
        <h2 id="sg-forms">{g.formsHeading}</h2>
        <div className="stack">
          <TextField
            id="sg-name"
            label={t.sample.fieldName}
            hint={t.sample.fieldNameHint}
            autoComplete="nickname"
          />
          <TextField
            id="sg-email"
            label={t.sample.fieldEmail}
            type="email"
            autoComplete="email"
            error={t.sample.fieldEmailError}
            defaultValue="name@"
          />
          <Checkbox id="sg-check" label={t.sample.checkbox} />
        </div>
      </section>

      <section aria-labelledby="sg-states">
        <h2 id="sg-states">{g.statesHeading}</h2>
        <div className="stack">
          <Notice>{t.sample.notice}</Notice>
          <Notice tone="error">{t.sample.noticeError}</Notice>
          <Notice tone="success">{t.sample.noticeSuccess}</Notice>
          <Skeleton label={t.sample.loading} />
          <p>
            <Placeholder name={t.placeholder.exampleName} note={t.placeholder.needsSource} />
          </p>
        </div>
      </section>

      <section aria-labelledby="sg-reading">
        <h2 id="sg-reading">{g.readingHeading}</h2>
        <ReadingSettingsForm />
      </section>
    </div>
  );
}
