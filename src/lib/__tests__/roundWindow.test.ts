import {
  closingInstantOnOrAfter,
  roundEndFor,
  roundWindowFrom,
  resolveRoundWindow,
  isGameWithinWindow,
  isRoundOver,
  formatLeagueTime,
} from '../roundWindow';

/** 20 h au Bénin (UTC+1) == 19 h UTC le même jour calendaire. */
const closing = (isoDay: string) => `${isoDay}T19:00:00.000Z`;

describe('roundWindow — bascule à 20 h heure du Bénin', () => {
  it('trouve la bascule du jour local en cours', () => {
    // 10 h UTC = 11 h au Bénin : la bascule est le soir même.
    const t = new Date('2026-07-25T10:00:00Z');
    expect(closingInstantOnOrAfter(t).toISOString()).toBe(closing('2026-07-25'));
  });

  it('renvoie l’instant lui-même quand il est déjà une bascule', () => {
    const t = new Date(closing('2026-07-25'));
    expect(closingInstantOnOrAfter(t).toISOString()).toBe(closing('2026-07-25'));
  });

  it('passe au lendemain une seconde après la bascule', () => {
    const t = new Date('2026-07-25T19:00:01Z');
    expect(closingInstantOnOrAfter(t).toISOString()).toBe(closing('2026-07-26'));
  });

  it('utilise le jour calendaire du Bénin, pas celui d’UTC', () => {
    // 23 h 30 UTC le 25 = 00 h 30 le 26 au Bénin : la bascule est celle du 26.
    const t = new Date('2026-07-25T23:30:00Z');
    expect(closingInstantOnOrAfter(t).toISOString()).toBe(closing('2026-07-26'));
  });
});

describe('roundWindow — durée de ronde', () => {
  it('dure exactement 3 jours quand la ronde s’ouvre sur une bascule', () => {
    const startsAt = new Date(closing('2026-07-25'));
    expect(roundEndFor(startsAt).toISOString()).toBe(closing('2026-07-28'));
  });

  it('se recale sur la grille quand la ronde s’ouvre à une heure quelconque', () => {
    // Ronde générée à la main à 10 h UTC : la fin est la bascule qui suit
    // les 3 jours, pas 3 jours pile.
    const startsAt = new Date('2026-07-25T10:00:00Z');
    expect(roundEndFor(startsAt).toISOString()).toBe(closing('2026-07-28'));
  });

  it('roundWindowFrom expose début et fin', () => {
    const startsAt = new Date(closing('2026-07-25'));
    const w = roundWindowFrom(startsAt);
    expect(w.startsAt).toEqual(startsAt);
    expect(w.endsAt.toISOString()).toBe(closing('2026-07-28'));
  });
});

describe('resolveRoundWindow — ne devine jamais', () => {
  it('refuse une ronde sans aucune date plutôt que de deviner', () => {
    // C’est le cœur du bug V2 : l’ancien code retombait sur event.startDate,
    // ce qui revenait à accepter toute partie depuis la création de la ligue.
    expect(() => resolveRoundWindow({}, 'event x, ronde 3')).toThrow(/introuvable/i);
  });

  it('refuse une date illisible', () => {
    expect(() => resolveRoundWindow({ date: 'pas-une-date' }, 'event x, ronde 3')).toThrow(
      /illisible/i
    );
  });

  it('refuse une fenêtre dont la fin précède le début', () => {
    expect(() =>
      resolveRoundWindow(
        { startsAt: closing('2026-07-28'), endsAt: closing('2026-07-25') },
        'event x, ronde 3'
      )
    ).toThrow(/incohérente/i);
  });

  it('utilise startsAt/endsAt quand ils sont stockés', () => {
    const w = resolveRoundWindow(
      { startsAt: closing('2026-07-25'), endsAt: closing('2026-07-28') },
      'event x, ronde 3'
    );
    expect(w.startsAt.toISOString()).toBe(closing('2026-07-25'));
    expect(w.endsAt.toISOString()).toBe(closing('2026-07-28'));
  });

  it('déduit la fin des rondes créées avant la V3 (champ `date` seul)', () => {
    const w = resolveRoundWindow({ date: closing('2026-07-25') }, 'event x, ronde 3');
    expect(w.startsAt.toISOString()).toBe(closing('2026-07-25'));
    expect(w.endsAt.toISOString()).toBe(closing('2026-07-28'));
  });
});

describe('isGameWithinWindow', () => {
  const window = {
    startsAt: new Date(closing('2026-07-25')),
    endsAt: new Date(closing('2026-07-28')),
  };

  it('rejette une partie sans date', () => {
    // Défaut V2 : `g.created_at &&` sautait le test et acceptait la partie.
    expect(isGameWithinWindow(undefined, window)).toBe(false);
    expect(isGameWithinWindow(null, window)).toBe(false);
    expect(isGameWithinWindow('', window)).toBe(false);
  });

  it('rejette une date illisible', () => {
    expect(isGameWithinWindow('hier soir', window)).toBe(false);
  });

  it('rejette une partie antérieure à la ronde', () => {
    expect(isGameWithinWindow('2026-07-25T18:59:59Z', window)).toBe(false);
  });

  it('rejette une partie postérieure à la ronde', () => {
    expect(isGameWithinWindow('2026-07-28T19:00:01Z', window)).toBe(false);
  });

  it('accepte une partie dans la fenêtre', () => {
    expect(isGameWithinWindow('2026-07-26T15:00:00Z', window)).toBe(true);
  });

  it('borne semi-ouverte : début inclus, fin exclue', () => {
    // Garantit qu’une partie ne peut pas compter pour deux rondes consécutives.
    expect(isGameWithinWindow(closing('2026-07-25'), window)).toBe(true);
    expect(isGameWithinWindow(closing('2026-07-28'), window)).toBe(false);
  });
});

describe('isRoundOver / formatLeagueTime', () => {
  const window = {
    startsAt: new Date(closing('2026-07-25')),
    endsAt: new Date(closing('2026-07-28')),
  };

  it('détecte la fin de ronde', () => {
    expect(isRoundOver(window, new Date('2026-07-28T18:59:59Z'))).toBe(false);
    expect(isRoundOver(window, new Date(closing('2026-07-28')))).toBe(true);
  });

  it('affiche l’heure locale du club', () => {
    expect(formatLeagueTime(new Date(closing('2026-07-28')))).toBe('28/07/2026 20:00');
  });
});
