// ============================================================
// PadelIndex — Quiz-Inhalte
// ============================================================
// Neue Frage ergänzen: Objekt vom Typ QuizQuestion an QUIZ_QUESTIONS
// anhängen, difficulty korrekt setzen — die Routen unter
// /quiz/[difficulty] filtern automatisch danach. Keine Frage-ID doppelt
// vergeben (siehe quiz-data.test.ts).

import type { QuizDifficulty, QuizDifficultySlug, QuizQuestion, QuizResultTier } from './quiz';

export const QUIZ_DIFFICULTIES: QuizDifficulty[] = [
	{
		slug: 'anfaenger',
		label: 'Anfänger',
		description: 'Grundregeln, Zählweise, Aufschlag, Glas und einfache Spielsituationen.',
		color: '#16A394',
		metaTitle: 'Padel Quiz für Anfänger: Kennst du die wichtigsten Regeln?',
		metaDescription:
			'Teste dein Wissen zu Padel-Regeln, Aufschlag, Zählweise, Glas und einfachen Spielsituationen.',
		recommendedGuideSlugs: ['padel-regeln', 'padel-fuer-anfaenger', 'padel-ausruestung']
	},
	{
		slug: 'fortgeschritten',
		label: 'Fortgeschritten',
		description:
			'Taktische Entscheidungen, Bandeja, Lob, Volley, Positionierung und Doppel-Kommunikation.',
		color: '#0F6E5C',
		metaTitle: 'Padel Quiz für Fortgeschrittene: Technik, Taktik und Spielsituationen',
		metaDescription:
			'Teste dein Padel-Wissen zu Bandeja, Lob, Volley, Doppel-Taktik, Positionierung und Glas.',
		recommendedGuideSlugs: ['padel-technik', 'padel-taktik', 'padel-doppel']
	},
	{
		slug: 'experte',
		label: 'Experte',
		description:
			'Komplexe Regelfälle, Matchstrategie, Schlagwahl unter Druck, Winkel, Tempo und Risiko.',
		color: '#0B1E26',
		metaTitle: 'Padel Experten-Quiz: Taktik, Strategie und komplexe Spielsituationen',
		metaDescription:
			'Das schwierige Padel-Quiz für erfahrene Spieler: Matchstrategie, Schlagwahl, Risiko und taktische Entscheidungen.',
		recommendedGuideSlugs: ['padel-taktik', 'padel-training', 'padel-doppel']
	}
];

export const QUIZ_RESULT_TIERS: QuizResultTier[] = [
	{
		minPercentage: 0,
		maxPercentage: 39,
		title: 'Noch Luft nach oben',
		text: 'Du kennst die Grundlagen noch nicht sicher. Starte mit den wichtigsten Regeln und einfachen Spielsituationen.'
	},
	{
		minPercentage: 40,
		maxPercentage: 69,
		title: 'Solide Basis',
		text: 'Du hast schon ein gutes Grundverständnis. Mit etwas mehr Regelwissen und Taktik wirst du schnell sicherer.'
	},
	{
		minPercentage: 70,
		maxPercentage: 89,
		title: 'Starkes Padel-Wissen',
		text: 'Du verstehst viele wichtige Situationen bereits gut. Jetzt lohnt sich der nächste Schritt in Technik und Matchtaktik.'
	},
	{
		minPercentage: 90,
		maxPercentage: 100,
		title: 'Padel-Experte',
		text: 'Sehr stark! Du kennst dich mit Regeln, Taktik und Spielsituationen richtig gut aus.'
	}
];

export const QUIZ_QUESTIONS: QuizQuestion[] = [
	// ------------------------------------------------------------
	// ANFÄNGER
	// ------------------------------------------------------------
	{
		id: 'anfaenger-1',
		difficulty: 'anfaenger',
		question: 'Was ist Padel hauptsächlich?',
		options: [
			{ id: 'A', text: 'Ein Einzelsport ohne Wände' },
			{
				id: 'B',
				text: 'Ein Rückschlagspiel, das meist im Doppel auf einem Court mit Glaswänden gespielt wird'
			},
			{ id: 'C', text: 'Eine Variante von Squash ohne Netz' },
			{ id: 'D', text: 'Ein reines Konditionstraining' }
		],
		correctOptionId: 'B',
		explanation:
			'Padel ist ein Rückschlagspiel, das in der Regel im Doppel gespielt wird. Charakteristisch sind der kleinere Court, das Netz und die Glaswände.',
		relatedGuideSlugs: ['padel-regeln']
	},
	{
		id: 'anfaenger-2',
		difficulty: 'anfaenger',
		question: 'Wie wird beim Padel normalerweise gezählt?',
		options: [
			{ id: 'A', text: '1, 2, 3, 4' },
			{ id: 'B', text: '0, 1, 2, 3' },
			{ id: 'C', text: '15, 30, 40, Spiel' },
			{ id: 'D', text: 'Jeder Ball zählt als ein Satz' }
		],
		correctOptionId: 'C',
		explanation: 'Die Zählweise ist ähnlich wie im Tennis: 15, 30, 40 und Spiel.',
		relatedGuideSlugs: ['padel-regeln']
	},
	{
		id: 'anfaenger-3',
		difficulty: 'anfaenger',
		question: 'Wie muss der Aufschlag beim Padel ausgeführt werden?',
		options: [
			{ id: 'A', text: 'Von oben über Kopfhöhe' },
			{ id: 'B', text: 'Von unten, nachdem der Ball einmal auf dem Boden aufgesprungen ist' },
			{ id: 'C', text: 'Direkt aus der Luft als Volley' },
			{ id: 'D', text: 'Mit zwei Händen' }
		],
		correctOptionId: 'B',
		explanation: 'Der Aufschlag erfolgt von unten. Der Ball muss vorher auf dem Boden aufspringen.',
		relatedGuideSlugs: ['padel-regeln']
	},
	{
		id: 'anfaenger-4',
		difficulty: 'anfaenger',
		question: 'Darf der Ball nach dem Aufspringen die Glaswand berühren?',
		options: [
			{ id: 'A', text: 'Ja, das ist ein zentraler Teil des Spiels' },
			{ id: 'B', text: 'Nein, dann ist der Punkt sofort verloren' },
			{ id: 'C', text: 'Nur beim Aufschlag' },
			{ id: 'D', text: 'Nur wenn beide Teams zustimmen' }
		],
		correctOptionId: 'A',
		explanation:
			'Nach dem Bodenkontakt darf der Ball die Glaswand berühren und weitergespielt werden.',
		relatedGuideSlugs: ['padel-regeln']
	},
	{
		id: 'anfaenger-5',
		difficulty: 'anfaenger',
		question: 'Wie viele Spieler stehen normalerweise bei einem Padel-Match auf dem Court?',
		options: [
			{ id: 'A', text: '2' },
			{ id: 'B', text: '3' },
			{ id: 'C', text: '4' },
			{ id: 'D', text: '6' }
		],
		correctOptionId: 'C',
		explanation: 'Padel wird meistens im Doppel gespielt, also mit vier Spielern.',
		relatedGuideSlugs: ['padel-doppel']
	},
	{
		id: 'anfaenger-6',
		difficulty: 'anfaenger',
		question: 'Was ist ein Lob?',
		options: [
			{ id: 'A', text: 'Ein kurzer Ball direkt hinter das Netz' },
			{ id: 'B', text: 'Ein hoher Ball über die Gegner hinweg' },
			{ id: 'C', text: 'Ein Aufschlagfehler' },
			{ id: 'D', text: 'Ein Schlag gegen das eigene Glas' }
		],
		correctOptionId: 'B',
		explanation: 'Ein Lob ist ein hoher Ball, der die Gegner vom Netz nach hinten drängen soll.',
		relatedGuideSlugs: ['padel-begriffe', 'padel-technik']
	},
	{
		id: 'anfaenger-7',
		difficulty: 'anfaenger',
		question:
			'Was passiert, wenn der Ball direkt gegen die gegnerische Glaswand gespielt wird, ohne vorher auf dem Boden aufzusetzen?',
		options: [
			{ id: 'A', text: 'Der Ball ist gut' },
			{ id: 'B', text: 'Der Ball ist aus' },
			{ id: 'C', text: 'Der Ball muss wiederholt werden' },
			{ id: 'D', text: 'Der Gegner bekommt zwei Punkte' }
		],
		correctOptionId: 'B',
		explanation:
			'Der Ball muss zuerst im gegnerischen Feld aufkommen. Trifft er direkt die gegnerische Glaswand, ist er aus.',
		relatedGuideSlugs: ['padel-regeln']
	},
	{
		id: 'anfaenger-8',
		difficulty: 'anfaenger',
		question: 'Was ist für Anfänger besonders wichtig?',
		options: [
			{ id: 'A', text: 'Immer maximal hart schlagen' },
			{ id: 'B', text: 'Jeden Ball als Smash spielen' },
			{ id: 'C', text: 'Den Ball kontrolliert im Spiel halten' },
			{ id: 'D', text: 'Nie mit dem Partner sprechen' }
		],
		correctOptionId: 'C',
		explanation: 'Kontrolle und Konstanz sind für Anfänger wichtiger als pure Schlaghärte.',
		relatedGuideSlugs: ['padel-fuer-anfaenger']
	},
	{
		id: 'anfaenger-9',
		difficulty: 'anfaenger',
		question: 'Welche Ausrüstung braucht man mindestens?',
		options: [
			{ id: 'A', text: 'Padelschläger, passende Schuhe und Bälle' },
			{ id: 'B', text: 'Tennisschläger und Fußballschuhe' },
			{ id: 'C', text: 'Squashschläger und Helm' },
			{ id: 'D', text: 'Nur Handschuhe' }
		],
		correctOptionId: 'A',
		explanation: 'Für Padel braucht man einen Padelschläger, geeignete Schuhe und Padelbälle.',
		relatedGuideSlugs: ['padel-ausruestung']
	},
	{
		id: 'anfaenger-10',
		difficulty: 'anfaenger',
		question: 'Was ist ein häufiger Anfängerfehler?',
		options: [
			{ id: 'A', text: 'Zu viel Kommunikation mit dem Partner' },
			{ id: 'B', text: 'Zu kontrolliertes Spiel' },
			{ id: 'C', text: 'Zu nah am Netz stehen beim Return' },
			{ id: 'D', text: 'Jeden Ball zu hart schlagen wollen' }
		],
		correctOptionId: 'D',
		explanation:
			'Viele Anfänger versuchen, zu oft hart zu schlagen. Im Padel sind Platzierung, Geduld und Kontrolle meist wichtiger.',
		relatedGuideSlugs: ['padel-fuer-anfaenger', 'padel-taktik']
	},

	// ------------------------------------------------------------
	// FORTGESCHRITTEN
	// ------------------------------------------------------------
	{
		id: 'fortgeschritten-1',
		difficulty: 'fortgeschritten',
		question: 'Warum ist der Lob im Padel taktisch so wichtig?',
		options: [
			{ id: 'A', text: 'Er beendet automatisch den Punkt' },
			{ id: 'B', text: 'Er hilft, die Gegner vom Netz zu verdrängen' },
			{ id: 'C', text: 'Er zählt doppelt' },
			{ id: 'D', text: 'Er darf nur von Profis gespielt werden' }
		],
		correctOptionId: 'B',
		explanation:
			'Mit einem guten Lob kann man die Gegner vom Netz nach hinten drängen und selbst eine bessere Position einnehmen.',
		relatedGuideSlugs: ['padel-taktik']
	},
	{
		id: 'fortgeschritten-2',
		difficulty: 'fortgeschritten',
		question: 'Was ist das Hauptziel einer Bandeja?',
		options: [
			{ id: 'A', text: 'Den Punkt immer sofort zu gewinnen' },
			{ id: 'B', text: 'Den Ball kontrolliert tief zu halten und die Netzposition zu behalten' },
			{ id: 'C', text: 'Den Ball absichtlich ins Aus zu schlagen' },
			{ id: 'D', text: 'Den Aufschlag zu ersetzen' }
		],
		correctOptionId: 'B',
		explanation:
			'Die Bandeja ist ein kontrollierter Überkopfschlag, mit dem man Druck macht und gleichzeitig die Netzposition sichert.',
		relatedGuideSlugs: ['padel-technik']
	},
	{
		id: 'fortgeschritten-3',
		difficulty: 'fortgeschritten',
		question: 'Wann ist ein Volley besonders sinnvoll?',
		options: [
			{ id: 'A', text: 'Wenn man am Netz steht und den Ball früh nehmen kann' },
			{ id: 'B', text: 'Wenn der Ball hinter der eigenen Grundlinie ist' },
			{ id: 'C', text: 'Nur beim Aufschlag' },
			{ id: 'D', text: 'Nie, Volleys sind im Padel verboten' }
		],
		correctOptionId: 'A',
		explanation:
			'Volleys werden meist am Netz gespielt, um den Ball früh zu nehmen und Druck aufzubauen.',
		relatedGuideSlugs: ['padel-technik']
	},
	{
		id: 'fortgeschritten-4',
		difficulty: 'fortgeschritten',
		question: 'Welche Position ist im Padel häufig vorteilhaft?',
		options: [
			{ id: 'A', text: 'Beide Spieler dauerhaft ganz hinten' },
			{ id: 'B', text: 'Beide Spieler kontrolliert am Netz, wenn sie Druck ausüben können' },
			{ id: 'C', text: 'Ein Spieler sitzt außerhalb des Courts' },
			{ id: 'D', text: 'Beide Spieler stehen direkt nebeneinander in der Mitte' }
		],
		correctOptionId: 'B',
		explanation:
			'Das Netz ist im Padel oft eine starke Position, weil man von dort Druck aufbauen kann.',
		relatedGuideSlugs: ['padel-taktik']
	},
	{
		id: 'fortgeschritten-5',
		difficulty: 'fortgeschritten',
		question: 'Was ist bei der Kommunikation im Doppel wichtig?',
		options: [
			{ id: 'A', text: 'Möglichst gar nicht reden' },
			{ id: 'B', text: 'Nur nach dem Match sprechen' },
			{ id: 'C', text: 'Klare Ansagen wie „ich“, „du“, „raus“ oder „lob“' },
			{ id: 'D', text: 'Den Partner während des Ballwechsels verwirren' }
		],
		correctOptionId: 'C',
		explanation: 'Kurze, klare Kommandos helfen, Missverständnisse zu vermeiden.',
		relatedGuideSlugs: ['padel-doppel']
	},
	{
		id: 'fortgeschritten-6',
		difficulty: 'fortgeschritten',
		question: 'Was ist eine Chiquita?',
		options: [
			{ id: 'A', text: 'Ein sehr harter Smash' },
			{ id: 'B', text: 'Ein kontrollierter, flacher Ball auf die Füße der Gegner am Netz' },
			{ id: 'C', text: 'Eine Art Aufschlag von oben' },
			{ id: 'D', text: 'Ein Ballwechsel ohne Glas' }
		],
		correctOptionId: 'B',
		explanation:
			'Die Chiquita ist ein taktischer Ball, der flach auf die Füße der Gegner gespielt wird, um deren Volley zu erschweren.',
		relatedGuideSlugs: ['padel-begriffe']
	},
	{
		id: 'fortgeschritten-7',
		difficulty: 'fortgeschritten',
		question: 'Wann sollte man das Glas bewusst nutzen?',
		options: [
			{
				id: 'A',
				text: 'Wenn der direkte Schlag schwierig ist und der Ball nach der Wand besser spielbar wird'
			},
			{ id: 'B', text: 'Nur beim Aufschlag' },
			{ id: 'C', text: 'Nie, Glasberührungen sind verboten' },
			{ id: 'D', text: 'Nur wenn der Gegner es erlaubt' }
		],
		correctOptionId: 'A',
		explanation:
			'Das Glas kann helfen, mehr Zeit zu gewinnen und den Ball kontrollierter zu spielen.',
		relatedGuideSlugs: ['padel-taktik']
	},
	{
		id: 'fortgeschritten-8',
		difficulty: 'fortgeschritten',
		question: 'Was ist ein taktischer Fehler am Netz?',
		options: [
			{ id: 'A', text: 'Den Ball früh zu nehmen' },
			{ id: 'B', text: 'Den Gegner unter Druck zu setzen' },
			{ id: 'C', text: 'Zu große Lücken zwischen den Partnern zu lassen' },
			{ id: 'D', text: 'Den Ball kontrolliert zu platzieren' }
		],
		correctOptionId: 'C',
		explanation:
			'Große Lücken zwischen den Partnern eröffnen einfache Angriffsmöglichkeiten für die Gegner.',
		relatedGuideSlugs: ['padel-doppel']
	},
	{
		id: 'fortgeschritten-9',
		difficulty: 'fortgeschritten',
		question: 'Warum sollte man nicht jeden hohen Ball smashen?',
		options: [
			{ id: 'A', text: 'Weil Smashes nie erlaubt sind' },
			{ id: 'B', text: 'Weil ein schlechter Smash dem Gegner eine gute Konterchance geben kann' },
			{ id: 'C', text: 'Weil hohe Bälle automatisch aus sind' },
			{ id: 'D', text: 'Weil der Punkt sonst wiederholt wird' }
		],
		correctOptionId: 'B',
		explanation:
			'Ein unplatzierter oder zu schwacher Smash kann leicht verteidigt oder gekontert werden.',
		relatedGuideSlugs: ['padel-technik', 'padel-taktik']
	},
	{
		id: 'fortgeschritten-10',
		difficulty: 'fortgeschritten',
		question: 'Was ist beim Return besonders wichtig?',
		options: [
			{ id: 'A', text: 'Sofort maximal hart schlagen' },
			{ id: 'B', text: 'Den Ball sicher ins Spiel bringen und möglichst tief platzieren' },
			{ id: 'C', text: 'Den Ball direkt an die eigene Wand spielen' },
			{ id: 'D', text: 'Absichtlich ins Netz spielen' }
		],
		correctOptionId: 'B',
		explanation:
			'Ein sicherer, tiefer Return verhindert einfache Angriffe des aufschlagenden Teams.',
		relatedGuideSlugs: ['padel-taktik']
	},

	// ------------------------------------------------------------
	// EXPERTE
	// ------------------------------------------------------------
	{
		id: 'experte-1',
		difficulty: 'experte',
		question:
			'Du stehst am Netz, der Gegner spielt einen sehr guten Lob über deine Rückhandseite. Was ist oft die beste Entscheidung?',
		options: [
			{ id: 'A', text: 'Rückwärts sprinten und blind smashen' },
			{ id: 'B', text: 'Den Ball kontrolliert mit Bandeja oder defensivem Schlag zurückbringen' },
			{ id: 'C', text: 'Den Ball absichtlich durchlassen' },
			{ id: 'D', text: 'Den Partner ignorieren' }
		],
		correctOptionId: 'B',
		explanation:
			'Unter Druck ist Kontrolle wichtiger als Risiko. Eine defensive Bandeja oder ein kontrollierter Rückzug ist oft besser als ein erzwungener Smash.',
		relatedGuideSlugs: ['padel-taktik', 'padel-technik']
	},
	{
		id: 'experte-2',
		difficulty: 'experte',
		question: 'Warum ist Tempoveränderung im Padel auf hohem Niveau wichtig?',
		options: [
			{ id: 'A', text: 'Damit der Ballwechsel zufällig wird' },
			{ id: 'B', text: 'Um Rhythmus, Position und Reaktionszeit der Gegner zu stören' },
			{ id: 'C', text: 'Weil harte Bälle immer gewinnen' },
			{ id: 'D', text: 'Weil langsame Bälle verboten sind' }
		],
		correctOptionId: 'B',
		explanation: 'Wechsel zwischen Tempo, Höhe und Platzierung machen das Spiel schwerer lesbar.',
		relatedGuideSlugs: ['padel-taktik']
	},
	{
		id: 'experte-3',
		difficulty: 'experte',
		question: 'Wann ist ein harter Smash strategisch riskant?',
		options: [
			{
				id: 'A',
				text: 'Wenn er nicht platziert ist und der Gegner ihn über Glas oder Gitter kontern kann'
			},
			{ id: 'B', text: 'Wenn man den Punkt gewinnen will' },
			{ id: 'C', text: 'Wenn der Ball hoch ist' },
			{ id: 'D', text: 'Immer beim ersten Spiel des Satzes' }
		],
		correctOptionId: 'A',
		explanation: 'Ein ungenauer Smash kann zurückkommen und die eigene Position schwächen.',
		relatedGuideSlugs: ['padel-technik']
	},
	{
		id: 'experte-4',
		difficulty: 'experte',
		question: 'Was ist ein sinnvolles Ziel einer Chiquita auf hohem Niveau?',
		options: [
			{ id: 'A', text: 'Den Gegner zu einem schwierigen Volley von unten zu zwingen' },
			{ id: 'B', text: 'Den Ball möglichst hoch an die Rückwand zu spielen' },
			{ id: 'C', text: 'Den Ball direkt zu verschenken' },
			{ id: 'D', text: 'Den Aufschlag zu ersetzen' }
		],
		correctOptionId: 'A',
		explanation:
			'Eine gute Chiquita zwingt den Gegner zu einem tiefen, unangenehmen Volley und kann helfen, das Netz zu erobern.',
		relatedGuideSlugs: ['padel-begriffe', 'padel-taktik']
	},
	{
		id: 'experte-5',
		difficulty: 'experte',
		question: 'Welche Entscheidung ist bei eigenem Druck am Netz oft sinnvoll?',
		options: [
			{ id: 'A', text: 'Nur auf maximale Härte setzen' },
			{
				id: 'B',
				text: 'Winkel öffnen, auf die Füße spielen oder Lücken zwischen den Gegnern suchen'
			},
			{ id: 'C', text: 'Den Ballwechsel abbrechen' },
			{ id: 'D', text: 'Immer in die Mitte der eigenen Hälfte spielen' }
		],
		correctOptionId: 'B',
		explanation:
			'Am Netz sind Platzierung, Winkel und Druck auf die Füße oft effektiver als reine Power.',
		relatedGuideSlugs: ['padel-taktik']
	},
	{
		id: 'experte-6',
		difficulty: 'experte',
		question: 'Warum ist die Mitte zwischen den Gegnern häufig ein gutes Ziel?',
		options: [
			{ id: 'A', text: 'Weil dort nie jemand steht' },
			{ id: 'B', text: 'Weil Zuständigkeiten unklar werden können und Winkel reduziert werden' },
			{ id: 'C', text: 'Weil der Ball dort doppelt zählt' },
			{ id: 'D', text: 'Weil nur dort gespielt werden darf' }
		],
		correctOptionId: 'B',
		explanation:
			'Die Mitte kann Kommunikation und Zuständigkeit testen und nimmt den Gegnern oft Winkel.',
		relatedGuideSlugs: ['padel-doppel', 'padel-taktik']
	},
	{
		id: 'experte-7',
		difficulty: 'experte',
		question:
			'Du verteidigst tief und die Gegner stehen sehr nah am Netz. Welche Option ist häufig sinnvoll?',
		options: [
			{ id: 'A', text: 'Ein kontrollierter Lob über beide Gegner' },
			{ id: 'B', text: 'Ein langsamer Ball ins eigene Netz' },
			{ id: 'C', text: 'Ein Smash aus der Defensive' },
			{ id: 'D', text: 'Den Ball direkt an die gegnerische Glaswand ohne Bodenkontakt' }
		],
		correctOptionId: 'A',
		explanation: 'Ein guter Lob kann das Netz zurückerobern und Druck aus der Situation nehmen.',
		relatedGuideSlugs: ['padel-taktik']
	},
	{
		id: 'experte-8',
		difficulty: 'experte',
		question: 'Was zeichnet gute Paar-Taktik aus?',
		options: [
			{ id: 'A', text: 'Beide Spieler treffen unabhängig voneinander Entscheidungen' },
			{ id: 'B', text: 'Gemeinsame Bewegungen, klare Rollen und abgestimmte Risikowahl' },
			{ id: 'C', text: 'Nur der stärkere Spieler spielt alle Bälle' },
			{ id: 'D', text: 'Möglichst große Abstände zwischen den Spielern' }
		],
		correctOptionId: 'B',
		explanation:
			'Erfolgreiche Paare bewegen sich abgestimmt und treffen taktische Entscheidungen gemeinsam.',
		relatedGuideSlugs: ['padel-doppel']
	},
	{
		id: 'experte-9',
		difficulty: 'experte',
		question: 'Wann kann ein langsamer Ball effektiver sein als ein harter Ball?',
		options: [
			{
				id: 'A',
				text: 'Wenn er den Gegner zu einem tiefen Treffpunkt oder einer unbequemen Bewegung zwingt'
			},
			{ id: 'B', text: 'Nie' },
			{ id: 'C', text: 'Nur beim Einspielen' },
			{ id: 'D', text: 'Nur bei Matchball' }
		],
		correctOptionId: 'A',
		explanation:
			'Ein langsamer, gut platzierter Ball kann Rhythmus brechen und Fehler provozieren.',
		relatedGuideSlugs: ['padel-taktik']
	},
	{
		id: 'experte-10',
		difficulty: 'experte',
		question: 'Was ist ein Zeichen für taktische Reife im Padel?',
		options: [
			{ id: 'A', text: 'Jeden Ball maximal riskant spielen' },
			{ id: 'B', text: 'Zwischen Risiko, Kontrolle, Platzierung und Position bewusst zu wählen' },
			{ id: 'C', text: 'Keine Lobs zu spielen' },
			{ id: 'D', text: 'Nur durch Kraft Punkte machen zu wollen' }
		],
		correctOptionId: 'B',
		explanation: 'Gute Spieler wählen situationsabhängig zwischen Sicherheit, Druck und Risiko.',
		relatedGuideSlugs: ['padel-taktik', 'padel-training']
	}
];

export function questionsFor(difficulty: QuizDifficultySlug): QuizQuestion[] {
	return QUIZ_QUESTIONS.filter((q) => q.difficulty === difficulty);
}
