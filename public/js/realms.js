/*
 * PSYCHE MIRROR — the five realms.
 *
 * Items are the 50 public-domain IPIP Big-Five Factor Markers
 * (Goldberg, 1992; International Personality Item Pool, https://ipip.ori.org/),
 * lightly adapted: each is prefixed with "I" and set in Irish/British spelling.
 *
 * keyed: "+" means agreement raises the realm score;
 *        "-" means the item is reverse-keyed (6 − answer).
 *
 * This is a reflective, entertainment-grade personality mirror.
 * It is NOT a clinical, diagnostic or screening instrument.
 *
 * UMD wrapper: works as a classic <script> (window.PsycheRealms)
 * and as a CommonJS module (require) for the node:test suite.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PsycheRealms = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var LIKERT = [
    { value: 1, label: 'Very inaccurate' },
    { value: 2, label: 'Moderately inaccurate' },
    { value: 3, label: 'Neither accurate nor inaccurate' },
    { value: 4, label: 'Moderately accurate' },
    { value: 5, label: 'Very accurate' }
  ];

  var BAND_NAMES = {
    low: { label: 'Lower', epithet: 'The Hush' },
    mid: { label: 'Middling', epithet: 'The Gloaming' },
    high: { label: 'Higher', epithet: 'The Blaze' }
  };

  var REALMS = [
    {
      id: 'lantern',
      numeral: 'I',
      name: 'The Lantern',
      trait: 'Intellect & Imagination',
      ipipFactor: 'Intellect/Imagination (Factor V)',
      invitation:
        'Carry the lantern into the library after midnight. How brightly does your curiosity burn, and how far into the dark stacks does it wander?',
      items: [
        { id: 'lan01', text: 'I have a rich vocabulary.', keyed: '+' },
        { id: 'lan02', text: 'I have difficulty understanding abstract ideas.', keyed: '-' },
        { id: 'lan03', text: 'I have a vivid imagination.', keyed: '+' },
        { id: 'lan04', text: 'I am not interested in abstract ideas.', keyed: '-' },
        { id: 'lan05', text: 'I have excellent ideas.', keyed: '+' },
        { id: 'lan06', text: 'I do not have a good imagination.', keyed: '-' },
        { id: 'lan07', text: 'I am quick to understand things.', keyed: '+' },
        { id: 'lan08', text: 'I use difficult words.', keyed: '+' },
        { id: 'lan09', text: 'I spend time reflecting on things.', keyed: '+' },
        { id: 'lan10', text: 'I am full of ideas.', keyed: '+' }
      ],
      bands: {
        low: {
          title: 'A lantern trimmed low',
          text:
            'Your flame favours the known path over the labyrinth. You prefer ideas with their boots on \u2014 practical, proven, useful by morning. There is a quiet wisdom in not chasing every will-o\u2019-the-wisp across the bog.'
        },
        mid: {
          title: 'A steady wick',
          text:
            'You wander the stacks when the mood takes you, and return to the fire when it does not. Curious without being consumed, you can entertain a strange notion over supper and still remember to lock the door.'
        },
        high: {
          title: 'A lantern blazing in the stacks',
          text:
            'Your mind roams the corridors long after the candles gutter \u2014 abstractions, metaphors and half-built cathedrals of thought. Mind the hour: not every locked door needs opening tonight, though you will want to.'
        }
      }
    },
    {
      id: 'clockwork',
      numeral: 'II',
      name: 'The Clockwork',
      trait: 'Conscientiousness',
      ipipFactor: 'Conscientiousness (Factor III)',
      invitation:
        'Somewhere in the house a great clock ticks. Do you wind it faithfully each Sunday, or let it run down and tell the time by the light through the stained glass?',
      items: [
        { id: 'clk01', text: 'I am always prepared.', keyed: '+' },
        { id: 'clk02', text: 'I leave my belongings around.', keyed: '-' },
        { id: 'clk03', text: 'I pay attention to details.', keyed: '+' },
        { id: 'clk04', text: 'I make a mess of things.', keyed: '-' },
        { id: 'clk05', text: 'I get chores done right away.', keyed: '+' },
        { id: 'clk06', text: 'I often forget to put things back in their proper place.', keyed: '-' },
        { id: 'clk07', text: 'I like order.', keyed: '+' },
        { id: 'clk08', text: 'I shirk my duties.', keyed: '-' },
        { id: 'clk09', text: 'I follow a schedule.', keyed: '+' },
        { id: 'clk10', text: 'I am exacting in my work.', keyed: '+' }
      ],
      bands: {
        low: {
          title: 'The clock left to wander',
          text:
            'You keep time by instinct rather than by pendulum. Spontaneity is your familiar; the unmade plan leaves room for the unexpected guest. A list or two, kept somewhere you will actually find it, may spare you the odd midnight scramble.'
        },
        mid: {
          title: 'A clock wound most Sundays',
          text:
            'Order where it matters, a little dust where it does not. You can keep a schedule when the stakes are high and loosen your collar when they are not \u2014 a sensible accommodation with the tyranny of the hour.'
        },
        high: {
          title: 'Precision in brass and oil',
          text:
            'Every cog oiled, every drawer labelled, every promise kept to the minute. Reliability is your heraldry. Remember that even the finest clockwork is permitted to stop, now and then, for a cup of tea.'
        }
      }
    },
    {
      id: 'ballroom',
      numeral: 'III',
      name: 'The Ballroom',
      trait: 'Extraversion',
      ipipFactor: 'Extraversion (Factor I)',
      invitation:
        'The chandeliers are lit and the quartet is tuning. Do you sweep onto the floor, or watch from the velvet alcove with a glass of something dark?',
      items: [
        { id: 'bal01', text: 'I am the life of the party.', keyed: '+' },
        { id: 'bal02', text: 'I don\u2019t talk a lot.', keyed: '-' },
        { id: 'bal03', text: 'I feel comfortable around people.', keyed: '+' },
        { id: 'bal04', text: 'I keep in the background.', keyed: '-' },
        { id: 'bal05', text: 'I start conversations.', keyed: '+' },
        { id: 'bal06', text: 'I have little to say.', keyed: '-' },
        { id: 'bal07', text: 'I talk to a lot of different people at parties.', keyed: '+' },
        { id: 'bal08', text: 'I don\u2019t like to draw attention to myself.', keyed: '-' },
        { id: 'bal09', text: 'I don\u2019t mind being the centre of attention.', keyed: '+' },
        { id: 'bal10', text: 'I am quiet around strangers.', keyed: '-' }
      ],
      bands: {
        low: {
          title: 'The velvet alcove',
          text:
            'You draw your warmth from smaller fires \u2014 a close friend, a long letter, an evening of your own company. The ballroom can keep its din; you notice what the dancers miss.'
        },
        mid: {
          title: 'One dance, then the balcony',
          text:
            'You can work a room when the occasion calls for it, and slip out to the moonlit balcony when it does not. Sociable by choice rather than compulsion \u2014 the most adaptable guest at any masque.'
        },
        high: {
          title: 'First onto the floor',
          text:
            'The chandeliers seem to brighten when you arrive. Conversation, company and a crowded room are meat and drink to you. Leave a little silence in the evening, too; some of the best confessions are whispered.'
        }
      }
    },
    {
      id: 'hearth',
      numeral: 'IV',
      name: 'The Hearth',
      trait: 'Agreeableness',
      ipipFactor: 'Agreeableness (Factor II)',
      invitation:
        'A stranger knocks on a stormy night. Do you throw open the door and stoke the fire, or peer through the keyhole and keep your counsel?',
      items: [
        { id: 'hea01', text: 'I feel little concern for others.', keyed: '-' },
        { id: 'hea02', text: 'I am interested in people.', keyed: '+' },
        { id: 'hea03', text: 'I insult people.', keyed: '-' },
        { id: 'hea04', text: 'I sympathise with others\u2019 feelings.', keyed: '+' },
        { id: 'hea05', text: 'I am not interested in other people\u2019s problems.', keyed: '-' },
        { id: 'hea06', text: 'I have a soft heart.', keyed: '+' },
        { id: 'hea07', text: 'I am not really interested in others.', keyed: '-' },
        { id: 'hea08', text: 'I take time out for others.', keyed: '+' },
        { id: 'hea09', text: 'I feel others\u2019 emotions.', keyed: '+' },
        { id: 'hea10', text: 'I make people feel at ease.', keyed: '+' }
      ],
      bands: {
        low: {
          title: 'A guarded threshold',
          text:
            'You keep the bolt drawn until a visitor has earned the fire. Candour comes more easily to you than comfort, and you are rarely taken in by a sob story. Plain-spoken folk are worth their weight in candle wax.'
        },
        mid: {
          title: 'The fire banked, not out',
          text:
            'Generous when it is deserved, firm when it is not. You can sit with another\u2019s sorrow without drowning in it, and say no without slamming the door \u2014 a well-tended hearth.'
        },
        high: {
          title: 'A hearth for every wanderer',
          text:
            'Strays, strangers and the storm-tossed all find a chair by your fire. Your warmth is real and others feel it. Keep a log or two back for yourself; a hearth that warms everyone else can forget its own chill.'
        }
      }
    },
    {
      id: 'pool',
      numeral: 'V',
      name: 'The Still Pool',
      trait: 'Emotional Steadiness',
      ipipFactor: 'Emotional Stability (Factor IV)',
      invitation:
        'In the walled garden lies a dark pool. When the wind rises, does its surface shiver and churn, or does it hold the moon perfectly still?',
      items: [
        { id: 'poo01', text: 'I get stressed out easily.', keyed: '-' },
        { id: 'poo02', text: 'I am relaxed most of the time.', keyed: '+' },
        { id: 'poo03', text: 'I worry about things.', keyed: '-' },
        { id: 'poo04', text: 'I seldom feel blue.', keyed: '+' },
        { id: 'poo05', text: 'I am easily disturbed.', keyed: '-' },
        { id: 'poo06', text: 'I get upset easily.', keyed: '-' },
        { id: 'poo07', text: 'I change my mood a lot.', keyed: '-' },
        { id: 'poo08', text: 'I have frequent mood swings.', keyed: '-' },
        { id: 'poo09', text: 'I get irritated easily.', keyed: '-' },
        { id: 'poo10', text: 'I often feel blue.', keyed: '-' }
      ],
      bands: {
        low: {
          title: 'Wind across the water',
          text:
            'Your pool answers every breeze \u2014 you feel the weather of a day keenly, and it shows on the surface. That sensitivity is also a kind of perception. Sheltered corners, trusted company and a good night\u2019s rest help the ripples settle.'
        },
        mid: {
          title: 'Ripples that settle',
          text:
            'A gust will stir you, and then the water stills again. You feel things without being carried off by them, which is about as much as any of us can ask of a pond in an Irish climate.'
        },
        high: {
          title: 'The moon held perfectly',
          text:
            'Storms pass over and your surface barely trembles. Others may find your calm a sanctuary. Do let the odd ripple show \u2014 still waters are admired, but they are not always understood.'
        }
      }
    }
  ];

  return { LIKERT: LIKERT, BAND_NAMES: BAND_NAMES, REALMS: REALMS };
});
