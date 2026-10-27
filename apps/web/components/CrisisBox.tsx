import { format, strings } from '@ns1/i18n';
import { Icon } from '@ns1/ui';
import { crisis } from '@/content/facts';

/** National crisis lines, verified at the source (docs/facts.md). Not a gallery service. */
export function CrisisBox() {
  const t = strings().crisis;
  return (
    <aside className="crisis" aria-labelledby="crisis-heading">
      <h2 id="crisis-heading">{t.heading}</h2>
      <p>{t.prose}</p>
      <ul className="crisis__list">
        <li>
          <Icon name="phone" />{' '}
          <a href={`tel:${crisis.lifeline.number}`}>
            {format(t.call, { number: crisis.lifeline.number })}
          </a>
        </li>
        <li>
          <Icon name="chat" /> <a href={crisis.lifeline.chatUrl}>{t.chat}</a>
        </li>
        <li>
          <Icon name="alert" /> {format(t.emergency, { number: crisis.emergency.number })}
        </li>
      </ul>
      <p className="field__hint">{format(t.checked, { date: crisis.verified })}</p>
    </aside>
  );
}
