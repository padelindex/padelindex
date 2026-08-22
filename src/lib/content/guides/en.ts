// ============================================================
// PadelIndex — Guide content (English)
// ============================================================
// English translation of de.ts. Same slugs, same section IDs, same
// category/difficulty values — only text differs. Keep structure in
// sync with de.ts and es.ts; guides.test.ts checks this automatically.

import type { GuideArticle } from '../../guides';

export const GUIDES_EN: GuideArticle[] = [
	// ------------------------------------------------------------
	// RULES & KNOWLEDGE
	// ------------------------------------------------------------
	{
		slug: 'padel-regeln',
		title: 'Padel Rules Explained: The Complete Guide for Beginners',
		metaTitle: 'Padel Rules Explained: The Complete Guide for Beginners',
		metaDescription:
			'The most important padel rules explained clearly: serve, scoring, glass, walls, net, faults and typical match situations.',
		excerpt:
			'Serve, scoring, glass and out-of-bounds rules — everything you need to know before your first match, explained simply.',
		category: 'regeln',
		difficulty: 'einsteiger',
		readingTime: 9,
		updatedAt: '2026-08-01',
		popular: true,
		beginnerRecommended: true,
		relatedSlugs: ['padel-begriffe', 'padel-fuer-anfaenger', 'padel-vs-tennis', 'padel-doppel'],
		sections: [
			{
				id: 'was-ist-padel',
				heading: 'What is padel?',
				paragraphs: [
					'Padel is a racket sport almost always played as doubles — two against two. It is played on an enclosed court that is considerably smaller than a tennis court, surrounded by glass walls and mesh fencing.',
					'The special thing about it: after bouncing, the ball may touch your own walls and still stays in play. This creates long, exciting rallies that are fun for beginners right away — raw power rarely decides a point; placement and patience matter more.',
					'You hit the ball with a solid, perforated racket that has no strings; the ball resembles a slightly less pressurized tennis ball. The net sits in the middle of the court, just like in tennis.'
				]
			},
			{
				id: 'spielfeld-und-grundprinzip',
				heading: 'Court and basic principle',
				paragraphs: [
					'A padel court is an enclosed rectangle: mostly glass walls along the baselines, mesh fencing or also glass along the sides. The net splits the court into two halves, and each half again has a left and right service box, similar to tennis.',
					'The court is noticeably more compact than a tennis court. That means short distances, lots of ball contact, and makes padel physically accessible even for complete newcomers.',
					'Basic principle: you hit the ball back and forth over the net as in tennis, until it bounces twice or a fault occurs — except the walls are allowed to actively join in.'
				]
			},
			{
				id: 'zaehlweise',
				heading: 'Scoring in padel',
				paragraphs: [
					'The scoring is the one known from tennis: 15, 30, 40 and game. At 40-40 it is called deuce — after that a team must win two points in a row to take the game (some casual groups instead play a "golden point", a single deciding point — that is a matter of agreement, not a fixed rule).',
					'Several games won make a set, several sets make a match — usually played to two winning sets. To win a set, a team generally needs six games with a lead of at least two games; a tiebreak often decides if the score is level.'
				]
			},
			{
				id: 'aufschlag-regeln',
				heading: 'Serving rules',
				paragraphs: [
					'The serve is hit underarm: the ball must first bounce on the ground, and only then do you hit it — unlike tennis, where the serve is hit overhead. The contact point may not be higher than hip height.',
					"The serve goes diagonally into the opponent's service box, and one foot must stay behind the service line. After every game won, the serve passes to the other team; within a team, partners usually alternate serving.",
					'As in tennis, there is a second attempt if the first serve is a fault (a double fault costs the point).'
				]
			},
			{
				id: 'aus',
				heading: 'When is the ball out?',
				paragraphs: [
					'The ball is out if it touches the ground outside the court boundary, or if it touches the glass wall or the mesh fencing before bouncing in the opposing court.',
					'A ball that leaves the court over the surrounding fencing without first bouncing correctly inside the court also counts as a fault. As a general rule: the ball must first bounce inside the correct court — after that it may bounce off the walls (on your own side) as often as it likes, as long as it stays in play.'
				]
			},
			{
				id: 'glas-und-waende',
				heading: 'Glass, mesh and walls explained',
				paragraphs: [
					'This is the point that confuses padel beginners the most at first: after the ball has bounced on the ground, it may touch your own wall or your own mesh fencing and stays in play — you can still hit it back.',
					"The reverse is also true: if you hit the ball directly into the opponent's wall before it has bounced in the opponent's court, that is a fault. So the wall is not a substitute for the ground contact — it only comes into play afterwards.",
					'With a bit of practice, playing off the glass becomes one of the most exciting parts of padel — it opens up return options that simply do not exist in tennis.'
				]
			},
			{
				id: 'netzspiel-volleys',
				heading: 'Net play and volleys',
				paragraphs: [
					'Volleys (hitting the ball out of the air before it touches the ground) are generally allowed and are actually a central tactical building block in padel — standing at the net and taking balls early is often the strongest position.',
					'One important exception: on the serve, the return may not be played as a volley while the ball is still inside the service box — the exact detail rules vary slightly by federation, so when in doubt, check the rules of the relevant federation or ask at your club.'
				]
			},
			{
				id: 'anfaengerfehler',
				heading: 'Typical beginner mistakes',
				box: {
					kind: 'mistakes',
					title: 'You will see these mistakes in almost every beginner match',
					items: [
						'Hitting the ball as hard as possible at every opportunity instead of placing it with control.',
						'Thinking about the wall before the ball has bounced — it must bounce in the court first.',
						'Standing too far back even though the net would be the stronger position.',
						'Trying to serve overhead like in tennis instead of underarm after the bounce.',
						'Not talking to your partner, which leaves balls in the middle unplayed or chased by both of you.'
					]
				}
			},
			{
				id: 'checkliste',
				heading: 'Quick rules checklist',
				box: {
					kind: 'checklist',
					title: 'Before your first match',
					items: [
						"Serve underarm, after the bounce, diagonally into the opponent's box.",
						'The ball must bounce in the court first before it may touch a wall or the mesh.',
						'Scoring like tennis: 15, 30, 40, game — deuce at 40-40.',
						'Direct wall contact before the ground bounce is a fault.',
						'Volleys are allowed (except partly on the return right after the serve).'
					]
				}
			}
		],
		faq: [
			{
				question: 'Is padel hard to learn?',
				answer:
					'The basic rules can be understood within a few minutes, and the first rallies usually work out within the first hour. Playing the glass well and finer tactics need a bit more practice — typical for a sport with a low entry barrier but a lot of depth further up.'
			},
			{
				question: 'Do I need to know how to play tennis to play padel?',
				answer:
					'No. Padel has its own basic technique and is deliberately designed to be accessible. Tennis experience can help with ball feel and stroke technique, but it is not a requirement.'
			},
			{
				question: 'How many sets are played in padel?',
				answer:
					'In tournaments, usually best of three sets; in casual play, many groups agree on a single set or a time limit instead — that is common practice among casual players, not a fixed rule.'
			},
			{
				question: 'What happens if the ball hits the roof of an indoor hall?',
				answer:
					'In halls with a roof, different additional rules apply depending on the venue and federation. It is best to check briefly with the operator or club beforehand if this is not clearly signposted.'
			}
		]
	},
	{
		slug: 'padel-vs-tennis',
		title: 'Padel vs. Tennis: The Key Differences Explained Simply',
		metaTitle: 'Padel vs. Tennis: The Key Differences Explained Simply',
		metaDescription:
			'Padel and tennis compared: court, rackets, rules, technique, tactics, getting started and cost.',
		excerpt:
			'What padel and tennis have in common — and where they differ in court, rackets, rules and tactics.',
		category: 'regeln',
		difficulty: 'einsteiger',
		readingTime: 8,
		updatedAt: '2026-08-01',
		popular: true,
		relatedSlugs: ['padel-regeln', 'padel-fuer-anfaenger', 'padel-schlaeger', 'padel-begriffe'],
		sections: [
			{
				id: 'gemeinsamkeiten',
				heading: 'Similarities',
				paragraphs: [
					'Both sports are racket games with a net, similar scoring (15, 30, 40, game) and the goal of placing the ball so the opponent can no longer reach it.',
					'Anyone who has played tennis before brings a good basic feel for ball flight, timing and positioning — that noticeably helps when starting padel, even though the technique differs in the details.'
				]
			},
			{
				id: 'spielfeld',
				heading: 'Differences in the court',
				paragraphs: [
					'A padel court is considerably smaller than a tennis court and completely enclosed: glass walls and mesh fencing instead of open space. These walls are an active part of the game, not just a boundary.',
					'Padel is practically always played as doubles, while tennis is played both as singles and doubles about equally often.'
				]
			},
			{
				id: 'schlaeger-baelle',
				heading: 'Differences in rackets and balls',
				paragraphs: [
					'Padel rackets are shorter, have no strings, and instead have a solid, perforated surface made of carbon or fiberglass composite materials with a foam core. Tennis rackets have a longer handle and a strung, oval head.',
					'Padel balls resemble tennis balls but usually have somewhat less internal pressure, to suit the smaller court and the walls.'
				]
			},
			{
				id: 'aufschlag-regeln-vergleich',
				heading: 'Serve and rules',
				paragraphs: [
					'In tennis, the serve is hit overhead; in padel, it is hit underarm after the bounce. The biggest structural innovation in padel is the wall: after the ground bounce, the ball may touch the wall on your own side and stays in play — something tennis does not have.'
				]
			},
			{
				id: 'tempo-taktik',
				heading: 'Pace of play and tactics',
				paragraphs: [
					'Padel relies heavily on net play: because the court is smaller and the walls enable long rallies, positioning at the net is often more decisive than sheer power of the shot. In tennis, baseline duels, serve power and larger running distances play a bigger role.',
					'That makes padel feel more accessible to many beginners: even with moderate athleticism, you can play long, smart rallies.'
				]
			},
			{
				id: 'einstieg-tennisspieler',
				heading: 'Getting started as a tennis player',
				paragraphs: [
					'Tennis players mainly need to unlearn two things: serving underarm and consciously using the walls instead of avoiding every ball heading towards one. The forehand and backhand basics, on the other hand, usually transfer well.',
					'A common early mistake for switchers: hitting reflexively hard, as they are used to from tennis — in padel, because of the walls, that often just sets up an easy ball for the opponent instead.'
				]
			},
			{
				id: 'was-ist-einfacher',
				heading: 'Which is easier to learn?',
				paragraphs: [
					'For complete beginners, padel is generally considered more accessible: a smaller court, shorter running distances, forgiving walls, and a doubles format where you share the space with a partner. Tennis requires more precise stroke technique earlier on, just to keep the ball reliably inside the larger court.',
					'That does not mean padel is "easier" in the sense of less demanding — at a higher level, the tactical depth is considerable. But getting started generally happens faster.'
				]
			}
		],
		faq: [
			{
				question: 'Can I play padel well right away if I have tennis experience?',
				answer:
					'You bring a good basic feel, but you will need to get used to the serve and wall play again. The first few sessions feel unfamiliar to many tennis players before it clicks.'
			},
			{
				question: 'Do I need the same shoes for padel as for tennis?',
				answer:
					'Not necessarily — padel shoes are optimized for the quick, short direction changes on the smaller court. More on that in the guide to padel shoes.'
			},
			{
				question: 'Did padel originate from tennis courts converted for the purpose?',
				answer:
					'Padel has its own independent origin story and its own court dimensions. Some venues do convert tennis courts into padel courts, but that is a construction decision made by individual operators, not a rule of the sport.'
			}
		]
	},
	{
		slug: 'padel-begriffe',
		title: 'Padel Terms Explained: Bandeja, Vibora, Chiquita, Lob and More',
		metaTitle: 'Padel Terms Explained: Bandeja, Vibora, Chiquita, Lob and More',
		metaDescription:
			'The most important padel terms explained simply. Ideal for beginners who want to better understand padel rules, shots and tactics.',
		excerpt:
			'From bandeja to chiquita: the little padel dictionary for anyone who wants to keep up with court talk.',
		category: 'regeln',
		difficulty: 'einsteiger',
		readingTime: 7,
		updatedAt: '2026-08-01',
		beginnerRecommended: true,
		relatedSlugs: ['padel-technik', 'padel-taktik', 'padel-regeln', 'padel-doppel'],
		sections: [
			{
				id: 'grundbegriffe',
				heading: 'Basic terms',
				paragraphs: [
					'Court: the playing field, enclosed by glass walls and mesh fencing.',
					'Out: the ball has become invalid, the point goes to the other side.',
					'Golden point: at deuce, a single point decides instead of the two-point rule — a popular shortcut in casual play, not a fixed tournament requirement everywhere.'
				]
			},
			{
				id: 'schlagbegriffe',
				heading: 'Shot terms',
				paragraphs: [
					'Bandeja: a controlled overhead shot, usually played to hold the net position instead of ending the point immediately.',
					'Vibora: a variant of the bandeja with more sidespin, often even more aggressive in ball placement.',
					'Chiquita: a low, controlled ball played deep at the feet of the opponents standing at the net.',
					'Smash: the hard overhead shot, generally the point-winning shot par excellence — but only if it is well placed.',
					'Lob: a high ball hit over the opponents to push them back off the net.'
				]
			},
			{
				id: 'taktikbegriffe',
				heading: 'Tactical terms',
				paragraphs: [
					'Net position: usually the tactically strongest spot near the net, from which pressure is built.',
					"Return: the shot returning the opponent's serve.",
					'Winner: a shot the opponent can no longer reach at all — the point is won outright.'
				]
			},
			{
				id: 'spielfeldbegriffe',
				heading: 'Court terms',
				paragraphs: [
					'Baseline: the rear boundary line of the court, directly in front of the glass wall.',
					'Service box: the diagonal target box the serve must land in.',
					'Center line: divides each half of the court into a left and right service box.'
				]
			},
			{
				id: 'spanische-begriffe',
				heading: 'Common Spanish terms',
				paragraphs: [
					'Padel has Spanish and South American roots, which is why many technical terms come from Spanish and are used internationally unchanged — you hear them constantly even in English-speaking padel circles: "bandeja", "vibora" and "chiquita" are examples of that.'
				]
			},
			{
				id: 'glossar',
				heading: 'Mini glossary A–Z',
				box: {
					kind: 'info',
					title: 'The most important terms at a glance',
					items: [
						'Bandeja — controlled overhead shot to secure the net',
						"Chiquita — low ball aimed at the net players' feet",
						'Golden point — deciding single point at deuce',
						'Lob — high ball hit over the opponents',
						'Return — the shot returning the serve',
						'Smash — hard overhead shot',
						'Vibora — bandeja variant with more sidespin',
						'Winner — a point won outright'
					]
				}
			}
		],
		faq: [
			{
				question: 'Do I need to know all the technical terms to play padel?',
				answer:
					'No. The basic rules and a few shot names are enough to get started. But the terms help you follow training and tactics talk at the club better.'
			},
			{
				question: 'Why are so many padel terms Spanish?',
				answer:
					'Padel has its roots in the Spanish-speaking world, which is why many technical terms have become established internationally without translation.'
			}
		]
	},

	// ------------------------------------------------------------
	// EQUIPMENT
	// ------------------------------------------------------------
	{
		slug: 'padel-ausruestung',
		title: 'Padel Equipment: What You Really Need to Play',
		metaTitle: 'Padel Equipment: What You Really Need to Play',
		metaDescription:
			'Padel equipment for beginners and advanced players: rackets, shoes, balls, clothing and useful accessories explained simply.',
		excerpt: 'The basic kit for getting started — and what you can safely buy later.',
		category: 'ausruestung',
		difficulty: 'einsteiger',
		readingTime: 8,
		updatedAt: '2026-08-01',
		popular: true,
		beginnerRecommended: true,
		relatedSlugs: ['padel-schlaeger', 'padel-schuhe', 'padel-kosten', 'padel-fuer-anfaenger'],
		sections: [
			{
				id: 'grundausstattung',
				heading: 'Basic kit',
				paragraphs: [
					"To get started you basically need three things: a padel racket, suitable shoes and padel balls. Many venues lend rackets out for the first few times, so you don't have to invest right away.",
					'Everything else — special clothing, bags, grip tape — is nice to have, but not decisive for your first matches.'
				]
			},
			{
				id: 'padelschlaeger',
				heading: 'Padel rackets',
				paragraphs: [
					'The racket is the most important purchase. Beginners usually do well with a round or teardrop shape, which offers more control and a larger sweet spot. Details on shapes, weight and choosing a racket are in the dedicated guide to padel rackets.'
				]
			},
			{
				id: 'padelschuhe',
				heading: 'Padel shoes',
				paragraphs: [
					'Padel is played with lots of short sprints and quick changes of direction. Dedicated padel shoes offer matching grip and lateral stability for that — more on this in the guide to padel shoes. For your very first try, stable indoor sport or tennis shoes will usually do.'
				]
			},
			{
				id: 'padelbaelle',
				heading: 'Padel balls',
				paragraphs: [
					'Padel balls look similar to tennis balls but usually have somewhat less internal pressure. Most venues and clubs provide balls or sell them on site — as a beginner, you rarely need to worry about this yourself.'
				]
			},
			{
				id: 'kleidung',
				heading: 'Clothing',
				paragraphs: [
					'Normal sportswear is completely sufficient: a breathable shirt, shorts or a skirt that allow free movement, and sports socks. Dedicated padel clothing lines look nice, but are not a requirement.'
				]
			},
			{
				id: 'zubehoer',
				heading: 'Accessories',
				paragraphs: [
					'Useful additions over time: a racket bag for transport, an overgrip once the original grip is worn through, and a vibration dampener if the impact feels too harsh in your arm. All optional, none of it matters on day one.'
				]
			},
			{
				id: 'nicht-sofort-kaufen',
				heading: "What beginners don't need to buy right away",
				box: {
					kind: 'tips',
					title: 'Can wait until you know whether padel becomes your sport',
					items: [
						'An expensive pro racket — a solid entry-level or borrowed racket is enough for the first few months.',
						'A complete padel clothing collection.',
						'Your own balls in bulk — most venues provide them.',
						'Accessories like overgrips or dampeners before you even play regularly.'
					]
				}
			},
			{
				id: 'kauf-checkliste',
				heading: 'Shopping checklist',
				box: {
					kind: 'checklist',
					title: 'Before your first purchase',
					items: [
						'Play 1–2 times with a borrowed racket before you invest.',
						'Choose a racket based on control rather than looks (see the guide to padel rackets).',
						'Pick shoes with good lateral support rather than plain running shoes.',
						'Ask at the venue whether balls are provided.',
						'Comfortable, freely moving sportswear is completely sufficient.'
					]
				}
			}
		],
		faq: [
			{
				question: 'Can I play padel with a tennis racket?',
				answer:
					'No, padel rackets are a distinct piece of equipment without strings and with a solid, perforated surface. A tennis racket does not work for this.'
			},
			{
				question: 'Do I need my own equipment right away?',
				answer:
					'No. Many venues lend out rackets, and balls are usually provided. Comfortable sportswear and suitable shoes are enough to get started.'
			},
			{
				question: 'How often do I need to replace equipment?',
				answer:
					'That depends a lot on how often you play and the material. Shoes wear out noticeably from the many direction changes, while rackets generally last much longer for casual players.'
			}
		]
	},
	{
		slug: 'padel-schlaeger',
		title: 'Padel Rackets for Beginners: Shapes, Weight and Choosing One',
		metaTitle: 'Padel Rackets for Beginners: Shapes, Weight and Choosing One',
		metaDescription:
			'How to find the right padel racket: round, teardrop and diamond-shaped rackets, weight, balance and playing style.',
		excerpt:
			'Round, teardrop or diamond? How to choose the racket shape that matches your playing style.',
		category: 'ausruestung',
		difficulty: 'einsteiger',
		readingTime: 8,
		updatedAt: '2026-08-01',
		relatedSlugs: ['padel-ausruestung', 'padel-schuhe', 'padel-technik', 'padel-kosten'],
		sections: [
			{
				id: 'warum-wichtig',
				heading: 'Why the right racket matters',
				paragraphs: [
					'The racket directly affects how easily you find control and how much power you have to put into a shot yourself. A racket that matches your playing style makes the early learning curve noticeably more pleasant.',
					'There is no objectively "best" racket — only the one that fits your current level and playing style.'
				]
			},
			{
				id: 'formen',
				heading: 'Racket shapes explained',
				paragraphs: [
					'Round: the largest sweet spot, very forgiving for control, generally the recommended shape for beginners.',
					'Teardrop: a hybrid between control and power, a good compromise for players with some initial experience.',
					'Diamond: the weight sits further up in the head, more power, a smaller sweet spot — better suited to more advanced players with clean technique.'
				]
			},
			{
				id: 'gewicht-balance',
				heading: 'Weight and balance',
				paragraphs: [
					'Lighter rackets can be swung faster and are easier on the arm and shoulder; heavier rackets add more power to the shot, but also demand more control and strength.',
					'For beginners, a lighter to medium weight class is generally recommended — control first, power comes along naturally over time.'
				]
			},
			{
				id: 'kontrolle-vs-power',
				heading: 'Control vs. power',
				paragraphs: [
					'Control-oriented rackets (usually round, balanced) are more forgiving and help you keep the ball safely in play. Power-oriented rackets (usually diamond-shaped, head-heavy) reward precise technique with more power, but also punish mistakes more harshly.',
					'As a rule of thumb: anyone still working on basic technique almost always benefits more from control than from extra power.'
				]
			},
			{
				id: 'anfaenger-schlaeger',
				heading: 'Rackets for beginners',
				paragraphs: [
					'A round or teardrop-shaped racket with moderate weight is the right choice for most beginners. It forgives imprecise contact points and makes learning the basic shots easier.'
				]
			},
			{
				id: 'fortgeschrittene-schlaeger',
				heading: 'Rackets for advanced players',
				paragraphs: [
					'Once technique is solid, it is worth looking at teardrop or diamond-shaped models with more power, depending on whether control or attacking play is the priority.'
				]
			},
			{
				id: 'kauffehler',
				heading: 'Buying mistakes',
				box: {
					kind: 'mistakes',
					title: 'This often leads to frustration with a new racket',
					items: [
						"Buying a pro or power racket even though basic technique isn't there yet.",
						'Deciding purely on looks or brand instead of checking shape and weight.',
						'Choosing a racket that is clearly too heavy — this unnecessarily strains the arm and shoulder.',
						'Not test-hitting or getting advice before buying, even though many shops offer it.'
					]
				}
			},
			{
				id: 'checkliste',
				heading: 'Racket checklist',
				box: {
					kind: 'checklist',
					title: 'Check before buying',
					items: [
						'Shape: round or teardrop for beginners.',
						'Weight: rather light to medium, especially with arm or shoulder issues.',
						'Balance: even rather than head-heavy, if control is the priority.',
						'Test-hit or borrow one first if possible.',
						'Only decide for good after a few training sessions.'
					]
				}
			}
		],
		faq: [
			{
				question: 'Which racket shape is best for beginners?',
				answer:
					'Generally a round shape: the largest sweet spot, the most control, the most forgiving for imprecise contact points.'
			},
			{
				question: 'How heavy should my first padel racket be?',
				answer:
					'Tending towards light to medium. Exact weight figures vary by manufacturer — it is best to get advice at a specialist shop or try out different models.'
			},
			{
				question: 'Do I need to spend a lot of money right away as a beginner?',
				answer:
					'No. Solid entry-level models are available at moderate prices, and many clubs lend out rackets anyway for the first few times.'
			}
		]
	},
	{
		slug: 'padel-schuhe',
		title: 'Padel Shoes: What to Look for When Buying',
		metaTitle: 'Padel Shoes: What to Look for When Buying',
		metaDescription:
			'Padel shoes explained: grip, stability, cushioning, sole patterns and differences from tennis or running shoes.',
		excerpt:
			'Why regular running shoes quickly reach their limits on the court — and what padel shoes do differently.',
		category: 'ausruestung',
		difficulty: 'einsteiger',
		readingTime: 7,
		updatedAt: '2026-08-01',
		relatedSlugs: ['padel-ausruestung', 'padel-schlaeger', 'padel-fuer-anfaenger', 'padel-kosten'],
		sections: [
			{
				id: 'warum-spezielle-schuhe',
				heading: 'Why dedicated shoes matter',
				paragraphs: [
					'Padel demands lots of short sprints, abrupt stops and lateral changes of direction in a comparatively small space. Running shoes are optimized for straight-line movement and often offer too little lateral support for that.',
					'Padel shoes are built specifically for this kind of load — with a sole suited to the surface and more support on the sides.'
				]
			},
			{
				id: 'grip-sohlenprofil',
				heading: 'Grip and sole pattern',
				paragraphs: [
					'The surface on padel courts (usually carpet with sand infill) requires its own sole pattern that offers enough grip for quick starts and stops without locking up when sliding and turning.',
					'Soles with too aggressive a tread (like some outdoor or running shoes) can catch in the surface, while too smooth a sole slides uncontrollably — padel shoes deliberately look for the middle ground.'
				]
			},
			{
				id: 'stabilitaet',
				heading: 'Stability on direction changes',
				paragraphs: [
					'Reinforced lateral support protects against rolling an ankle during the fast sideways movements that constantly occur in padel. That is one of the biggest differences from classic running shoes, which are primarily designed for straight-line cushioning.'
				]
			},
			{
				id: 'daempfung',
				heading: 'Cushioning',
				paragraphs: [
					'Because there are so many short, hard stops and bursts of acceleration, padel shoes need cushioning that relieves the joints under exactly this loading pattern — not the same as the cushioning of a running shoe, which is designed for even, straight-line strides.'
				]
			},
			{
				id: 'indoor-outdoor',
				heading: 'Indoor vs. outdoor',
				paragraphs: [
					"Some models are optimized specifically for indoor floors or for outdoor courts, others work for both. If you mostly play at one type of venue, it is worth checking the manufacturer's info on the intended use."
				]
			},
			{
				id: 'haeufige-fehler',
				heading: 'Common mistakes',
				box: {
					kind: 'mistakes',
					title: 'People often regret this choice of shoe quickly',
					items: [
						'Using regular running shoes for regular padel training.',
						'Reusing tennis shoes without checking — some work well, others do not, depending on the model.',
						'Not paying attention to fit and lateral support when buying, only to looks.',
						'Buying shoes that are clearly too tight or too loose "because they were on sale".'
					]
				}
			},
			{
				id: 'kauf-checkliste',
				heading: 'Shopping checklist',
				box: {
					kind: 'checklist',
					title: 'Before buying shoes',
					items: [
						'Test lateral support and stability, not just forward cushioning.',
						'Choose a sole pattern that matches the surface at your home venue.',
						'Check fit at the venue or a specialist shop if possible.',
						'If you play often, keep an eye on outsole wear.'
					]
				}
			}
		],
		faq: [
			{
				question: 'Can I use tennis shoes for padel?',
				answer:
					'Partly, yes, depending on the model — many tennis shoes already offer good lateral support. For regular play, though, shoes developed specifically for padel are worth it.'
			},
			{
				question: 'Why are running shoes unsuitable for padel?',
				answer:
					'Running shoes are optimized for straight-line movement and usually offer too little lateral support for the fast direction changes in padel — that increases the risk of injury.'
			},
			{
				question: 'How quickly do padel shoes wear out?',
				answer:
					'That depends a lot on how often you play, the surface and your movement style. Anyone playing a lot and intensively will wear down the outsole faster than a casual player.'
			}
		]
	},

	// ------------------------------------------------------------
	// TECHNIQUE & TACTICS
	// ------------------------------------------------------------
	{
		slug: 'padel-technik',
		title: 'Padel Technique: The Most Important Shots Explained Simply',
		metaTitle: 'Padel Technique: The Most Important Shots Explained Simply',
		metaDescription:
			'The most important padel shots at a glance: forehand, backhand, volley, bandeja, vibora, lob and smash.',
		excerpt: 'From the forehand to the bandeja — the basic shots that make up every padel match.',
		category: 'technik-taktik',
		difficulty: 'fortgeschritten',
		readingTime: 9,
		updatedAt: '2026-08-01',
		relatedSlugs: ['padel-taktik', 'padel-begriffe', 'padel-training', 'padel-doppel'],
		sections: [
			{
				id: 'grundhaltung',
				heading: 'Basic stance',
				paragraphs: [
					'A slightly bent, mobile basic stance with weight on the balls of the feet is the foundation for almost every shot in padel. From this position you can move quickly in any direction without first having to laboriously find your balance.',
					'The racket is usually held loosely with both hands ready (a continental-style grip for volleys), so you can react equally quickly on the forehand and backhand.'
				]
			},
			{
				id: 'vorhand-rueckhand',
				heading: 'Forehand and backhand',
				paragraphs: [
					'Forehand and backhand are the basic shots that decide most rallies. What matters is a compact, controlled swing rather than an exaggeratedly big backswing — in padel, precision often counts for more than sheer power.',
					'The ideal contact point is slightly in front of the body, with a stable stance and an active wrist for fine-tuning direction.'
				]
			},
			{
				id: 'volley',
				heading: 'Volley',
				paragraphs: [
					'The volley is played at the net, before the ball touches the ground. The movement is short and compact — more of a controlled block-and-steer than a full swing.',
					'A good volley keeps the ball low and places it deliberately, instead of just returning it "somehow".'
				]
			},
			{
				id: 'lob',
				heading: 'Lob',
				paragraphs: [
					'The lob is a high, deep ball hit over the opponents standing at the net. Technically it needs an open racket face and a calm, controlled swing from low to high — the goal is height and depth, not speed.'
				]
			},
			{
				id: 'bandeja',
				heading: 'Bandeja',
				paragraphs: [
					'The bandeja is a controlled overhead shot played in response to a lob, letting you keep the net position instead of being pushed back. The swing is dampened, almost like a slice from above, rather than a full smash.'
				]
			},
			{
				id: 'vibora',
				heading: 'Vibora',
				paragraphs: [
					'The vibora is a variant of the bandeja with more pronounced sidespin, which makes the ball bounce off more sharply and awkwardly after landing. It requires a bit more technical feel than the classic bandeja.'
				]
			},
			{
				id: 'smash',
				heading: 'Smash',
				paragraphs: [
					'The smash is the full overhead shot at maximum speed, usually intended as a direct point-winning shot. Placement is what matters — an unplaced smash can often surprisingly well be countered off the glass or mesh.'
				]
			},
			{
				id: 'glas-nutzen',
				heading: 'Using the glass',
				paragraphs: [
					'Techniques involving the glass are mainly about timing: re-reading the ball after it bounces off the ground and off the wall, and playing it back with a calm stance and control, rather than rushing after it too hastily.'
				]
			},
			{
				id: 'technik-tipps',
				heading: 'Technique tips for beginners',
				box: {
					kind: 'tips',
					title: 'What gets you improving the fastest',
					items: [
						'Learn a clean forehand and backhand first, before prioritizing the bandeja and vibora.',
						'Deliberately practice short, compact volley movements at the net instead of full swings.',
						'Add the lob to your repertoire early — it is technically simpler than its reputation suggests.',
						'Be patient with glass play: judge the bounce properly first, then hit.'
					]
				}
			}
		],
		faq: [
			{
				question: 'Which shot should I learn first as a beginner?',
				answer:
					'A solid forehand and backhand from a stable basic position — every other shot builds on those.'
			},
			{
				question: 'Is the bandeja hard to learn?',
				answer:
					'It needs some practice, because the swing is more dampened than the smash. With focused training on the court or in individual coaching, it can be learned well, though.'
			},
			{
				question: 'How important is the smash really in padel?',
				answer:
					'It is an effective point-winning shot, but less central than it might seem at first — placement, the lob and net play decide more points in the long run.'
			}
		]
	},
	{
		slug: 'padel-taktik',
		title: 'Padel Tactics: Simply Play Better Doubles',
		metaTitle: 'Padel Tactics: Simply Play Better Doubles',
		metaDescription:
			'Padel tactics for beginners and advanced players: positioning, net play, the lob, patience, communication and avoiding mistakes.',
		excerpt: 'Why smart positioning in padel often achieves more than the hardest shot.',
		category: 'technik-taktik',
		difficulty: 'fortgeschritten',
		readingTime: 9,
		updatedAt: '2026-08-01',
		relatedSlugs: ['padel-technik', 'padel-doppel', 'padel-training', 'padel-begriffe'],
		sections: [
			{
				id: 'taktik-vs-power',
				heading: 'Why tactics matter more than sheer power',
				paragraphs: [
					'Because the court is bounded by walls, many balls come back that would already be out in tennis. Raw power is punished quickly as a result: a ball hit too hard without placement often ends up as an easy ball for the opponent.',
					'Anyone who instead uses placement, changes of pace and positioning wins more points in the long run than pure power players.'
				]
			},
			{
				id: 'grundpositionen',
				heading: 'Basic positions in doubles',
				paragraphs: [
					'Ideally, both partners stand at the same depth — either both at the net (attacking position) or both at the baseline (defensive position). Mixed formations, with one player up front and one far back, often open unnecessarily large gaps.'
				]
			},
			{
				id: 'netz-erobern',
				heading: 'Winning the net',
				paragraphs: [
					'The net is usually the strongest position in padel: from there you can take balls early and build pressure. The way there often leads through a good lob or a controlled bandeja, which gives the opposing team time to fall back while you move forward yourself.'
				]
			},
			{
				id: 'lob-einsetzen',
				heading: 'Using the lob correctly',
				paragraphs: [
					'A well-timed lob pushes the opponents back off the net and gives your team the chance to take over the net position itself. It is therefore less an act of desperation than an active tactical tool.'
				]
			},
			{
				id: 'glas-verteidigen',
				heading: 'Defending with the glass',
				paragraphs: [
					'On defense, the glass helps you gain time: instead of returning a difficult ball immediately and in a rush, you can use the bounce off the wall to reposition and respond in a controlled way.'
				]
			},
			{
				id: 'kommunikation',
				heading: 'Communicating with your partner',
				paragraphs: [
					'Short, clear calls like "mine", "yours", "out" or "lob" prevent misunderstandings and balls that get chased by both players or left unplayed. Good doubles teams talk continuously during the match, not just when there is a problem.'
				]
			},
			{
				id: 'taktische-fehler',
				heading: 'Common tactical mistakes',
				box: {
					kind: 'mistakes',
					title: 'This costs the most points in practice',
					items: [
						'Both players staying stuck at the baseline even though the net is available.',
						'Leaving too big a gap between the partners.',
						'Trying to smash every high ball instead of choosing control and placement.',
						'Not communicating, so balls are left unplayed in the middle.',
						'Not resetting position after a point is won.'
					]
				}
			},
			{
				id: 'match-checkliste',
				heading: 'Match checklist',
				box: {
					kind: 'checklist',
					title: 'Keep this in mind before and during the match',
					items: [
						'Stand together at the net or together at the back, not mixed.',
						'Use the lob actively to win back the net.',
						'Exchange short calls with your partner continuously.',
						'Do not hit every ball as hard as possible — placement over power.',
						'Briefly reposition after every point.'
					]
				}
			}
		],
		faq: [
			{
				question: 'What is the most important tactical rule in padel doubles?',
				answer:
					'Act together at the same depth — either both at the net or both at the back. Mixed formations are usually the biggest weakness.'
			},
			{
				question: 'How often should I talk to my partner?',
				answer:
					'Continuously, not just when there is a problem. Short calls before and during every rally prevent most misunderstandings.'
			},
			{
				question: 'Is it worth taking risks, or should I always play safe?',
				answer:
					'Both have their place — choosing between safety and controlled risk depending on the situation is exactly what tactical maturity looks like.'
			}
		]
	},
	{
		slug: 'padel-doppel',
		title: 'Padel Doubles: Positioning, Communication and Teamwork',
		metaTitle: 'Padel Doubles: Positioning, Communication and Teamwork',
		metaDescription:
			'Padel is played in doubles. Learn about positioning, communication, coordination, role division and typical team mistakes.',
		excerpt: 'Why a well-drilled padel team is more than two good individual players.',
		category: 'technik-taktik',
		difficulty: 'fortgeschritten',
		readingTime: 8,
		updatedAt: '2026-08-01',
		relatedSlugs: ['padel-taktik', 'padel-regeln', 'padel-technik', 'padel-training'],
		sections: [
			{
				id: 'warum-doppel-wichtig',
				heading: 'Why doubles matters so much in padel',
				paragraphs: [
					'Padel is played almost exclusively as doubles — the court, the rules and the tactics are entirely built around two people jointly defending and attacking one half. A well-drilled team beats two strong individual players without coordination almost every time.'
				]
			},
			{
				id: 'grundposition',
				heading: 'Basic position',
				paragraphs: [
					'The base formation: both partners at roughly the same depth, each responsible for their own half of the court but alert for balls in the middle. This base order should be quickly restored after every rally.'
				]
			},
			{
				id: 'wer-nimmt-welchen-ball',
				heading: 'Who takes which ball?',
				paragraphs: [
					'As a rule of thumb: whoever has the better angle and ball control for the situation takes it — usually the player whose forehand the ball is closer to. Balls exactly in the middle are up for negotiation and should be clearly called out, to avoid collisions or balls left unplayed.'
				]
			},
			{
				id: 'links-rechts',
				heading: 'Left- and right-side players',
				paragraphs: [
					'Many teams play with a fixed side assignment, often matching the dominant hand: right-handers often on the left half of the court, so the backhand is not constantly stuck dealing with the middle, where most balls arrive — but that is not a fixed rule, rather an experience-based guideline that varies from playing style to playing style.'
				]
			},
			{
				id: 'netz-verteidigung-gemeinsam',
				heading: 'Playing net and defense together',
				paragraphs: [
					'Whether at the net or on defense — what matters is that both partners move together, as if connected by an invisible line. If one moves forward or back, the other should move with them, so as not to open up gaps.'
				]
			},
			{
				id: 'doppel-fehler',
				heading: 'Typical doubles mistakes',
				box: {
					kind: 'mistakes',
					title: 'This is what slows most teams down',
					items: [
						'Unclear responsibility for balls in the middle, with no call.',
						'One partner at the net, the other far back — a permanently mixed formation.',
						'Falling into frustration after a lost point instead of resetting.',
						"Not adapting to the partner's level, and instead chasing risk in isolation."
					]
				}
			}
		],
		faq: [
			{
				question: 'Is padel also played as singles?',
				answer:
					'Padel is overwhelmingly played as doubles. Singles variants exist occasionally, but they are the exception, not the standard of the sport.'
			},
			{
				question: 'How do I find the right side for me?',
				answer:
					'It is best to try both sides in training. Many players prefer the side where their dominant hand is not constantly responsible for balls coming from the middle.'
			},
			{
				question: 'What do I do if my partner is much weaker or stronger?',
				answer:
					'Communication helps the most: clearly agree on who takes which balls, and adjust your own risk-taking to the shared level instead of acting in isolation.'
			}
		]
	},

	// ------------------------------------------------------------
	// GETTING STARTED & TRAINING
	// ------------------------------------------------------------
	{
		slug: 'padel-fuer-anfaenger',
		title: 'Padel for Beginners: Everything You Need to Know Before Your First Match',
		metaTitle: 'Padel for Beginners: Everything You Need to Know Before Your First Match',
		metaDescription:
			'Padel for beginners: rules, equipment, first shots, typical mistakes and tips for your first match.',
		excerpt:
			'Your starting point: everything important for your first padel day, summarized compactly.',
		category: 'einstieg',
		difficulty: 'einsteiger',
		readingTime: 9,
		updatedAt: '2026-08-01',
		popular: true,
		beginnerRecommended: true,
		relatedSlugs: ['padel-regeln', 'padel-ausruestung', 'padel-vs-tennis', 'padel-training'],
		sections: [
			{
				id: 'warum-einsteigerfreundlich',
				heading: 'Why padel is beginner-friendly',
				paragraphs: [
					'Padel is played on a smaller court than tennis, the walls give mistakes a second chance, and doubles means you share the space with a partner. As a result, even complete newcomers often manage real rallies after just a short time.'
				]
			},
			{
				id: 'was-du-brauchst',
				heading: 'What you need',
				paragraphs: [
					"For your first attempt, comfortable sportswear, stable shoes and — if the venue doesn't lend anything out — a borrowed or affordable beginner racket are enough. Details on this in the guide to padel equipment."
				]
			},
			{
				id: 'wichtigste-regeln',
				heading: 'The most important rules',
				paragraphs: [
					'In short: serve underarm after the bounce, scoring like tennis, the ball may bounce off your own wall after touching the ground and stays in play. You can find the full overview in the guide to padel rules.'
				]
			},
			{
				id: 'erste-schlaege',
				heading: 'First shots',
				paragraphs: [
					'At first, focus on a stable forehand and backhand from a calm basic position. Volleys, the lob and the bandeja will come naturally once the basic shots are solid — more on this in the technique guide.'
				]
			},
			{
				id: 'verhalten-auf-dem-court',
				heading: 'Behavior on the court',
				paragraphs: [
					"Usual courtesy rules apply as in any racket sport: only play the ball back once the point is clearly over, no disruptive calls during the opponent's shot, and be generous when in doubt about disputed out calls."
				]
			},
			{
				id: 'tipps-erstes-match',
				heading: 'Tips for your first match',
				box: {
					kind: 'tips',
					title: 'To keep your first court visit relaxed',
					items: [
						'Warm up briefly beforehand instead of jumping straight into a match.',
						"Don't try to hit every ball hard — staying in the rally matters more at first.",
						'Briefly agree with more experienced players on how you count and play.',
						'Feel free to ask questions about the rules directly — everyone started somewhere.'
					]
				}
			},
			{
				id: 'anfaengerfehler',
				heading: 'Beginner mistakes',
				box: {
					kind: 'mistakes',
					title: 'Typical at first, but easy to avoid',
					items: [
						'Focusing too much on power instead of control.',
						'Constantly retreating instead of looking for the net.',
						'Avoiding wall play instead of practicing it.',
						'Not talking to your partner.'
					]
				}
			},
			{
				id: 'start-checkliste',
				heading: 'Getting-started checklist',
				box: {
					kind: 'checklist',
					title: 'Before you begin',
					items: [
						'Comfortable sportswear and stable shoes.',
						'A racket borrowed or picked up as a beginner model.',
						'Basic rules on serve, scoring and glass understood.',
						'A relaxed warm-up before the first point.',
						'Start with an open ear for tips from more experienced players.'
					]
				}
			}
		],
		faq: [
			{
				question: 'How quickly will I learn padel as a complete beginner?',
				answer:
					'The basic rules and first rallies usually work out within the first hour. A confident level of play then develops over several training sessions and matches.'
			},
			{
				question: 'Do I need prior experience from other sports?',
				answer:
					'No, that is not a requirement — general athletic fitness and ball feel help, but they are not a must.'
			},
			{
				question: 'Where do I find other players to get started with?',
				answer:
					'Many clubs offer taster sessions or open training slots. Player-matching offers within your own community can also help you find suitable playing partners.'
			}
		]
	},
	{
		slug: 'padel-training',
		title: 'Padel Training: Exercises for Technique, Tactics and Better Matches',
		metaTitle: 'Padel Training: Exercises for Technique, Tactics and Better Matches',
		metaDescription:
			'Padel training for beginners and advanced players: exercises for volley, lob, bandeja, glass, positioning and match practice.',
		excerpt:
			'How to structure your training sensibly — from technique drills to your own 4-week plan.',
		category: 'einstieg',
		difficulty: 'fortgeschritten',
		readingTime: 9,
		updatedAt: '2026-08-01',
		relatedSlugs: ['padel-technik', 'padel-taktik', 'padel-doppel', 'padel-fuer-anfaenger'],
		sections: [
			{
				id: 'trainingsaufbau',
				heading: 'How good padel training is structured',
				paragraphs: [
					'Effective training usually combines three building blocks: technique drills for individual shots, tactics drills for positioning and decisions, and real match practice, where both come together. Anyone who only plays matches without deliberately working on technique often stagnates at a certain level.'
				]
			},
			{
				id: 'technikuebungen',
				heading: 'Technique drills',
				paragraphs: [
					'Repeatedly practicing individual shots — such as series of volleys at the net or repeated lobs from the basic position — improves consistency and timing, without the pressure of a real point.'
				]
			},
			{
				id: 'taktikuebungen',
				heading: 'Tactics drills',
				paragraphs: [
					'Exercises such as "both teams start at the back, the goal is to advance to the net together" specifically train decision-making and coordination, not just pure shot technique.'
				]
			},
			{
				id: 'partneruebungen',
				heading: 'Partner drills',
				paragraphs: [
					'Exercises for two — such as targeted rallies with a prescribed shot type (only lob, only volley) — help build automatisms with your own partner that can then be called on intuitively during a match.'
				]
			},
			{
				id: 'training-mit-trainer',
				heading: 'Training with a coach',
				paragraphs: [
					'A coach can feed balls in a targeted way to repeatedly practice certain situations (defending a smash, return variations), and gives direct feedback on technique — that often speeds up progress noticeably compared to pure casual play.'
				]
			},
			{
				id: 'fehleranalyse',
				heading: 'Analyzing your mistakes',
				paragraphs: [
					'A short, honest review after a match or training session is worthwhile: which shots felt unreliable? Which tactical decisions did not work out? Small, targeted adjustments bring more in the long run than pure repetition without reflection.'
				]
			},
			{
				id: 'vier-wochen-plan',
				heading: 'A 4-week training plan',
				box: {
					kind: 'info',
					title: 'A simple starting framework — adapt it to your level',
					items: [
						'Week 1: Solidify basic shots — forehand, backhand, simple volleys.',
						'Week 2: Deliberately work the lob and bandeja into partner drills.',
						'Week 3: Practice positioning and winning the net in doubles.',
						'Week 4: Apply what you have learned in real matches and reflect afterwards.'
					]
				}
			}
		],
		faq: [
			{
				question: 'How often should I train to get better?',
				answer:
					'That depends on your goals. Even one or two focused sessions per week on top of normal matches bring noticeable progress.'
			},
			{
				question: 'Do I need a coach to get better?',
				answer:
					'Not necessarily, but targeted feedback often speeds up development significantly, especially for technical details like the bandeja or vibora.'
			},
			{
				question: 'What do technique drills give me over just playing matches?',
				answer:
					'In a match, the result is what matters; in training, you can work on specific weaknesses without the pressure of winning the point.'
			}
		]
	},

	// ------------------------------------------------------------
	// COST
	// ------------------------------------------------------------
	{
		slug: 'padel-kosten',
		title: 'What Does Padel Cost? Prices, Equipment and Ongoing Costs Explained',
		metaTitle: 'What Does Padel Cost? Prices, Equipment and Ongoing Costs Explained',
		metaDescription:
			'What does padel cost? Overview of court rental, equipment, coaching, memberships and money-saving tips.',
		excerpt: 'Which cost items actually come up in padel — and where it pays off to save.',
		category: 'kosten',
		difficulty: 'einsteiger',
		readingTime: 7,
		updatedAt: '2026-08-01',
		relatedSlugs: [
			'padel-ausruestung',
			'padel-fuer-anfaenger',
			'padel-training',
			'padel-schlaeger'
		],
		sections: [
			{
				id: 'welche-kosten',
				heading: 'What costs come up?',
				paragraphs: [
					'The cost of padel roughly consists of court rental, equipment, any coaching, and optionally a club membership. How much that adds up to overall depends heavily on region, venue and how often you play — there are no fixed nationwide prices, because the offering varies too much for that.'
				]
			},
			{
				id: 'courtmiete',
				heading: 'Court rental',
				paragraphs: [
					'Most venues rent out courts by the hour, often split between up to four players. Prices differ considerably by location, time of day and occupancy — checking the price list of the venue in question locally gives the most reliable answer.'
				]
			},
			{
				id: 'ausruestung-kosten',
				heading: 'Equipment',
				paragraphs: [
					'Beginner rackets are usually cheaper than models for advanced players, plus shoes and clothing as needed. Anyone who just wants to try it out can borrow a racket at many venues and so barely has to invest at the start — more on this in the guide to padel equipment.'
				]
			},
			{
				id: 'training-kosten',
				heading: 'Coaching',
				paragraphs: [
					'Individual or group coaching costs different amounts depending on the venue and coach. Group coaching is generally cheaper per person than individual sessions.'
				]
			},
			{
				id: 'turniere',
				heading: 'Tournaments',
				paragraphs: [
					'Tournament participation usually comes with an entry fee that covers court rental, balls and organization. The amount varies depending on the organizer and tournament format.'
				]
			},
			{
				id: 'mitgliedschaften',
				heading: 'Memberships',
				paragraphs: [
					'Some venues and clubs offer memberships with discounted court prices or fixed playing times. Whether that pays off depends on how regularly you actually play — for occasional play, plain hourly rental is often cheaper.'
				]
			},
			{
				id: 'spartipps',
				heading: 'Money-saving tips',
				box: {
					kind: 'tips',
					title: 'How to keep padel affordable',
					items: [
						'Borrow a racket at first instead of buying right away.',
						'Off-peak times (mornings, weekdays) are often cheaper than evening and weekend slots.',
						'Play with four people and split the court rental.',
						'Choose group coaching over individual sessions to get started.',
						'Realistically assess how often you actually play before signing up for a membership.'
					]
				}
			},
			{
				id: 'kosten-checkliste',
				heading: 'Cost checklist',
				box: {
					kind: 'checklist',
					title: 'To clarify before getting started',
					items: [
						"Check your preferred venue's price list for court rental and off-peak times.",
						'Clarify whether rackets and balls are lent out or provided.',
						'Realistically assess your own playing frequency.',
						'Consider group coaching as an affordable way to get started.',
						'Only sign up for a membership once regular play becomes clear.'
					]
				}
			}
		],
		faq: [
			{
				question: 'Is padel more expensive than tennis?',
				answer:
					'That cannot be said across the board — costs depend heavily on region, venue and personal playing frequency, for both sports alike.'
			},
			{
				question: 'Is a membership worth it for beginners?',
				answer:
					'Usually not strictly necessary at first — try out how often you really play, then decide about a membership.'
			},
			{
				question: 'What is the cheapest way to get started with padel?',
				answer:
					'A borrowed racket, using off-peak times, and playing with four people to split the court rental — that keeps the entry costs manageable.'
			}
		]
	}
];
