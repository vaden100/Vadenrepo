/**
 * English UI strings (SPEC 6.2). Every visible word in a component comes from here.
 *
 * Conventions checked by scripts/check-copy.mjs and scripts/readability.mjs:
 * - keys ending in `Heading` or living under `actions` never end with "!".
 * - `actions` are verb + object ("Save settings", not "Submit").
 * - strings under a `prose` key are full sentences and must read at grade 8 or lower.
 * Facts about the gallery (names, places, dates, figures) never live here; they come from the
 * content layer with a source in docs/facts.md.
 */
export const en = {
  meta: {
    lang: 'en',
    languageName: 'English',
  },
  site: {
    name: 'The NS1 Gallery',
    logoAlt: 'The NS1 Gallery, home',
  },
  nav: {
    skip: 'Skip to main content',
    menu: 'Menu',
    closeMenu: 'Close menu',
    primaryLabel: 'Main',
    footerLabel: 'Footer',
    breadcrumbLabel: 'Breadcrumb',
    home: 'Home',
    styleguide: 'Style guide',
  },
  reading: {
    heading: 'Reading settings',
    open: 'Reading settings',
    prose: 'Change how the site looks on this device. We save your choices in this browser only.',
    textSize: 'Text size',
    textSizeNormal: 'Normal',
    textSizeLarge: 'Large',
    textSizeLarger: 'Larger',
    spacing: 'Extra letter and line spacing',
    motion: 'Reduce motion',
    contrast: 'High contrast',
    theme: 'Color theme',
    themeSystem: 'Match my device',
    themeLight: 'Light',
    themeDark: 'Dark',
    saved: 'Saved on this device.',
    actions: {
      reset: 'Reset settings',
      close: 'Close settings',
    },
  },
  home: {
    title: 'The NS1 Gallery',
    description:
      'The new website for The NS1 Gallery is being built. Find sessions on the current site for now.',
    prose:
      'Our new website is being built. The current site is still the place to find sessions and ways to reach us.',
    currentSiteLink: 'Go to the current site',
    styleguideLink: 'See the style guide',
  },
  placeholder: {
    label: 'Placeholder',
    needsSource: 'needs source',
    exampleName: 'IMPACT FIGURE',
  },
  styleguide: {
    heading: 'Style guide',
    description:
      'Colors, type, icons, shapes and parts of the NS1 Gallery website, in every theme.',
    prose:
      'Every color, type style, icon, shape and part of the site in one place. Use it to check a change before it ships.',
    colorsHeading: 'Colors',
    contrastLabel: 'Contrast on background',
    typeHeading: 'Type',
    iconsHeading: 'Icons',
    logoHeading: 'Logo',
    logoProse:
      'This is a stand-in logo. It will be swapped for the real NS1 logo when we get the file.',
    shapesHeading: 'Shapes',
    shapesProse:
      'The shapes come from the sessions: the round table, the whiteboard marker line, the star and the speech bubble.',
    buttonsHeading: 'Buttons',
    formsHeading: 'Form fields',
    statesHeading: 'Notices and loading',
    readingHeading: 'Reading settings',
    roundtableCaption:
      'Generated round table: one seat for each person at a full session ({max} people, from the current site).',
    contrastCaption: 'Contrast of each color against the page background, in every theme.',
    tokenColumn: 'Color',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeLightContrast: 'High contrast light',
    themeDarkContrast: 'High contrast dark',
    displaySampleLabel: 'Display face: Fraunces',
    textSampleLabel: 'Text face: Atkinson Hyperlegible Next',
  },
  sample: {
    paragraph:
      'This is sample text for checking type and spacing. It says nothing about the gallery. Real words come from the content team.',
    displayLine: 'A sample heading set in the display face',
    fieldName: 'First name or nickname',
    fieldNameHint: 'Use any name you like.',
    fieldEmail: 'Email',
    fieldEmailError: 'Enter an email address like name@example.com.',
    checkbox: 'Send me the date of the next session',
    notice: 'This is how we show a helpful note.',
    noticeError: 'This is how we show a problem and how to fix it.',
    noticeSuccess: 'This is how we show that something worked.',
    loading: 'Loading',
    actions: {
      primary: 'Save my spot',
      secondary: 'See all sessions',
      give: 'Give monthly',
      help: 'Find help now',
      disabled: 'Session full',
    },
  },
  footer: {
    copyright: 'Copyright',
  },
  errors: {
    notFoundHeading: 'We could not find that page',
    notFoundProse: 'The link may be old or typed wrong. Try the home page.',
    notFoundTitle: 'Page not found',
    actions: {
      home: 'Go to the home page',
    },
  },
} as const;

type Widen<T> = T extends string ? string : { [K in keyof T]: Widen<T[K]> };
/** Shape every language file must match. */
export type Strings = Widen<typeof en>;
