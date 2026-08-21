// ============================================================
// PadelIndex — Quiz content (English)
// ============================================================
// English translation of de.ts. Same ids, same difficulty/correctOptionId
// values and relatedGuideSlugs — only text differs. Keep in sync with
// de.ts and es.ts; quiz-data.test.ts checks this automatically.

import type { QuizDifficulty, QuizQuestion, QuizResultTier } from '../../quiz';

export const QUIZ_DIFFICULTIES_EN: QuizDifficulty[] = [
	{
		slug: 'anfaenger',
		label: 'Beginner',
		description: 'Basic rules, scoring, serve, glass and simple game situations.',
		color: '#16A394',
		metaTitle: 'Padel Quiz for Beginners: Do You Know the Most Important Rules?',
		metaDescription:
			'Test your knowledge of padel rules, serving, scoring, the glass and simple game situations.',
		recommendedGuideSlugs: ['padel-regeln', 'padel-fuer-anfaenger', 'padel-ausruestung']
	},
	{
		slug: 'fortgeschritten',
		label: 'Advanced',
		description:
			'Tactical decisions, the bandeja, the lob, the volley, positioning and doubles communication.',
		color: '#0F6E5C',
		metaTitle: 'Padel Quiz for Advanced Players: Technique, Tactics and Game Situations',
		metaDescription:
			'Test your padel knowledge on the bandeja, the lob, the volley, doubles tactics, positioning and the glass.',
		recommendedGuideSlugs: ['padel-technik', 'padel-taktik', 'padel-doppel']
	},
	{
		slug: 'experte',
		label: 'Expert',
		description:
			'Complex rule situations, match strategy, shot selection under pressure, angles, pace and risk.',
		color: '#0B1E26',
		metaTitle: 'Padel Expert Quiz: Tactics, Strategy and Complex Game Situations',
		metaDescription:
			'The hard padel quiz for experienced players: match strategy, shot selection, risk and tactical decisions.',
		recommendedGuideSlugs: ['padel-taktik', 'padel-training', 'padel-doppel']
	}
];

export const QUIZ_RESULT_TIERS_EN: QuizResultTier[] = [
	{
		minPercentage: 0,
		maxPercentage: 39,
		title: 'Still room to grow',
		text: "You don't yet know the basics with confidence. Start with the most important rules and simple game situations."
	},
	{
		minPercentage: 40,
		maxPercentage: 69,
		title: 'Solid foundation',
		text: 'You already have a good basic understanding. With a bit more rules knowledge and tactics, you will quickly gain confidence.'
	},
	{
		minPercentage: 70,
		maxPercentage: 89,
		title: 'Strong padel knowledge',
		text: 'You already understand many important situations well. Now the next step in technique and match tactics is worth it.'
	},
	{
		minPercentage: 90,
		maxPercentage: 100,
		title: 'Padel expert',
		text: 'Very strong! You know your way around rules, tactics and game situations really well.'
	}
];

export const QUIZ_QUESTIONS_EN: QuizQuestion[] = [
	// ------------------------------------------------------------
	// BEGINNER
	// ------------------------------------------------------------
	{
		id: 'anfaenger-1',
		difficulty: 'anfaenger',
		question: 'What is padel mainly?',
		options: [
			{ id: 'A', text: 'A singles sport without walls' },
			{
				id: 'B',
				text: 'A racket sport usually played as doubles on a court with glass walls'
			},
			{ id: 'C', text: 'A variant of squash without a net' },
			{ id: 'D', text: 'Pure fitness training' }
		],
		correctOptionId: 'B',
		explanation:
			'Padel is a racket sport usually played as doubles. Characteristic features are the smaller court, the net and the glass walls.',
		relatedGuideSlugs: ['padel-regeln']
	},
	{
		id: 'anfaenger-2',
		difficulty: 'anfaenger',
		question: 'How is padel usually scored?',
		options: [
			{ id: 'A', text: '1, 2, 3, 4' },
			{ id: 'B', text: '0, 1, 2, 3' },
			{ id: 'C', text: '15, 30, 40, game' },
			{ id: 'D', text: 'Every ball counts as a set' }
		],
		correctOptionId: 'C',
		explanation: 'The scoring is similar to tennis: 15, 30, 40 and game.',
		relatedGuideSlugs: ['padel-regeln']
	},
	{
		id: 'anfaenger-3',
		difficulty: 'anfaenger',
		question: 'How must the serve be executed in padel?',
		options: [
			{ id: 'A', text: 'From above head height' },
			{ id: 'B', text: 'From below, after the ball has bounced once on the ground' },
			{ id: 'C', text: 'Directly out of the air as a volley' },
			{ id: 'D', text: 'With both hands' }
		],
		correctOptionId: 'B',
		explanation: 'The serve is hit underarm. The ball must bounce on the ground first.',
		relatedGuideSlugs: ['padel-regeln']
	},
	{
		id: 'anfaenger-4',
		difficulty: 'anfaenger',
		question: 'May the ball touch the glass wall after bouncing?',
		options: [
			{ id: 'A', text: 'Yes, that is a central part of the game' },
			{ id: 'B', text: 'No, the point is lost immediately' },
			{ id: 'C', text: 'Only on the serve' },
			{ id: 'D', text: 'Only if both teams agree' }
		],
		correctOptionId: 'A',
		explanation: 'After touching the ground, the ball may touch the glass wall and stay in play.',
		relatedGuideSlugs: ['padel-regeln']
	},
	{
		id: 'anfaenger-5',
		difficulty: 'anfaenger',
		question: 'How many players are usually on the court in a padel match?',
		options: [
			{ id: 'A', text: '2' },
			{ id: 'B', text: '3' },
			{ id: 'C', text: '4' },
			{ id: 'D', text: '6' }
		],
		correctOptionId: 'C',
		explanation: 'Padel is mostly played as doubles, so with four players.',
		relatedGuideSlugs: ['padel-doppel']
	},
	{
		id: 'anfaenger-6',
		difficulty: 'anfaenger',
		question: 'What is a lob?',
		options: [
			{ id: 'A', text: 'A short ball right behind the net' },
			{ id: 'B', text: 'A high ball hit over the opponents' },
			{ id: 'C', text: 'A serving fault' },
			{ id: 'D', text: 'A shot into your own glass' }
		],
		correctOptionId: 'B',
		explanation: 'A lob is a high ball meant to push the opponents back off the net.',
		relatedGuideSlugs: ['padel-begriffe', 'padel-technik']
	},
	{
		id: 'anfaenger-7',
		difficulty: 'anfaenger',
		question:
			"What happens if the ball is hit directly against the opponent's glass wall without bouncing on the ground first?",
		options: [
			{ id: 'A', text: 'The ball is good' },
			{ id: 'B', text: 'The ball is out' },
			{ id: 'C', text: 'The point must be replayed' },
			{ id: 'D', text: 'The opponent gets two points' }
		],
		correctOptionId: 'B',
		explanation:
			"The ball must first bounce in the opponent's court. If it hits the opponent's glass wall directly, it is out.",
		relatedGuideSlugs: ['padel-regeln']
	},
	{
		id: 'anfaenger-8',
		difficulty: 'anfaenger',
		question: 'What is especially important for beginners?',
		options: [
			{ id: 'A', text: 'Always hit as hard as possible' },
			{ id: 'B', text: 'Play every ball as a smash' },
			{ id: 'C', text: 'Keep the ball in play with control' },
			{ id: 'D', text: 'Never talk to your partner' }
		],
		correctOptionId: 'C',
		explanation: 'Control and consistency matter more for beginners than pure power.',
		relatedGuideSlugs: ['padel-fuer-anfaenger']
	},
	{
		id: 'anfaenger-9',
		difficulty: 'anfaenger',
		question: 'What equipment do you need at a minimum?',
		options: [
			{ id: 'A', text: 'A padel racket, suitable shoes and balls' },
			{ id: 'B', text: 'A tennis racket and football boots' },
			{ id: 'C', text: 'A squash racket and a helmet' },
			{ id: 'D', text: 'Only gloves' }
		],
		correctOptionId: 'A',
		explanation: 'For padel you need a padel racket, suitable shoes and padel balls.',
		relatedGuideSlugs: ['padel-ausruestung']
	},
	{
		id: 'anfaenger-10',
		difficulty: 'anfaenger',
		question: 'What is a common beginner mistake?',
		options: [
			{ id: 'A', text: 'Too much communication with your partner' },
			{ id: 'B', text: 'Playing too controlled' },
			{ id: 'C', text: 'Standing too close to the net on the return' },
			{ id: 'D', text: 'Wanting to hit every ball too hard' }
		],
		correctOptionId: 'D',
		explanation:
			'Many beginners try to hit hard too often. In padel, placement, patience and control are usually more important.',
		relatedGuideSlugs: ['padel-fuer-anfaenger', 'padel-taktik']
	},

	// ------------------------------------------------------------
	// ADVANCED
	// ------------------------------------------------------------
	{
		id: 'fortgeschritten-1',
		difficulty: 'fortgeschritten',
		question: 'Why is the lob tactically so important in padel?',
		options: [
			{ id: 'A', text: 'It automatically ends the point' },
			{ id: 'B', text: 'It helps push the opponents off the net' },
			{ id: 'C', text: 'It counts double' },
			{ id: 'D', text: 'Only professionals are allowed to play it' }
		],
		correctOptionId: 'B',
		explanation:
			'A good lob can push the opponents back off the net and let you take up a better position yourself.',
		relatedGuideSlugs: ['padel-taktik']
	},
	{
		id: 'fortgeschritten-2',
		difficulty: 'fortgeschritten',
		question: 'What is the main goal of a bandeja?',
		options: [
			{ id: 'A', text: 'Always winning the point immediately' },
			{ id: 'B', text: 'Keeping the ball low with control and holding the net position' },
			{ id: 'C', text: 'Deliberately hitting the ball out' },
			{ id: 'D', text: 'Replacing the serve' }
		],
		correctOptionId: 'B',
		explanation:
			'The bandeja is a controlled overhead shot used to apply pressure while keeping the net position at the same time.',
		relatedGuideSlugs: ['padel-technik']
	},
	{
		id: 'fortgeschritten-3',
		difficulty: 'fortgeschritten',
		question: 'When is a volley especially useful?',
		options: [
			{ id: 'A', text: 'When you are at the net and can take the ball early' },
			{ id: 'B', text: 'When the ball is behind your own baseline' },
			{ id: 'C', text: 'Only on the serve' },
			{ id: 'D', text: 'Never, volleys are forbidden in padel' }
		],
		correctOptionId: 'A',
		explanation: 'Volleys are usually played at the net to take the ball early and build pressure.',
		relatedGuideSlugs: ['padel-technik']
	},
	{
		id: 'fortgeschritten-4',
		difficulty: 'fortgeschritten',
		question: 'Which position is often advantageous in padel?',
		options: [
			{ id: 'A', text: 'Both players permanently far back' },
			{ id: 'B', text: 'Both players at the net with control, when they can apply pressure' },
			{ id: 'C', text: 'One player sits outside the court' },
			{ id: 'D', text: 'Both players stand directly next to each other in the middle' }
		],
		correctOptionId: 'B',
		explanation:
			'The net is often a strong position in padel, because you can build pressure from there.',
		relatedGuideSlugs: ['padel-taktik']
	},
	{
		id: 'fortgeschritten-5',
		difficulty: 'fortgeschritten',
		question: 'What matters for communication in doubles?',
		options: [
			{ id: 'A', text: 'Talking as little as possible' },
			{ id: 'B', text: 'Only talking after the match' },
			{ id: 'C', text: 'Clear calls like "mine", "yours", "out" or "lob"' },
			{ id: 'D', text: 'Confusing your partner during the rally' }
		],
		correctOptionId: 'C',
		explanation: 'Short, clear calls help avoid misunderstandings.',
		relatedGuideSlugs: ['padel-doppel']
	},
	{
		id: 'fortgeschritten-6',
		difficulty: 'fortgeschritten',
		question: 'What is a chiquita?',
		options: [
			{ id: 'A', text: 'A very hard smash' },
			{ id: 'B', text: "A controlled, low ball aimed at the opponents' feet at the net" },
			{ id: 'C', text: 'A kind of serve from above' },
			{ id: 'D', text: 'A rally without the glass' }
		],
		correctOptionId: 'B',
		explanation:
			"The chiquita is a tactical ball played low at the opponents' feet to make their volley harder.",
		relatedGuideSlugs: ['padel-begriffe']
	},
	{
		id: 'fortgeschritten-7',
		difficulty: 'fortgeschritten',
		question: 'When should you deliberately use the glass?',
		options: [
			{
				id: 'A',
				text: 'When the direct shot is difficult and the ball becomes easier to play after the wall'
			},
			{ id: 'B', text: 'Only on the serve' },
			{ id: 'C', text: 'Never, touching the glass is forbidden' },
			{ id: 'D', text: 'Only if the opponent allows it' }
		],
		correctOptionId: 'A',
		explanation: 'The glass can help you gain more time and play the ball with more control.',
		relatedGuideSlugs: ['padel-taktik']
	},
	{
		id: 'fortgeschritten-8',
		difficulty: 'fortgeschritten',
		question: 'What is a tactical mistake at the net?',
		options: [
			{ id: 'A', text: 'Taking the ball early' },
			{ id: 'B', text: 'Putting the opponent under pressure' },
			{ id: 'C', text: 'Leaving too big a gap between the partners' },
			{ id: 'D', text: 'Placing the ball with control' }
		],
		correctOptionId: 'C',
		explanation:
			'Big gaps between the partners open up easy attacking opportunities for the opponents.',
		relatedGuideSlugs: ['padel-doppel']
	},
	{
		id: 'fortgeschritten-9',
		difficulty: 'fortgeschritten',
		question: 'Why should you not smash every high ball?',
		options: [
			{ id: 'A', text: 'Because smashes are never allowed' },
			{ id: 'B', text: 'Because a bad smash can give the opponent a good chance to counter' },
			{ id: 'C', text: 'Because high balls are automatically out' },
			{ id: 'D', text: 'Because the point would otherwise be replayed' }
		],
		correctOptionId: 'B',
		explanation: 'An unplaced or too weak a smash can easily be defended or countered.',
		relatedGuideSlugs: ['padel-technik', 'padel-taktik']
	},
	{
		id: 'fortgeschritten-10',
		difficulty: 'fortgeschritten',
		question: 'What matters especially on the return?',
		options: [
			{ id: 'A', text: 'Hit as hard as possible immediately' },
			{ id: 'B', text: 'Get the ball safely into play and place it as deep as possible' },
			{ id: 'C', text: 'Hit the ball directly into your own wall' },
			{ id: 'D', text: 'Deliberately hit the net' }
		],
		correctOptionId: 'B',
		explanation: 'A safe, deep return prevents easy attacks from the serving team.',
		relatedGuideSlugs: ['padel-taktik']
	},

	// ------------------------------------------------------------
	// EXPERT
	// ------------------------------------------------------------
	{
		id: 'experte-1',
		difficulty: 'experte',
		question:
			'You are at the net, the opponent plays a very good lob over your backhand side. What is often the best decision?',
		options: [
			{ id: 'A', text: 'Sprint backwards and smash blindly' },
			{ id: 'B', text: 'Bring the ball back with control via a bandeja or a defensive shot' },
			{ id: 'C', text: 'Deliberately let the ball pass' },
			{ id: 'D', text: 'Ignore your partner' }
		],
		correctOptionId: 'B',
		explanation:
			'Under pressure, control matters more than risk. A defensive bandeja or a controlled retreat is often better than a forced smash.',
		relatedGuideSlugs: ['padel-taktik', 'padel-technik']
	},
	{
		id: 'experte-2',
		difficulty: 'experte',
		question: 'Why is changing pace important in high-level padel?',
		options: [
			{ id: 'A', text: 'So the rally becomes random' },
			{ id: 'B', text: "To disrupt the opponents' rhythm, positioning and reaction time" },
			{ id: 'C', text: 'Because hard balls always win' },
			{ id: 'D', text: 'Because slow balls are forbidden' }
		],
		correctOptionId: 'B',
		explanation: 'Changing pace, height and placement makes the game harder to read.',
		relatedGuideSlugs: ['padel-taktik']
	},
	{
		id: 'experte-3',
		difficulty: 'experte',
		question: 'When is a hard smash strategically risky?',
		options: [
			{
				id: 'A',
				text: 'When it is not placed and the opponent can counter it off the glass or mesh'
			},
			{ id: 'B', text: 'When you want to win the point' },
			{ id: 'C', text: 'When the ball is high' },
			{ id: 'D', text: 'Always on the first game of the set' }
		],
		correctOptionId: 'A',
		explanation: 'An inaccurate smash can come back and weaken your own position.',
		relatedGuideSlugs: ['padel-technik']
	},
	{
		id: 'experte-4',
		difficulty: 'experte',
		question: 'What is a useful goal for a chiquita at a high level?',
		options: [
			{ id: 'A', text: 'Forcing the opponent into a difficult low volley' },
			{ id: 'B', text: 'Playing the ball as high as possible off the back wall' },
			{ id: 'C', text: 'Giving the ball away deliberately' },
			{ id: 'D', text: 'Replacing the serve' }
		],
		correctOptionId: 'A',
		explanation:
			'A good chiquita forces the opponent into a low, uncomfortable volley and can help you win the net.',
		relatedGuideSlugs: ['padel-begriffe', 'padel-taktik']
	},
	{
		id: 'experte-5',
		difficulty: 'experte',
		question:
			'Which decision is often sensible when your own team is putting pressure on at the net?',
		options: [
			{ id: 'A', text: 'Only rely on maximum power' },
			{
				id: 'B',
				text: 'Open up angles, play at the feet, or look for gaps between the opponents'
			},
			{ id: 'C', text: 'Break off the rally' },
			{ id: 'D', text: 'Always play into the middle of your own half' }
		],
		correctOptionId: 'B',
		explanation:
			'At the net, placement, angles and pressure on the feet are often more effective than pure power.',
		relatedGuideSlugs: ['padel-taktik']
	},
	{
		id: 'experte-6',
		difficulty: 'experte',
		question: 'Why is the middle between the opponents often a good target?',
		options: [
			{ id: 'A', text: 'Because nobody ever stands there' },
			{ id: 'B', text: 'Because responsibilities can become unclear and it reduces angles' },
			{ id: 'C', text: 'Because the ball counts double there' },
			{ id: 'D', text: 'Because you are only allowed to play there' }
		],
		correctOptionId: 'B',
		explanation:
			'The middle can test communication and responsibility, and it often takes angles away from the opponents.',
		relatedGuideSlugs: ['padel-doppel', 'padel-taktik']
	},
	{
		id: 'experte-7',
		difficulty: 'experte',
		question:
			'You are defending deep and the opponents are standing very close to the net. Which option is often sensible?',
		options: [
			{ id: 'A', text: 'A controlled lob over both opponents' },
			{ id: 'B', text: 'A slow ball into your own net' },
			{ id: 'C', text: 'A smash from a defensive position' },
			{ id: 'D', text: "A ball hit directly at the opponent's glass wall without a bounce" }
		],
		correctOptionId: 'A',
		explanation: 'A good lob can win back the net and take pressure off the situation.',
		relatedGuideSlugs: ['padel-taktik']
	},
	{
		id: 'experte-8',
		difficulty: 'experte',
		question: 'What characterizes good pair tactics?',
		options: [
			{ id: 'A', text: 'Both players make decisions independently of each other' },
			{ id: 'B', text: 'Shared movement, clear roles and coordinated risk-taking' },
			{ id: 'C', text: 'Only the stronger player plays every ball' },
			{ id: 'D', text: 'As much distance as possible between the players' }
		],
		correctOptionId: 'B',
		explanation: 'Successful pairs move in a coordinated way and make tactical decisions together.',
		relatedGuideSlugs: ['padel-doppel']
	},
	{
		id: 'experte-9',
		difficulty: 'experte',
		question: 'When can a slow ball be more effective than a hard ball?',
		options: [
			{
				id: 'A',
				text: 'When it forces the opponent into a low contact point or an awkward movement'
			},
			{ id: 'B', text: 'Never' },
			{ id: 'C', text: 'Only while warming up' },
			{ id: 'D', text: 'Only on match point' }
		],
		correctOptionId: 'A',
		explanation: 'A slow, well-placed ball can break rhythm and provoke mistakes.',
		relatedGuideSlugs: ['padel-taktik']
	},
	{
		id: 'experte-10',
		difficulty: 'experte',
		question: 'What is a sign of tactical maturity in padel?',
		options: [
			{ id: 'A', text: 'Playing every ball with maximum risk' },
			{ id: 'B', text: 'Consciously choosing between risk, control, placement and position' },
			{ id: 'C', text: 'Never playing lobs' },
			{ id: 'D', text: 'Only wanting to win points through power' }
		],
		correctOptionId: 'B',
		explanation:
			'Good players choose between safety, pressure and risk depending on the situation.',
		relatedGuideSlugs: ['padel-taktik', 'padel-training']
	}
];
