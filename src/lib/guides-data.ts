// ============================================================
// PadelIndex — Ratgeber-Inhalte
// ============================================================
// Lokale Content-Quelle, kein CMS. Neuen Artikel ergänzen: Objekt vom
// Typ GuideArticle an dieses Array anhängen, Slug in relatedSlugs
// anderer Artikel verlinken wo sinnvoll — mehr braucht es nicht, die
// Routen unter /ratgeber/[slug] lesen direkt aus diesem Array.
//
// Bewusst keine erfundenen Zahlen, Preise oder Verbandsangaben:
// wo etwas variiert (Preise, Ausstattung, Vereinsregeln), steht das
// hier auch so da, statt eine falsche Genauigkeit vorzutäuschen.

import type { GuideArticle } from './guides';

export const GUIDES: GuideArticle[] = [
	// ------------------------------------------------------------
	// REGELN & WISSEN
	// ------------------------------------------------------------
	{
		slug: 'padel-regeln',
		title: 'Padel Regeln einfach erklärt: Der komplette Guide für Anfänger',
		metaTitle: 'Padel Regeln einfach erklärt: Der komplette Guide für Anfänger',
		metaDescription:
			'Die wichtigsten Padel-Regeln verständlich erklärt: Aufschlag, Punkte, Glas, Wände, Netz, Fehler und typische Spielsituationen.',
		excerpt:
			'Aufschlag, Zählweise, Glas und Aus-Regeln — alles, was du für dein erstes Match wissen musst, kompakt erklärt.',
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
				heading: 'Was ist Padel?',
				paragraphs: [
					'Padel ist ein Rückschlagsport, der fast immer im Doppel gespielt wird — also zwei gegen zwei. Gespielt wird auf einem eingezäunten Court, der deutlich kleiner ist als ein Tennisplatz, umgeben von Glaswänden und Gittern.',
					'Das Besondere: Der Ball darf nach dem Aufspringen die eigenen Wände berühren und bleibt trotzdem im Spiel. Dadurch entstehen lange, spannende Ballwechsel, die auch für Einsteiger schnell Spaß machen — Kraft allein entscheidet selten, Platzierung und Geduld zählen mehr.',
					'Geschlagen wird mit einem festen, gelochten Schläger ohne Saiten, der Ball ähnelt einem etwas drucklosen Tennisball. Das Netz steht wie beim Tennis in der Mitte des Courts.'
				]
			},
			{
				id: 'spielfeld-und-grundprinzip',
				heading: 'Spielfeld und Grundprinzip',
				paragraphs: [
					'Ein Padel-Court ist ein umschlossenes Rechteck: an den Grundlinien meist Glaswände, an den Seiten oft Gitter oder ebenfalls Glas. Das Netz teilt den Court in zwei Hälften, jede Hälfte hat wiederum ein Aufschlagfeld links und rechts, ähnlich wie beim Tennis.',
					'Der Court ist deutlich kompakter als ein Tennisplatz. Das sorgt für kurze Wege, viele Ballkontakte und macht Padel auch für Neueinsteiger körperlich gut zugänglich.',
					'Grundprinzip: Ihr spielt den Ball wie beim Tennis über das Netz, bis er zweimal auf dem Boden aufkommt oder ein Fehler passiert — nur dass die Wände dabei aktiv mitspielen dürfen.'
				]
			},
			{
				id: 'zaehlweise',
				heading: 'Zählweise beim Padel',
				paragraphs: [
					'Die Zählweise ist die aus dem Tennis bekannte: 15, 30, 40 und Spielgewinn. Steht es 40:40, spricht man von Einstand — danach muss ein Team zwei Punkte in Folge gewinnen, um das Spiel zu holen (manche Freizeitrunden spielen stattdessen "Golden Point", also einen entscheidenden Punkt — das ist Vereinbarungssache).',
					'Mehrere gewonnene Spiele ergeben einen Satz, mehrere Sätze ein Match — meist wird auf zwei Gewinnsätze gespielt. Für den Satzgewinn braucht ein Team in der Regel sechs Spiele mit mindestens zwei Spielen Vorsprung, bei Gleichstand entscheidet oft ein Tiebreak.'
				]
			},
			{
				id: 'aufschlag-regeln',
				heading: 'Aufschlag-Regeln',
				paragraphs: [
					'Der Aufschlag erfolgt von unten: Der Ball muss zuerst auf dem Boden aufspringen, erst danach schlägst du ihn — anders als beim Tennis, wo von oben aufgeschlagen wird. Der Treffpunkt darf dabei nicht höher als Hüfthöhe liegen.',
					'Aufgeschlagen wird diagonal ins gegnerische Aufschlagfeld, ein Fuß muss dabei hinter der Aufschlaglinie bleiben. Nach jedem gewonnenen Spiel wechselt der Aufschlag zum anderen Team, innerhalb eines Teams wechseln sich die Partner meist ab.',
					'Wie beim Tennis gibt es einen zweiten Versuch, wenn der erste Aufschlag danebengeht (Doppelfehler kostet den Punkt).'
				]
			},
			{
				id: 'aus',
				heading: 'Wann ist der Ball im Aus?',
				paragraphs: [
					'Der Ball ist aus, wenn er außerhalb der Feldbegrenzung den Boden berührt, oder wenn er die Glaswand oder das Gitter berührt, bevor er im gegnerischen Feld aufgekommen ist.',
					'Auch ein Ball, der über die umlaufende Umzäunung hinaus das Feld verlässt, ohne vorher regulär im Feld aufgekommen zu sein, zählt als Fehler. Grundsätzlich gilt: Erst muss der Ball im richtigen Feld auf dem Boden aufkommen — danach darf er (auf der eigenen Seite) beliebig oft von Wänden abprallen, solange er im Spiel bleibt.'
				]
			},
			{
				id: 'glas-und-waende',
				heading: 'Glas, Gitter und Wände erklärt',
				paragraphs: [
					'Das ist der Punkt, der Padel für Einsteiger anfangs am meisten verwirrt: Nachdem der Ball auf dem Boden aufgekommen ist, darf er die eigene Wand oder das eigene Gitter berühren und bleibt im Spiel — du darfst ihn dann noch zurückschlagen.',
					'Umgekehrt gilt: Schlägst du den Ball direkt in die gegnerische Wand, ohne dass er vorher im gegnerischen Feld aufgekommen ist, ist das ein Fehler. Die Wand ist also kein Ersatz für den Bodenkontakt, sondern kommt erst danach ins Spiel.',
					'Mit etwas Übung wird das Spiel mit dem Glas zu einem der spannendsten Teile von Padel — es eröffnet Rückschlagmöglichkeiten, die es im Tennis so nicht gibt.'
				]
			},
			{
				id: 'netzspiel-volleys',
				heading: 'Netzspiel und Volleys',
				paragraphs: [
					'Volleys (den Ball aus der Luft schlagen, bevor er den Boden berührt) sind grundsätzlich erlaubt und im Padel sogar ein zentraler Taktikbaustein — am Netz zu stehen und Bälle früh zu nehmen, ist oft die stärkste Position.',
					'Eine wichtige Ausnahme: Beim Aufschlag darf der Return nicht als Volley gespielt werden, solange sich der Ball noch im Aufschlagfeld bewegt — hier gelten je nach Verband leicht unterschiedliche Detailregeln, im Zweifel hilft ein Blick in die Regeln des jeweiligen Verbands oder eine kurze Nachfrage im Verein.'
				]
			},
			{
				id: 'anfaengerfehler',
				heading: 'Typische Fehler von Anfängern',
				box: {
					kind: 'mistakes',
					title: 'Diese Fehler siehst du in fast jedem Anfänger-Match',
					items: [
						'Den Ball bei jeder Gelegenheit maximal hart schlagen, statt kontrolliert zu platzieren.',
						'Vor dem Bodenkontakt schon an die Wand denken — erst muss der Ball im Feld aufkommen.',
						'Zu weit hinten stehen bleiben, obwohl das Netz die stärkere Position wäre.',
						'Den Aufschlag von oben wie beim Tennis versuchen, statt von unten nach Bodenkontakt.',
						'Nicht mit dem Partner sprechen, wodurch Bälle in der Mitte liegen bleiben oder doppelt angelaufen werden.'
					]
				}
			},
			{
				id: 'checkliste',
				heading: 'Kurze Regel-Checkliste',
				box: {
					kind: 'checklist',
					title: 'Vor deinem ersten Match',
					items: [
						'Aufschlag von unten, nach Bodenkontakt, diagonal ins gegnerische Feld.',
						'Ball muss zuerst im Feld aufkommen, bevor Wand oder Gitter berührt werden dürfen.',
						'Zählweise wie Tennis: 15, 30, 40, Spiel — Einstand bei 40:40.',
						'Direkter Wandkontakt vor dem Bodenaufsprung ist ein Fehler.',
						'Volleys sind erlaubt (außer teils beim Return direkt nach Aufschlag).'
					]
				}
			}
		],
		faq: [
			{
				question: 'Ist Padel schwer zu lernen?',
				answer:
					'Die Grundregeln lassen sich in wenigen Minuten verstehen, und die ersten Ballwechsel gelingen meist schon in der ersten Stunde. Das Spiel mit dem Glas und feinere Taktik brauchen dagegen etwas mehr Übung — typisch für einen Sport mit niedriger Einstiegshürde, aber viel Tiefe nach oben.'
			},
			{
				question: 'Muss ich Tennis können, um Padel zu spielen?',
				answer:
					'Nein. Padel hat eigene Grundtechniken und ist bewusst zugänglich gestaltet. Tenniserfahrung kann bei Ballgefühl und Schlagtechnik helfen, ist aber keine Voraussetzung.'
			},
			{
				question: 'Wie viele Sätze werden im Padel gespielt?',
				answer:
					'Im Turnier meist auf zwei Gewinnsätze, in der Freizeit einigen sich viele Gruppen auf einen Satz oder ein Zeitlimit — das ist unter Freizeitspielern gängige Praxis und keine feste Vorschrift.'
			},
			{
				question: 'Was passiert, wenn der Ball die Decke einer Halle trifft?',
				answer:
					'In Hallen mit Überdachung gelten je nach Anlage und Verband unterschiedliche Zusatzregeln. Am besten vorher kurz beim Betreiber oder Verein nachfragen, falls das nicht eindeutig ausgeschildert ist.'
			}
		]
	},
	{
		slug: 'padel-vs-tennis',
		title: 'Padel vs. Tennis: Die wichtigsten Unterschiede einfach erklärt',
		metaTitle: 'Padel vs. Tennis: Die wichtigsten Unterschiede einfach erklärt',
		metaDescription:
			'Padel und Tennis im Vergleich: Spielfeld, Schläger, Regeln, Technik, Taktik, Einstieg und Kosten.',
		excerpt:
			'Was Padel und Tennis gemeinsam haben — und wo sie sich in Feld, Schlägern, Regeln und Taktik unterscheiden.',
		category: 'regeln',
		difficulty: 'einsteiger',
		readingTime: 8,
		updatedAt: '2026-08-01',
		popular: true,
		relatedSlugs: ['padel-regeln', 'padel-fuer-anfaenger', 'padel-schlaeger', 'padel-begriffe'],
		sections: [
			{
				id: 'gemeinsamkeiten',
				heading: 'Gemeinsamkeiten',
				paragraphs: [
					'Beide Sportarten sind Rückschlagspiele mit Netz, ähnlicher Zählweise (15, 30, 40, Spiel) und dem Ziel, den Ball so zu platzieren, dass der Gegner ihn nicht mehr erreicht.',
					'Wer schon Tennis gespielt hat, bringt ein gutes Grundgefühl für Ballflug, Timing und Positionsspiel mit — das hilft beim Einstieg in Padel spürbar, auch wenn die Technik im Detail anders ist.'
				]
			},
			{
				id: 'spielfeld',
				heading: 'Unterschiede beim Spielfeld',
				paragraphs: [
					'Ein Padel-Court ist deutlich kleiner als ein Tennisplatz und komplett umschlossen: Glaswände und Gitter statt offener Fläche. Diese Wände sind aktiver Teil des Spiels, nicht nur Begrenzung.',
					'Padel wird praktisch immer im Doppel gespielt, Tennis meist im Einzel oder Doppel gleichermaßen üblich.'
				]
			},
			{
				id: 'schlaeger-baelle',
				heading: 'Unterschiede bei Schlägern und Bällen',
				paragraphs: [
					'Padelschläger sind kürzer, haben keine Saiten, sondern eine feste, gelochte Fläche aus Carbon- oder Glasfaser-Verbundmaterialien mit einem Schaumkern. Tennisschläger haben einen längeren Griff und ein besaitetes, ovales Blatt.',
					'Padelbälle ähneln Tennisbällen, haben aber meist etwas weniger Innendruck, damit sie zum kleineren Court und den Wänden passen.'
				]
			},
			{
				id: 'aufschlag-regeln-vergleich',
				heading: 'Aufschlag und Regeln',
				paragraphs: [
					'Im Tennis wird von oben aufgeschlagen, im Padel von unten nach Bodenkontakt. Die größte strukturelle Neuerung im Padel ist die Wand: Nach dem Bodenaufsprung darf der Ball auf der eigenen Seite die Wand berühren und bleibt im Spiel — das gibt es im Tennis nicht.'
				]
			},
			{
				id: 'tempo-taktik',
				heading: 'Spieltempo und Taktik',
				paragraphs: [
					'Padel lebt stark vom Netzspiel: Weil der Court kleiner ist und Wände lange Ballwechsel ermöglichen, ist Positionierung am Netz oft entscheidender als reine Schlaghärte. Im Tennis entscheiden Grundlinienduelle, Aufschlagstärke und größere Laufwege eine größere Rolle.',
					'Dadurch wirkt Padel für viele Einsteiger zugänglicher: Auch mit moderater Athletik lassen sich lange, kluge Ballwechsel spielen.'
				]
			},
			{
				id: 'einstieg-tennisspieler',
				heading: 'Einstieg für Tennisspieler',
				paragraphs: [
					'Tennisspieler müssen vor allem zwei Dinge umlernen: den Aufschlag von unten und den bewussten Umgang mit den Wänden, statt jeden Ball zu vermeiden, der Richtung Wand fliegt. Die Vorhand- und Rückhandgrundlagen lassen sich dagegen meist gut übertragen.',
					'Ein häufiger Anfangsfehler von Umsteigern: reflexhaft hart schlagen, wie man es vom Tennis gewohnt ist — im Padel führt das wegen der Wände oft eher zu einfachen Bällen für den Gegner.'
				]
			},
			{
				id: 'was-ist-einfacher',
				heading: 'Was ist einfacher zu lernen?',
				paragraphs: [
					'Für komplette Einsteiger gilt Padel allgemein als zugänglicher: kleinerer Court, kürzere Laufwege, verzeihende Wände und ein Doppelformat, bei dem man sich die Fläche mit einem Partner teilt. Tennis erfordert früher eine präzisere Schlagtechnik, um den Ball überhaupt sicher im großen Feld zu halten.',
					'Das heißt nicht, dass Padel "leichter" im Sinne von weniger anspruchsvoll ist — auf höherem Niveau ist die taktische Tiefe beachtlich. Der Einstieg gelingt aber in der Regel schneller.'
				]
			}
		],
		faq: [
			{
				question: 'Kann ich mit Tenniserfahrung sofort gut Padel spielen?',
				answer:
					'Du bringst ein gutes Grundgefühl mit, musst dich aber an Aufschlag und Wandspiel neu gewöhnen. Die ersten Trainingseinheiten fühlen sich für viele Tennisspieler ungewohnt an, bevor es klickt.'
			},
			{
				question: 'Brauche ich für Padel dieselben Schuhe wie für Tennis?',
				answer:
					'Nicht unbedingt — Padelschuhe sind auf die schnellen, kurzen Richtungswechsel im kleineren Feld optimiert. Mehr dazu im Ratgeber zu Padelschuhen.'
			},
			{
				question: 'Ist Padel für Tennisplätze mit umgebauten Courts entstanden?',
				answer:
					'Padel hat eine eigenständige Entstehungsgeschichte und eigene Feldmaße. Manche Anlagen bauen zwar Tennisplätze zu Padel-Courts um, das ist aber eine bauliche Entscheidung einzelner Betreiber, keine Regel des Sports.'
			}
		]
	},
	{
		slug: 'padel-begriffe',
		title: 'Padel Begriffe erklärt: Bandeja, Vibora, Chiquita, Lob und mehr',
		metaTitle: 'Padel Begriffe erklärt: Bandeja, Vibora, Chiquita, Lob und mehr',
		metaDescription:
			'Die wichtigsten Padel-Begriffe einfach erklärt. Ideal für Anfänger, die Padel-Regeln, Schläge und Taktik besser verstehen wollen.',
		excerpt:
			'Von Bandeja bis Chiquita: das kleine Padel-Wörterbuch für alle, die beim Reden auf dem Court mithalten wollen.',
		category: 'regeln',
		difficulty: 'einsteiger',
		readingTime: 7,
		updatedAt: '2026-08-01',
		beginnerRecommended: true,
		relatedSlugs: ['padel-technik', 'padel-taktik', 'padel-regeln', 'padel-doppel'],
		sections: [
			{
				id: 'grundbegriffe',
				heading: 'Grundbegriffe',
				paragraphs: [
					'Court: das Spielfeld, umschlossen von Glaswänden und Gittern.',
					'Aus: der Ball ist ungültig geworden, der Punkt geht an die Gegenseite.',
					'Golden Point: bei Einstand entscheidet ein einzelner Punkt statt der Zwei-Punkte-Regel — eine in der Freizeit beliebte Abkürzung, keine feste Turnierpflicht überall.'
				]
			},
			{
				id: 'schlagbegriffe',
				heading: 'Schlagbegriffe',
				paragraphs: [
					'Bandeja: ein kontrollierter Überkopfschlag, meist gespielt, um die Netzposition zu halten statt den Punkt sofort zu beenden.',
					'Vibora: eine Variante der Bandeja mit mehr Seitspin, oft noch aggressiver in der Ballplatzierung.',
					'Chiquita: ein flacher, kontrollierter Ball, der tief auf die Füße der am Netz stehenden Gegner gespielt wird.',
					'Smash: der harte Schlag von oben, meist der Punktgewinnschlag schlechthin — aber nur, wenn er gut platziert ist.',
					'Lob: ein hoher Ball über die Gegner hinweg, um sie vom Netz zurückzudrängen.'
				]
			},
			{
				id: 'taktikbegriffe',
				heading: 'Taktikbegriffe',
				paragraphs: [
					'Netzposition: der taktisch meist stärkste Standort nahe am Netz, von dem aus Druck aufgebaut wird.',
					'Return: der Rückschlag auf den gegnerischen Aufschlag.',
					'Winner: ein Schlag, den der Gegner gar nicht mehr erreicht — der Punkt ist direkt gewonnen.'
				]
			},
			{
				id: 'spielfeldbegriffe',
				heading: 'Spielfeldbegriffe',
				paragraphs: [
					'Grundlinie: die hintere Begrenzungslinie des Feldes, direkt vor der Glaswand.',
					'Aufschlagfeld: das diagonale Zielfeld, in das der Aufschlag muss.',
					'Mittellinie: teilt jede Feldhälfte in ein linkes und rechtes Aufschlagfeld.'
				]
			},
			{
				id: 'spanische-begriffe',
				heading: 'Häufige spanische Begriffe',
				paragraphs: [
					'Padel hat spanische und südamerikanische Wurzeln, viele Fachbegriffe stammen deshalb aus dem Spanischen und werden international unverändert verwendet — auch im deutschsprachigen Padel-Alltag hörst du sie ständig: "Bandeja", "Vibora" und "Chiquita" sind Beispiele dafür.'
				]
			},
			{
				id: 'glossar',
				heading: 'Mini-Glossar A–Z',
				box: {
					kind: 'info',
					title: 'Die wichtigsten Begriffe auf einen Blick',
					items: [
						'Bandeja — kontrollierter Überkopfschlag zur Netzsicherung',
						'Chiquita — flacher Ball auf die Füße der Netzspieler',
						'Golden Point — entscheidender Einzelpunkt bei Einstand',
						'Lob — hoher Ball über die Gegner hinweg',
						'Return — Rückschlag auf den Aufschlag',
						'Smash — harter Schlag von oben',
						'Vibora — Bandeja-Variante mit mehr Seitspin',
						'Winner — direkt gewonnener Punkt'
					]
				}
			}
		],
		faq: [
			{
				question: 'Muss ich alle Fachbegriffe kennen, um Padel zu spielen?',
				answer:
					'Nein. Für den Einstieg reichen Grundregeln und ein paar Schlagnamen. Die Begriffe helfen aber, Training und Taktikgespräche im Verein besser zu verstehen.'
			},
			{
				question: 'Warum sind viele Padel-Begriffe spanisch?',
				answer:
					'Padel hat seine Wurzeln im spanischsprachigen Raum, weshalb sich viele Fachbegriffe international unübersetzt durchgesetzt haben.'
			}
		]
	},

	// ------------------------------------------------------------
	// AUSRÜSTUNG
	// ------------------------------------------------------------
	{
		slug: 'padel-ausruestung',
		title: 'Padel Ausrüstung: Was du zum Spielen wirklich brauchst',
		metaTitle: 'Padel Ausrüstung: Was du zum Spielen wirklich brauchst',
		metaDescription:
			'Padel-Ausrüstung für Anfänger und Fortgeschrittene: Schläger, Schuhe, Bälle, Kleidung und sinnvolles Zubehör einfach erklärt.',
		excerpt: 'Die Grundausstattung für den Einstieg — und was du dir getrost erst später zulegst.',
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
				heading: 'Grundausstattung',
				paragraphs: [
					'Für den Einstieg brauchst du im Kern drei Dinge: einen Padelschläger, passende Schuhe und Padelbälle. Viele Anlagen verleihen Schläger für die ersten Male, sodass du nicht sofort investieren musst.',
					'Alles Weitere — spezielle Kleidung, Taschen, Griffbänder — ist sinnvoll, aber nicht entscheidend für deine ersten Matches.'
				]
			},
			{
				id: 'padelschlaeger',
				heading: 'Padelschläger',
				paragraphs: [
					'Der Schläger ist die wichtigste Anschaffung. Anfänger fahren meist gut mit einer runden oder tropfenförmigen Form, die mehr Kontrolle und größere Treffzone bietet. Details zu Formen, Gewicht und Auswahl findest du im eigenen Ratgeber zu Padelschlägern.'
				]
			},
			{
				id: 'padelschuhe',
				heading: 'Padelschuhe',
				paragraphs: [
					'Padel wird mit vielen kurzen Sprints und schnellen Richtungswechseln gespielt. Spezielle Padelschuhe bieten dafür passenden Grip und seitliche Stabilität — mehr dazu im Ratgeber zu Padelschuhen. Für den allerersten Test tun es meist auch stabile Hallensport- oder Tennisschuhe.'
				]
			},
			{
				id: 'padelbaelle',
				heading: 'Padelbälle',
				paragraphs: [
					'Padelbälle sehen Tennisbällen ähnlich, haben aber meist etwas weniger Innendruck. Die meisten Anlagen und Vereine stellen Bälle bereit oder verkaufen sie vor Ort — als Einsteiger musst du dir dazu selten selbst Gedanken machen.'
				]
			},
			{
				id: 'kleidung',
				heading: 'Kleidung',
				paragraphs: [
					'Normale Sportkleidung reicht völlig aus: atmungsaktives Shirt, bewegungsfreundliche Shorts oder Rock, Sportsocken. Spezielle Padel-Kollektionen sind optisch nett, aber keine Voraussetzung.'
				]
			},
			{
				id: 'zubehoer',
				heading: 'Zubehör',
				paragraphs: [
					'Sinnvolle Ergänzungen mit der Zeit: eine Schlägertasche zum Transport, ein Überzieh-Griffband, wenn der Originalgriff durchgespielt ist, und ein Vibrationsdämpfer, falls dir der Aufprall im Arm zu stark ist. Alles optional, nichts davon ist am ersten Tag wichtig.'
				]
			},
			{
				id: 'nicht-sofort-kaufen',
				heading: 'Was Anfänger nicht sofort kaufen müssen',
				box: {
					kind: 'tips',
					title: 'Kann warten, bis du weißt, ob Padel dein Sport wird',
					items: [
						'Ein teurer Profi-Schläger — ein solider Einsteiger- oder Leihschläger reicht für die ersten Monate.',
						'Eine komplette Padel-Bekleidungskollektion.',
						'Eigene Bälle in größeren Mengen — die meisten Anlagen stellen sie.',
						'Zubehör wie Overgrips oder Dämpfer, bevor du überhaupt regelmäßig spielst.'
					]
				}
			},
			{
				id: 'kauf-checkliste',
				heading: 'Kauf-Checkliste',
				box: {
					kind: 'checklist',
					title: 'Vor dem ersten Kauf',
					items: [
						'Erst 1–2 Mal mit Leihschläger spielen, bevor du investierst.',
						'Schläger nach Kontrolle statt nach Optik auswählen (siehe Ratgeber Padelschläger).',
						'Schuhe mit gutem Seitenhalt statt reinen Laufschuhen wählen.',
						'Bei der Anlage nachfragen, ob Bälle gestellt werden.',
						'Bequeme, bewegungsfreundliche Sportkleidung reicht völlig.'
					]
				}
			}
		],
		faq: [
			{
				question: 'Kann ich mit Tennisschlägern Padel spielen?',
				answer:
					'Nein, Padelschläger sind ein eigenes Sportgerät ohne Saiten mit fester, gelochter Fläche. Ein Tennisschläger funktioniert dafür nicht.'
			},
			{
				question: 'Brauche ich sofort eigene Ausrüstung?',
				answer:
					'Nein. Viele Anlagen verleihen Schläger, und Bälle werden meist gestellt. Für den Einstieg reicht bequeme Sportkleidung und passendes Schuhwerk.'
			},
			{
				question: 'Wie oft muss ich Ausrüstung ersetzen?',
				answer:
					'Das hängt stark von Spielhäufigkeit und Material ab. Schuhe nutzen sich durch die vielen Richtungswechsel spürbar ab, Schläger halten bei Freizeitspielern in der Regel deutlich länger.'
			}
		]
	},
	{
		slug: 'padel-schlaeger',
		title: 'Padelschläger für Anfänger: Formen, Gewicht und Auswahl erklärt',
		metaTitle: 'Padelschläger für Anfänger: Formen, Gewicht und Auswahl erklärt',
		metaDescription:
			'So findest du den passenden Padelschläger: runde, tropfenförmige und diamantförmige Schläger, Gewicht, Balance und Spielstil.',
		excerpt:
			'Rund, Tropfen oder Diamant? So wählst du die passende Schlägerform für deinen Spielstil.',
		category: 'ausruestung',
		difficulty: 'einsteiger',
		readingTime: 8,
		updatedAt: '2026-08-01',
		relatedSlugs: ['padel-ausruestung', 'padel-schuhe', 'padel-technik', 'padel-kosten'],
		sections: [
			{
				id: 'warum-wichtig',
				heading: 'Warum der richtige Schläger wichtig ist',
				paragraphs: [
					'Der Schläger beeinflusst direkt, wie leicht dir Kontrolle fällt und wie viel Kraft du für einen Schlag investieren musst. Ein zum Spielstil passender Schläger macht die Lernkurve am Anfang spürbar angenehmer.',
					'Es gibt keinen objektiv "besten" Schläger — nur den, der zu deinem aktuellen Niveau und Spielstil passt.'
				]
			},
			{
				id: 'formen',
				heading: 'Schlägerformen erklärt',
				paragraphs: [
					'Rund: größte Treffzone (Sweet Spot), sehr kontrollfreundlich, meist die empfohlene Form für den Einstieg.',
					'Tropfenförmig: Mischform zwischen Kontrolle und Power, guter Kompromiss für Spieler mit erster Erfahrung.',
					'Diamantförmig: Schwerpunkt weiter oben im Schlägerkopf, mehr Power, kleinerer Sweet Spot — eher für fortgeschrittene Spieler mit sauberer Technik.'
				]
			},
			{
				id: 'gewicht-balance',
				heading: 'Gewicht und Balance',
				paragraphs: [
					'Leichtere Schläger lassen sich schneller führen und schonen Arm und Schulter, schwerere Schläger bringen mehr Wucht in den Schlag, verlangen aber auch mehr Kontrolle und Kraft.',
					'Für Einsteiger empfiehlt sich in der Regel eher die leichtere bis mittlere Gewichtsklasse — Kontrolle first, Power kommt mit der Zeit von allein dazu.'
				]
			},
			{
				id: 'kontrolle-vs-power',
				heading: 'Kontrolle vs. Power',
				paragraphs: [
					'Kontrollorientierte Schläger (meist rund, ausgewogene Balance) verzeihen mehr und helfen, den Ball sicher im Spiel zu halten. Power-orientierte Schläger (meist diamantförmig, kopflastig) belohnen präzise Technik mit mehr Wucht, bestrafen Fehler aber auch stärker.',
					'Als Faustregel: Wer noch an der Grundtechnik arbeitet, profitiert fast immer mehr von Kontrolle als von zusätzlicher Power.'
				]
			},
			{
				id: 'anfaenger-schlaeger',
				heading: 'Schläger für Anfänger',
				paragraphs: [
					'Ein runder oder tropfenförmiger Schläger mit moderatem Gewicht ist für die meisten Einsteiger die passende Wahl. Er verzeiht ungenaue Treffpunkte und macht das Erlernen der Grundschläge einfacher.'
				]
			},
			{
				id: 'fortgeschrittene-schlaeger',
				heading: 'Schläger für Fortgeschrittene',
				paragraphs: [
					'Mit sicherer Technik lohnt sich der Blick auf tropfenförmige oder diamantförmige Modelle mit mehr Power, je nachdem, ob eher Kontrolle oder Angriffsspiel im Vordergrund steht.'
				]
			},
			{
				id: 'kauffehler',
				heading: 'Fehler beim Kauf',
				box: {
					kind: 'mistakes',
					title: 'Das führt oft zu Frust mit dem neuen Schläger',
					items: [
						'Einen Profi- oder Power-Schläger kaufen, obwohl die Grundtechnik noch nicht sitzt.',
						'Nur nach Optik oder Marke entscheiden, statt Form und Gewicht zu prüfen.',
						'Einen deutlich zu schweren Schläger wählen — das belastet Arm und Schulter unnötig.',
						'Vor dem Kauf nicht probespielen oder beraten lassen, obwohl viele Shops das anbieten.'
					]
				}
			},
			{
				id: 'checkliste',
				heading: 'Schläger-Checkliste',
				box: {
					kind: 'checklist',
					title: 'Vor dem Kauf prüfen',
					items: [
						'Form: rund oder tropfenförmig für den Einstieg.',
						'Gewicht: eher leicht bis mittel, besonders bei Arm- oder Schulterproblemen.',
						'Balance: ausgewogen statt kopflastig, wenn Kontrolle im Vordergrund steht.',
						'Wenn möglich vorher probespielen oder leihen.',
						'Erst nach ein paar Trainingseinheiten final entscheiden.'
					]
				}
			}
		],
		faq: [
			{
				question: 'Welche Schlägerform ist am besten für Anfänger?',
				answer:
					'In der Regel eine runde Form: größter Sweet Spot, am meisten Kontrolle, am verzeihendsten bei ungenauen Treffpunkten.'
			},
			{
				question: 'Wie schwer sollte mein erster Padelschläger sein?',
				answer:
					'Tendenziell eher leicht bis mittel. Genaue Gewichtsangaben variieren je nach Hersteller — am besten im Fachhandel beraten lassen oder verschiedene Modelle probieren.'
			},
			{
				question: 'Muss ich als Anfänger gleich viel Geld ausgeben?',
				answer:
					'Nein. Solide Einsteigermodelle gibt es in moderaten Preislagen, und viele Vereine verleihen ohnehin Schläger für die ersten Male.'
			}
		]
	},
	{
		slug: 'padel-schuhe',
		title: 'Padel Schuhe: Worauf du beim Kauf achten solltest',
		metaTitle: 'Padel Schuhe: Worauf du beim Kauf achten solltest',
		metaDescription:
			'Padelschuhe erklärt: Grip, Stabilität, Dämpfung, Sohlenprofile und Unterschiede zu Tennis- oder Laufschuhen.',
		excerpt:
			'Warum normale Laufschuhe auf dem Court schnell an ihre Grenzen kommen — und was Padelschuhe anders machen.',
		category: 'ausruestung',
		difficulty: 'einsteiger',
		readingTime: 7,
		updatedAt: '2026-08-01',
		relatedSlugs: ['padel-ausruestung', 'padel-schlaeger', 'padel-fuer-anfaenger', 'padel-kosten'],
		sections: [
			{
				id: 'warum-spezielle-schuhe',
				heading: 'Warum spezielle Schuhe wichtig sind',
				paragraphs: [
					'Padel verlangt viele kurze Sprints, abrupte Stopps und seitliche Richtungswechsel auf vergleichsweise kleinem Raum. Laufschuhe sind für geradlinige Bewegung optimiert und bieten dafür oft zu wenig seitlichen Halt.',
					'Padelschuhe sind speziell für diese Belastung gebaut — mit einer für den Belag passenden Sohle und mehr Unterstützung an den Seiten.'
				]
			},
			{
				id: 'grip-sohlenprofil',
				heading: 'Grip und Sohlenprofil',
				paragraphs: [
					'Der Belag auf Padel-Courts (meist Teppich mit Sand-Einstreuung) verlangt ein eigenes Sohlenprofil, das genug Grip für schnelle Starts und Stopps bietet, ohne beim Rutschen und Drehen zu blockieren.',
					'Zu grobstollige Sohlen (wie bei manchen Outdoor- oder Laufschuhen) können sich im Belag verhaken, zu glatte Sohlen rutschen unkontrolliert — Padelschuhe suchen bewusst den Mittelweg.'
				]
			},
			{
				id: 'stabilitaet',
				heading: 'Stabilität bei Richtungswechseln',
				paragraphs: [
					'Eine verstärkte seitliche Stützstruktur schützt vor Umknicken bei den schnellen seitlichen Bewegungen, die im Padel ständig vorkommen. Das ist einer der größten Unterschiede zu klassischen Laufschuhen, die primär auf geradlinige Dämpfung ausgelegt sind.'
				]
			},
			{
				id: 'daempfung',
				heading: 'Dämpfung',
				paragraphs: [
					'Weil viele kurze, harte Stopps und Antritte anfallen, brauchen Padelschuhe eine Dämpfung, die Gelenke bei genau diesen Belastungsmustern entlastet — nicht identisch mit der Dämpfung eines Laufschuhs, der auf gleichmäßige, geradlinige Schritte ausgelegt ist.'
				]
			},
			{
				id: 'indoor-outdoor',
				heading: 'Indoor vs. Outdoor',
				paragraphs: [
					'Manche Modelle sind speziell für Hallenböden oder für Außen-Courts optimiert, andere funktionieren für beides. Falls du überwiegend an einem Anlagentyp spielst, lohnt sich der Blick auf die Herstellerangabe zum Einsatzbereich.'
				]
			},
			{
				id: 'haeufige-fehler',
				heading: 'Häufige Fehler',
				box: {
					kind: 'mistakes',
					title: 'Diese Schuhwahl bereut man oft schnell',
					items: [
						'Normale Laufschuhe für regelmäßiges Padel-Training nutzen.',
						'Tennisschuhe ungeprüft übernehmen — manche funktionieren gut, andere nicht, das hängt vom Modell ab.',
						'Auf Passform und Seitenhalt beim Kauf nicht achten, nur auf Optik.',
						'Deutlich zu enge oder zu weite Schuhe kaufen "weil sie im Angebot waren".'
					]
				}
			},
			{
				id: 'kauf-checkliste',
				heading: 'Kauf-Checkliste',
				box: {
					kind: 'checklist',
					title: 'Vor dem Schuhkauf',
					items: [
						'Seitenhalt und Stabilität testen, nicht nur Dämpfung nach vorn.',
						'Sohlenprofil zum Belag deiner Stamm-Anlage passend wählen.',
						'Passform in der Anlage oder im Fachhandel prüfen, wenn möglich.',
						'Bei häufigem Spielen auf Verschleiß der Außensohle achten.'
					]
				}
			}
		],
		faq: [
			{
				question: 'Kann ich Tennisschuhe für Padel benutzen?',
				answer:
					'Teilweise ja, je nach Modell — viele Tennisschuhe bieten bereits guten Seitenhalt. Für regelmäßiges Spielen lohnen sich aber speziell für Padel entwickelte Schuhe.'
			},
			{
				question: 'Warum sind Laufschuhe für Padel ungeeignet?',
				answer:
					'Laufschuhe sind auf geradlinige Bewegung optimiert und bieten meist zu wenig seitlichen Halt für die schnellen Richtungswechsel im Padel — das erhöht das Verletzungsrisiko.'
			},
			{
				question: 'Wie schnell nutzen sich Padelschuhe ab?',
				answer:
					'Das hängt stark von Spielhäufigkeit, Belag und Bewegungsstil ab. Wer sehr viel und intensiv spielt, wird die Außensohle schneller abnutzen als Gelegenheitsspieler.'
			}
		]
	},

	// ------------------------------------------------------------
	// TECHNIK & TAKTIK
	// ------------------------------------------------------------
	{
		slug: 'padel-technik',
		title: 'Padel Technik: Die wichtigsten Schläge einfach erklärt',
		metaTitle: 'Padel Technik: Die wichtigsten Schläge einfach erklärt',
		metaDescription:
			'Die wichtigsten Padel-Schläge im Überblick: Vorhand, Rückhand, Volley, Bandeja, Vibora, Lob und Smash.',
		excerpt: 'Von der Vorhand bis zur Bandeja — die Grundschläge, die jedes Padel-Match ausmachen.',
		category: 'technik-taktik',
		difficulty: 'fortgeschritten',
		readingTime: 9,
		updatedAt: '2026-08-01',
		relatedSlugs: ['padel-taktik', 'padel-begriffe', 'padel-training', 'padel-doppel'],
		sections: [
			{
				id: 'grundhaltung',
				heading: 'Grundhaltung',
				paragraphs: [
					'Eine leicht gebeugte, bewegliche Grundhaltung mit Gewicht auf dem Vorfuß ist die Basis für fast jeden Schlag im Padel. Aus dieser Position kannst du schnell in jede Richtung starten, ohne erst umständlich das Gleichgewicht finden zu müssen.',
					'Der Schläger wird meist locker mit beiden Händen bereitgehalten (Continental-artiger Griff für Volleys), damit du auf Vorhand und Rückhand gleich schnell reagieren kannst.'
				]
			},
			{
				id: 'vorhand-rueckhand',
				heading: 'Vorhand und Rückhand',
				paragraphs: [
					'Vorhand und Rückhand sind die Grundschläge, mit denen die meisten Ballwechsel bestritten werden. Wichtig ist eine kompakte, kontrollierte Schwungbewegung statt eines übertrieben großen Ausholens — im Padel zählt Präzision oft mehr als reine Wucht.',
					'Der Treffpunkt liegt idealerweise leicht vor dem Körper, mit stabilem Stand und aktivem Handgelenk für die Feinjustierung der Richtung.'
				]
			},
			{
				id: 'volley',
				heading: 'Volley',
				paragraphs: [
					'Der Volley wird am Netz gespielt, bevor der Ball den Boden berührt. Die Bewegung ist kurz und kompakt, mehr ein kontrolliertes Blocken und Lenken als ein voller Schwung.',
					'Ein guter Volley hält den Ball tief und platziert ihn gezielt, statt ihn nur "irgendwie" zurückzuspielen.'
				]
			},
			{
				id: 'lob',
				heading: 'Lob',
				paragraphs: [
					'Der Lob ist ein hoher, weiter Ball über die am Netz stehenden Gegner hinweg. Technisch braucht es eine offene Schlägerfläche und ein ruhiges, kontrolliertes Durchschwingen von unten nach oben — Ziel ist Höhe und Tiefe, nicht Tempo.'
				]
			},
			{
				id: 'bandeja',
				heading: 'Bandeja',
				paragraphs: [
					'Die Bandeja ist ein kontrollierter Überkopfschlag als Antwort auf einen Lob, mit dem du die Netzposition behältst, statt dich zurückdrängen zu lassen. Der Schwung ist gedämpft, fast wie ein Slice von oben, statt eines vollen Smashes.'
				]
			},
			{
				id: 'vibora',
				heading: 'Vibora',
				paragraphs: [
					'Die Vibora ist eine Variante der Bandeja mit ausgeprägterem Seitspin, wodurch der Ball nach dem Aufprall stärker und unangenehmer abspringt. Sie erfordert etwas mehr Technikgefühl als die klassische Bandeja.'
				]
			},
			{
				id: 'smash',
				heading: 'Smash',
				paragraphs: [
					'Der Smash ist der volle Überkopfschlag mit maximalem Tempo, meist als direkter Punktgewinnschlag gedacht. Entscheidend ist die Platzierung — ein unplatzierter Smash lässt sich über Glas oder Gitter oft überraschend gut kontern.'
				]
			},
			{
				id: 'glas-nutzen',
				heading: 'Glas nutzen',
				paragraphs: [
					'Techniken mit dem Glas erfordern vor allem Timing: den Ball nach dem Bodenaufsprung und dem Wandabpraller neu einschätzen und mit ruhigem Stand kontrolliert zurückspielen, statt zu hektisch nachzueilen.'
				]
			},
			{
				id: 'technik-tipps',
				heading: 'Technik-Tipps für Anfänger',
				box: {
					kind: 'tips',
					title: 'Womit du am schnellsten Fortschritte machst',
					items: [
						'Erst Vorhand und Rückhand sauber lernen, bevor Bandeja und Vibora Priorität bekommen.',
						'Am Netz bewusst kurze, kompakte Volley-Bewegungen üben statt volle Schwünge.',
						'Den Lob früh ins Repertoire aufnehmen — er ist technisch einfacher als sein Ruf.',
						'Beim Glasspiel Geduld haben: erst den Ballabsprung richtig einschätzen, dann schlagen.'
					]
				}
			}
		],
		faq: [
			{
				question: 'Welchen Schlag sollte ich als Anfänger zuerst lernen?',
				answer:
					'Eine solide Vorhand und Rückhand aus stabiler Grundposition — darauf bauen alle anderen Schläge auf.'
			},
			{
				question: 'Ist die Bandeja schwer zu lernen?',
				answer:
					'Sie braucht etwas Übung, weil der Schwung gedämpfter ist als beim Smash. Mit gezieltem Training auf dem Court oder im Einzeltraining lässt sie sich aber gut erlernen.'
			},
			{
				question: 'Wie wichtig ist der Smash im Padel wirklich?',
				answer:
					'Er ist ein wirkungsvoller Punktgewinnschlag, aber weniger zentral als im ersten Moment vermutet — Platzierung, Lob und Netzspiel entscheiden auf Dauer mehr Punkte.'
			}
		]
	},
	{
		slug: 'padel-taktik',
		title: 'Padel Taktik: Einfach besser spielen im Doppel',
		metaTitle: 'Padel Taktik: Einfach besser spielen im Doppel',
		metaDescription:
			'Padel-Taktik für Anfänger und Fortgeschrittene: Positionierung, Netzspiel, Lob, Geduld, Kommunikation und Fehlervermeidung.',
		excerpt: 'Warum kluge Positionierung im Padel oft mehr bringt als der härteste Schlag.',
		category: 'technik-taktik',
		difficulty: 'fortgeschritten',
		readingTime: 9,
		updatedAt: '2026-08-01',
		relatedSlugs: ['padel-technik', 'padel-doppel', 'padel-training', 'padel-begriffe'],
		sections: [
			{
				id: 'taktik-vs-power',
				heading: 'Warum Taktik wichtiger ist als reine Power',
				paragraphs: [
					'Weil der Court von Wänden begrenzt ist, kommen viele Bälle zurück, die im Tennis längst im Aus wären. Reine Härte wird dadurch schnell bestraft: ein zu harter, unplatzierter Ball landet oft als einfacher Ball beim Gegner.',
					'Wer stattdessen Platzierung, Tempo-Wechsel und Positionierung nutzt, gewinnt auf Dauer mehr Punkte als reine Kraftspieler.'
				]
			},
			{
				id: 'grundpositionen',
				heading: 'Grundpositionen im Doppel',
				paragraphs: [
					'Im Idealfall stehen beide Partner auf gleicher Höhe — entweder beide am Netz (Angriffsposition) oder beide an der Grundlinie (Verteidigungsposition). Gemischte Formationen, bei denen einer vorn und einer weit hinten steht, öffnen oft unnötig große Lücken.'
				]
			},
			{
				id: 'netz-erobern',
				heading: 'Netz erobern',
				paragraphs: [
					'Das Netz ist im Padel meist die stärkste Position: von dort lassen sich Bälle früh nehmen und Druck aufbauen. Der Weg dorthin führt oft über einen guten Lob oder eine kontrollierte Bandeja, die dem Gegnerteam Zeit zum Zurückweichen lässt, während du selbst vorrückst.'
				]
			},
			{
				id: 'lob-einsetzen',
				heading: 'Lob richtig einsetzen',
				paragraphs: [
					'Ein gut getimter Lob drängt die Gegner vom Netz zurück und gibt deinem Team die Chance, selbst die Netzposition zu übernehmen. Er ist damit weniger ein Verlegenheitsschlag als ein aktives taktisches Mittel.'
				]
			},
			{
				id: 'glas-verteidigen',
				heading: 'Mit dem Glas verteidigen',
				paragraphs: [
					'In der Verteidigung hilft das Glas, mehr Zeit zu gewinnen: Statt einen schwierigen Ball sofort und hektisch zu returnieren, kannst du den Absprung von der Wand nutzen, um dich neu zu positionieren und kontrolliert zu antworten.'
				]
			},
			{
				id: 'kommunikation',
				heading: 'Kommunikation mit dem Partner',
				paragraphs: [
					'Kurze, klare Ansagen wie "ich", "du", "raus" oder "lob" verhindern Missverständnisse und doppelt angelaufene oder liegen gelassene Bälle. Gute Doppel-Teams sprechen während des Matches kontinuierlich, nicht nur bei Problemen.'
				]
			},
			{
				id: 'taktische-fehler',
				heading: 'Häufige taktische Fehler',
				box: {
					kind: 'mistakes',
					title: 'Das kostet in der Praxis die meisten Punkte',
					items: [
						'Beide Spieler an der Grundlinie festhalten, obwohl das Netz frei wäre.',
						'Zu große Lücken zwischen den Partnern lassen.',
						'Jeden hohen Ball smashen wollen, statt Kontrolle und Platzierung zu wählen.',
						'Nicht kommunizieren, wodurch Bälle in der Mitte liegen bleiben.',
						'Nach einem gewonnenen Punkt die Position nicht neu ordnen.'
					]
				}
			},
			{
				id: 'match-checkliste',
				heading: 'Match-Checkliste',
				box: {
					kind: 'checklist',
					title: 'Vor und während des Matches im Kopf behalten',
					items: [
						'Gemeinsam am Netz oder gemeinsam hinten stehen, nicht gemischt.',
						'Lob aktiv einsetzen, um das Netz zurückzuerobern.',
						'Mit dem Partner laufend kurze Ansagen austauschen.',
						'Nicht jeden Ball maximal hart schlagen — Platzierung vor Härte.',
						'Nach jedem Punkt kurz neu positionieren.'
					]
				}
			}
		],
		faq: [
			{
				question: 'Was ist die wichtigste taktische Regel im Padel-Doppel?',
				answer:
					'Gemeinsam auf gleicher Höhe agieren — entweder beide am Netz oder beide hinten. Gemischte Formationen sind meist die größte Schwachstelle.'
			},
			{
				question: 'Wie oft sollte ich mit meinem Partner sprechen?',
				answer:
					'Kontinuierlich, nicht nur bei Problemen. Kurze Ansagen vor und während jedes Ballwechsels verhindern die meisten Missverständnisse.'
			},
			{
				question: 'Lohnt sich Risiko oder lieber immer sicher spielen?',
				answer:
					'Beides hat seinen Platz — situationsabhängig zwischen Sicherheit und kontrolliertem Risiko zu wählen, ist genau das, was taktische Reife ausmacht.'
			}
		]
	},
	{
		slug: 'padel-doppel',
		title: 'Padel Doppel: Positionierung, Kommunikation und Teamplay',
		metaTitle: 'Padel Doppel: Positionierung, Kommunikation und Teamplay',
		metaDescription:
			'Padel wird im Doppel gespielt. Lerne Positionierung, Kommunikation, Abstimmung, Rollenverteilung und typische Fehler im Team.',
		excerpt: 'Warum ein eingespieltes Padel-Team mehr ist als zwei gute Einzelspieler.',
		category: 'technik-taktik',
		difficulty: 'fortgeschritten',
		readingTime: 8,
		updatedAt: '2026-08-01',
		relatedSlugs: ['padel-taktik', 'padel-regeln', 'padel-technik', 'padel-training'],
		sections: [
			{
				id: 'warum-doppel-wichtig',
				heading: 'Warum Doppel im Padel so wichtig ist',
				paragraphs: [
					'Padel wird praktisch ausschließlich im Doppel gespielt — das Feld, die Regeln und die Taktik sind komplett darauf ausgelegt, dass zwei Personen gemeinsam eine Hälfte verteidigen und angreifen. Ein eingespieltes Team schlägt fast immer zwei starke Einzelkönner ohne Abstimmung.'
				]
			},
			{
				id: 'grundposition',
				heading: 'Grundposition',
				paragraphs: [
					'Die Basis-Formation: beide Partner auf ungefähr gleicher Höhe, mit Verantwortung für die eigene Feldhälfte, aber wachsam für Bälle in der Mitte. Diese Grundordnung sollte nach jedem Ballwechsel schnell wiederhergestellt werden.'
				]
			},
			{
				id: 'wer-nimmt-welchen-ball',
				heading: 'Wer nimmt welchen Ball?',
				paragraphs: [
					'Als Faustregel gilt: Wer den besseren Winkel und die bessere Ballkontrolle für die Situation hat, übernimmt — meist der Spieler, dessen Vorhand der Ball näherkommt. Bälle exakt in der Mitte sind Verhandlungssache und gehören klar angesagt, um Kollisionen oder liegen gelassene Bälle zu vermeiden.'
				]
			},
			{
				id: 'links-rechts',
				heading: 'Links- und Rechtsspieler',
				paragraphs: [
					'Viele Teams spielen mit einer festen Seitenzuordnung, oft passend zur starken Hand: Rechtshänder oft auf der linken Feldhälfte, damit die Rückhand nicht ständig in der Mitte liegt, wo die meisten Bälle ankommen — das ist aber keine feste Regel, sondern Erfahrungswert, der von Spielstil zu Spielstil variiert.'
				]
			},
			{
				id: 'netz-verteidigung-gemeinsam',
				heading: 'Netz und Verteidigung gemeinsam spielen',
				paragraphs: [
					'Ob am Netz oder in der Verteidigung — entscheidend ist, dass sich beide Partner gemeinsam bewegen, wie durch eine unsichtbare Linie verbunden. Rückt einer vor oder zurück, sollte der andere mitziehen, um keine Lücken zu öffnen.'
				]
			},
			{
				id: 'doppel-fehler',
				heading: 'Typische Doppel-Fehler',
				box: {
					kind: 'mistakes',
					title: 'Das bremst die meisten Teams aus',
					items: [
						'Unklare Zuständigkeit bei Bällen in der Mitte, ohne Ansage.',
						'Ein Partner am Netz, der andere weit hinten — dauerhaft gemischte Formation.',
						'Nach einem verlorenen Punkt in Frust verfallen, statt sich neu zu sortieren.',
						'Sich nicht an das Spielniveau des Partners anpassen, sondern isoliert Risiko suchen.'
					]
				}
			}
		],
		faq: [
			{
				question: 'Gibt es Padel auch im Einzel?',
				answer:
					'Padel wird ganz überwiegend im Doppel gespielt. Einzelvarianten existieren vereinzelt, sind aber die Ausnahme und nicht der Standard des Sports.'
			},
			{
				question: 'Wie finde ich die richtige Seite für mich?',
				answer:
					'Am besten beide Seiten im Training ausprobieren. Viele Spieler bevorzugen die Seite, auf der ihre starke Hand nicht ständig für Bälle aus der Mitte zuständig ist.'
			},
			{
				question: 'Was mache ich, wenn mein Partner viel schwächer oder stärker ist?',
				answer:
					'Kommunikation hilft am meisten: klar absprechen, wer welche Bälle übernimmt, und das eigene Risiko an das gemeinsame Niveau anpassen, statt isoliert zu agieren.'
			}
		]
	},

	// ------------------------------------------------------------
	// EINSTIEG & TRAINING
	// ------------------------------------------------------------
	{
		slug: 'padel-fuer-anfaenger',
		title: 'Padel für Anfänger: Alles, was du vor deinem ersten Match wissen musst',
		metaTitle: 'Padel für Anfänger: Alles, was du vor deinem ersten Match wissen musst',
		metaDescription:
			'Padel für Einsteiger: Regeln, Ausrüstung, erste Schläge, typische Fehler und Tipps für dein erstes Match.',
		excerpt: 'Dein Startpunkt: alles Wichtige für den ersten Padel-Tag, kompakt zusammengefasst.',
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
				heading: 'Warum Padel einsteigerfreundlich ist',
				paragraphs: [
					'Padel wird auf einem kleineren Feld gespielt als Tennis, die Wände geben Fehlern eine zweite Chance, und Doppel bedeutet, dass du dir die Fläche mit einem Partner teilst. Dadurch gelingen auch für komplette Neulinge oft schon nach kurzer Zeit richtige Ballwechsel.'
				]
			},
			{
				id: 'was-du-brauchst',
				heading: 'Was du brauchst',
				paragraphs: [
					'Für den ersten Versuch reichen bequeme Sportkleidung, stabile Schuhe und — falls die Anlage nichts verleiht — ein geliehener oder günstiger Einsteigerschläger. Details dazu im Ratgeber zur Padel-Ausrüstung.'
				]
			},
			{
				id: 'wichtigste-regeln',
				heading: 'Die wichtigsten Regeln',
				paragraphs: [
					'In Kürze: Aufschlag von unten nach Bodenkontakt, Zählweise wie Tennis, der Ball darf nach dem Bodenaufsprung von der eigenen Wand abprallen und bleibt im Spiel. Die volle Übersicht findest du im Ratgeber zu den Padel-Regeln.'
				]
			},
			{
				id: 'erste-schlaege',
				heading: 'Erste Schläge',
				paragraphs: [
					'Konzentriere dich anfangs auf eine stabile Vorhand und Rückhand aus ruhiger Grundposition. Volleys, Lob und Bandeja kommen automatisch dazu, sobald die Grundschläge sitzen — mehr dazu im Technik-Ratgeber.'
				]
			},
			{
				id: 'verhalten-auf-dem-court',
				heading: 'Verhalten auf dem Court',
				paragraphs: [
					'Übliche Höflichkeitsregeln gelten wie in jedem Rückschlagsport: Ball erst zurückspielen, wenn der Punkt eindeutig vorbei ist, keine störenden Ansagen während des gegnerischen Schlags, und bei strittigen Aus-Entscheidungen im Zweifel großzügig sein.'
				]
			},
			{
				id: 'tipps-erstes-match',
				heading: 'Tipps für das erste Match',
				box: {
					kind: 'tips',
					title: 'Damit dein erster Court-Besuch entspannt bleibt',
					items: [
						'Vorher kurz einspielen, statt direkt ins Match zu starten.',
						'Nicht jeden Ball hart schlagen wollen — erst mal im Spiel bleiben zählt mehr.',
						'Mit erfahreneren Mitspielern kurz absprechen, wie ihr zählt und spielt.',
						'Fragen zu Regeln ruhig direkt stellen — jeder hat mal angefangen.'
					]
				}
			},
			{
				id: 'anfaengerfehler',
				heading: 'Anfängerfehler',
				box: {
					kind: 'mistakes',
					title: 'Typisch am Anfang, aber leicht vermeidbar',
					items: [
						'Sich zu sehr auf Kraft statt auf Kontrolle konzentrieren.',
						'Ständig zurückweichen, statt das Netz zu suchen.',
						'Das Spiel mit der Wand meiden, statt es zu üben.',
						'Nicht mit dem Partner sprechen.'
					]
				}
			},
			{
				id: 'start-checkliste',
				heading: 'Start-Checkliste',
				box: {
					kind: 'checklist',
					title: 'Bevor es losgeht',
					items: [
						'Bequeme Sportkleidung und stabile Schuhe.',
						'Schläger geliehen oder als Einsteigermodell besorgt.',
						'Grundregeln zu Aufschlag, Zählweise und Glas verinnerlicht.',
						'Locker einspielen vor dem ersten Punkt.',
						'Mit offenem Ohr für Tipps von erfahreneren Mitspielern starten.'
					]
				}
			}
		],
		faq: [
			{
				question: 'Wie schnell lerne ich Padel als absoluter Anfänger?',
				answer:
					'Die Grundregeln und ersten Ballwechsel gelingen meist schon in der ersten Stunde. Ein sicheres Spielniveau entwickelt sich dann über mehrere Trainingseinheiten und Matches.'
			},
			{
				question: 'Brauche ich Vorerfahrung aus anderen Sportarten?',
				answer:
					'Nein, das ist keine Voraussetzung — allgemeine sportliche Grundfitness und Ballgefühl helfen, sind aber kein Muss.'
			},
			{
				question: 'Wo finde ich Mitspieler für den Einstieg?',
				answer:
					'Viele Vereine bieten Schnupperstunden oder offene Trainingszeiten an. Auch spielervermittelnde Angebote innerhalb der eigenen Community können helfen, passende Mitspieler zu finden.'
			}
		]
	},
	{
		slug: 'padel-training',
		title: 'Padel Training: Übungen für Technik, Taktik und bessere Matches',
		metaTitle: 'Padel Training: Übungen für Technik, Taktik und bessere Matches',
		metaDescription:
			'Padel-Training für Anfänger und Fortgeschrittene: Übungen für Volley, Lob, Bandeja, Glas, Positionierung und Matchpraxis.',
		excerpt:
			'Wie du dein Training sinnvoll aufbaust — von Technikübungen bis zum eigenen 4-Wochen-Plan.',
		category: 'einstieg',
		difficulty: 'fortgeschritten',
		readingTime: 9,
		updatedAt: '2026-08-01',
		relatedSlugs: ['padel-technik', 'padel-taktik', 'padel-doppel', 'padel-fuer-anfaenger'],
		sections: [
			{
				id: 'trainingsaufbau',
				heading: 'Wie gutes Padel-Training aufgebaut ist',
				paragraphs: [
					'Effektives Training kombiniert meist drei Bausteine: Technikübungen für einzelne Schläge, Taktikübungen für Positionierung und Entscheidungen, und echte Matchpraxis, in der beides zusammenkommt. Wer nur Match spielt, ohne gezielt an Technik zu arbeiten, stagniert häufig auf einem bestimmten Niveau.'
				]
			},
			{
				id: 'technikuebungen',
				heading: 'Technikübungen',
				paragraphs: [
					'Wiederholtes Üben einzelner Schläge — etwa Volley-Serien am Netz oder Lob-Wiederholungen aus der Grundposition — verbessert Konstanz und Timing, ohne den Druck eines echten Punktes.'
				]
			},
			{
				id: 'taktikuebungen',
				heading: 'Taktikübungen',
				paragraphs: [
					'Übungen wie "beide Teams starten hinten, Ziel ist es, gemeinsam ans Netz vorzurücken" trainieren gezielt Entscheidungsfindung und Abstimmung, nicht nur reine Schlagtechnik.'
				]
			},
			{
				id: 'partneruebungen',
				heading: 'Partnerübungen',
				paragraphs: [
					'Übungen zu zweit — etwa gezielte Ballwechsel mit vorgegebenem Schlagtyp (nur Lob, nur Volley) — helfen, Automatismen mit dem eigenen Partner aufzubauen, die im Match dann intuitiv abrufbar sind.'
				]
			},
			{
				id: 'training-mit-trainer',
				heading: 'Übungen mit Trainer',
				paragraphs: [
					'Ein Trainer kann gezielt Bälle zuspielen, um bestimmte Situationen (Smash-Verteidigung, Return-Varianten) wiederholt zu üben, und gibt direktes Feedback zur Technik — das beschleunigt Fortschritte oft deutlich gegenüber reinem Freizeitspiel.'
				]
			},
			{
				id: 'fehleranalyse',
				heading: 'Fehleranalyse',
				paragraphs: [
					'Nach einem Match oder Training lohnt sich ein kurzer, ehrlicher Rückblick: Welche Schläge liefen unsicher? Welche taktischen Entscheidungen haben nicht funktioniert? Kleine, gezielte Anpassungen bringen auf Dauer mehr als pures Wiederholen ohne Reflexion.'
				]
			},
			{
				id: 'vier-wochen-plan',
				heading: 'Trainingsplan für 4 Wochen',
				box: {
					kind: 'info',
					title: 'Ein einfacher Einstiegsrahmen — an dein Niveau anpassen',
					items: [
						'Woche 1: Grundschläge festigen — Vorhand, Rückhand, einfache Volleys.',
						'Woche 2: Lob und Bandeja gezielt in Partnerübungen einbauen.',
						'Woche 3: Positionierung und Netzübernahme im Doppel üben.',
						'Woche 4: Gelerntes in echten Matches anwenden und danach reflektieren.'
					]
				}
			}
		],
		faq: [
			{
				question: 'Wie oft sollte ich trainieren, um besser zu werden?',
				answer:
					'Das hängt von deinen Zielen ab. Schon ein bis zwei gezielte Einheiten pro Woche zusätzlich zu normalen Matches bringen spürbaren Fortschritt.'
			},
			{
				question: 'Brauche ich einen Trainer, um besser zu werden?',
				answer:
					'Nicht zwingend, aber gezieltes Feedback beschleunigt die Entwicklung oft deutlich, besonders bei technischen Details wie Bandeja oder Vibora.'
			},
			{
				question: 'Was bringt mir Technikübungen gegenüber reinem Matchspielen?',
				answer:
					'Im Match steht das Ergebnis im Vordergrund, im Training kannst du gezielt an einzelnen Schwächen arbeiten, ohne den Druck des Punktgewinns.'
			}
		]
	},

	// ------------------------------------------------------------
	// KOSTEN
	// ------------------------------------------------------------
	{
		slug: 'padel-kosten',
		title: 'Was kostet Padel? Preise, Ausrüstung und laufende Kosten erklärt',
		metaTitle: 'Was kostet Padel? Preise, Ausrüstung und laufende Kosten erklärt',
		metaDescription:
			'Was kostet Padel in Deutschland? Überblick über Courtmiete, Ausrüstung, Training, Mitgliedschaften und Spartipps.',
		excerpt: 'Welche Kostenpunkte beim Padel wirklich anfallen — und wo sich Sparen lohnt.',
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
				heading: 'Welche Kosten entstehen?',
				paragraphs: [
					'Die Kosten für Padel setzen sich grob aus Courtmiete, Ausrüstung, gegebenenfalls Training und optional einer Vereinsmitgliedschaft zusammen. Wie hoch das insgesamt wird, hängt stark von Region, Anlage und Spielhäufigkeit ab — feste bundesweite Preise gibt es nicht, dafür variiert das Angebot zu stark.'
				]
			},
			{
				id: 'courtmiete',
				heading: 'Courtmiete',
				paragraphs: [
					'Die meisten Anlagen vermieten Courts stundenweise, oft aufgeteilt auf bis zu vier Spieler. Preise unterscheiden sich je nach Standort, Tageszeit und Auslastung deutlich — ein Blick auf die Preisliste der jeweiligen Anlage vor Ort gibt die verlässlichste Auskunft.'
				]
			},
			{
				id: 'ausruestung-kosten',
				heading: 'Ausrüstung',
				paragraphs: [
					'Einsteigerschläger sind meist günstiger als Modelle für Fortgeschrittene, dazu kommen gegebenenfalls Schuhe und Kleidung. Wer erst mal ausprobieren will, kann bei vielen Anlagen Schläger leihen und muss so am Anfang kaum investieren — mehr dazu im Ratgeber zur Padel-Ausrüstung.'
				]
			},
			{
				id: 'training-kosten',
				heading: 'Training',
				paragraphs: [
					'Einzel- oder Gruppentraining mit Trainer kostet je nach Anlage und Trainer unterschiedlich viel. Gruppentraining ist in der Regel günstiger pro Person als Einzelstunden.'
				]
			},
			{
				id: 'turniere',
				heading: 'Turniere',
				paragraphs: [
					'Für Turnierteilnahmen fällt meist eine Startgebühr an, die Courtmiete, Bälle und Organisation abdeckt. Die Höhe variiert je nach Veranstalter und Turnierformat.'
				]
			},
			{
				id: 'mitgliedschaften',
				heading: 'Mitgliedschaften',
				paragraphs: [
					'Manche Anlagen und Vereine bieten Mitgliedschaften mit vergünstigten Courtpreisen oder festen Spielzeiten an. Ob sich das lohnt, hängt davon ab, wie regelmäßig du tatsächlich spielst — bei gelegentlichem Spiel ist oft die reine Stundenmiete günstiger.'
				]
			},
			{
				id: 'spartipps',
				heading: 'Spartipps',
				box: {
					kind: 'tips',
					title: 'So bleibt Padel bezahlbar',
					items: [
						'Anfangs Schläger leihen, statt sofort zu kaufen.',
						'Nebenzeiten (Vormittag, unter der Woche) sind oft günstiger als Abend- und Wochenendtermine.',
						'Zu viert spielen und die Courtmiete teilen.',
						'Gruppentraining statt Einzelstunden für den Einstieg wählen.',
						'Vor einer Mitgliedschaft die eigene tatsächliche Spielhäufigkeit realistisch einschätzen.'
					]
				}
			},
			{
				id: 'kosten-checkliste',
				heading: 'Kosten-Checkliste',
				box: {
					kind: 'checklist',
					title: 'Vor dem Einstieg klären',
					items: [
						'Preisliste der Wunsch-Anlage für Courtmiete und Nebenzeiten prüfen.',
						'Klären, ob Schläger und Bälle verliehen bzw. gestellt werden.',
						'Eigene, realistische Spielhäufigkeit einschätzen.',
						'Gruppentraining als günstigen Einstieg in Betracht ziehen.',
						'Mitgliedschaft erst abschließen, wenn sich regelmäßiges Spielen abzeichnet.'
					]
				}
			}
		],
		faq: [
			{
				question: 'Ist Padel teurer als Tennis?',
				answer:
					'Das lässt sich pauschal nicht sagen — die Kosten hängen stark von Region, Anlage und persönlicher Spielhäufigkeit ab, bei beiden Sportarten gleichermaßen.'
			},
			{
				question: 'Lohnt sich eine Mitgliedschaft für Einsteiger?',
				answer:
					'Am Anfang meist nicht zwingend nötig — erst ausprobieren, wie oft du wirklich spielst, dann über eine Mitgliedschaft entscheiden.'
			},
			{
				question: 'Was ist die günstigste Art, mit Padel zu starten?',
				answer:
					'Geliehener Schläger, Nebenzeiten nutzen und zu viert spielen, um sich die Courtmiete zu teilen — so bleiben die Einstiegskosten überschaubar.'
			}
		]
	}
];
