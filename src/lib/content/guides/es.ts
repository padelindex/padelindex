// ============================================================
// PadelIndex — Contenido de la guía (español)
// ============================================================
// Traducción al español de de.ts. Mismos slugs, mismos IDs de sección,
// mismos valores de category/difficulty — solo cambia el texto.
// Mantener la estructura sincronizada con de.ts y en.ts; guides.test.ts
// lo comprueba automáticamente.

import type { GuideArticle } from '../../guides';

export const GUIDES_ES: GuideArticle[] = [
	// ------------------------------------------------------------
	// REGLAS Y CONOCIMIENTOS
	// ------------------------------------------------------------
	{
		slug: 'padel-regeln',
		title: 'Reglas del pádel explicadas de forma sencilla: la guía completa para principiantes',
		metaTitle: 'Reglas del pádel explicadas de forma sencilla: la guía completa para principiantes',
		metaDescription:
			'Las reglas más importantes del pádel explicadas con claridad: saque, puntuación, cristal, paredes, red, faltas y situaciones típicas de juego.',
		excerpt:
			'Saque, puntuación, cristal y reglas de fuera de pista — todo lo que necesitas saber antes de tu primer partido, explicado de forma sencilla.',
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
				heading: '¿Qué es el pádel?',
				paragraphs: [
					'El pádel es un deporte de raqueta que casi siempre se juega en parejas, es decir, dos contra dos. Se juega en una pista cerrada, bastante más pequeña que una pista de tenis, rodeada de paredes de cristal y rejas.',
					'La particularidad: después de botar, la pelota puede tocar las paredes propias y sigue en juego. Esto genera puntos largos y emocionantes que también resultan divertidos para principiantes desde el principio — la fuerza por sí sola casi nunca decide el punto; la colocación y la paciencia cuentan más.',
					'Se golpea con una pala sólida, perforada y sin cuerdas; la pelota se parece a una pelota de tenis con algo menos de presión. La red está en el centro de la pista, igual que en el tenis.'
				]
			},
			{
				id: 'spielfeld-und-grundprinzip',
				heading: 'La pista y el principio básico',
				paragraphs: [
					'Una pista de pádel es un rectángulo cerrado: normalmente paredes de cristal en las líneas de fondo, y rejas o también cristal en los laterales. La red divide la pista en dos mitades, y cada mitad tiene a su vez un cuadro de saque izquierdo y otro derecho, similar al tenis.',
					'La pista es claramente más compacta que una de tenis. Eso significa distancias cortas, muchos contactos con la pelota y hace que el pádel sea físicamente accesible incluso para quienes empiezan de cero.',
					'Principio básico: golpeáis la pelota por encima de la red como en el tenis hasta que bota dos veces o se comete una falta — solo que las paredes pueden participar activamente.'
				]
			},
			{
				id: 'zaehlweise',
				heading: 'Cómo se cuenta en pádel',
				paragraphs: [
					'La puntuación es la conocida del tenis: 15, 30, 40 y juego. En 40 iguales se habla de deuce (iguales) — a partir de ahí un equipo debe ganar dos puntos seguidos para llevarse el juego (algunos grupos de recreo juegan en su lugar un "punto de oro", un único punto decisivo — eso es cosa de acuerdo entre jugadores, no una norma fija).',
					'Varios juegos ganados forman un set, varios sets forman un partido — normalmente se juega al mejor de tres sets. Para ganar un set, un equipo suele necesitar seis juegos con al menos dos de ventaja; en caso de empate suele decidir un tie-break.'
				]
			},
			{
				id: 'aufschlag-regeln',
				heading: 'Reglas del saque',
				paragraphs: [
					'El saque se golpea por debajo: la pelota primero debe botar en el suelo, y solo después la golpeas — a diferencia del tenis, donde el saque se hace por arriba. El punto de contacto no puede estar más alto que la cadera.',
					'Se saca en diagonal al cuadro de saque del rival, y un pie debe permanecer detrás de la línea de saque. Después de cada juego ganado, el saque pasa al otro equipo; dentro de un mismo equipo, los compañeros suelen alternarse para sacar.',
					'Como en el tenis, hay un segundo intento si el primer saque falla (una doble falta cuesta el punto).'
				]
			},
			{
				id: 'aus',
				heading: '¿Cuándo la pelota está fuera?',
				paragraphs: [
					'La pelota está fuera si toca el suelo fuera de los límites de la pista, o si toca la pared de cristal o la reja antes de haber botado en el campo contrario.',
					'Una pelota que sale de la pista por encima del vallado perimetral sin haber botado antes correctamente dentro del campo también se considera falta. Como regla general: la pelota primero debe botar en el campo correcto — después puede rebotar en las paredes (en tu propio lado) tantas veces como quiera, mientras siga en juego.'
				]
			},
			{
				id: 'glas-und-waende',
				heading: 'Cristal, rejas y paredes explicados',
				paragraphs: [
					'Este es el punto que más confunde a los principiantes al principio: después de que la pelota haya botado en el suelo, puede tocar tu propia pared o tu propia reja y sigue en juego — todavía puedes devolverla.',
					'Al revés también es válido: si golpeas la pelota directamente contra la pared del rival sin que antes haya botado en su campo, es falta. Así que la pared no sustituye al bote en el suelo, sino que entra en juego solo después.',
					'Con algo de práctica, jugar con el cristal se convierte en una de las partes más emocionantes del pádel — abre opciones de devolución que sencillamente no existen en el tenis.'
				]
			},
			{
				id: 'netzspiel-volleys',
				heading: 'Juego de red y voleas',
				paragraphs: [
					'Las voleas (golpear la pelota en el aire antes de que toque el suelo) están permitidas en general y son, de hecho, un elemento táctico central en el pádel — estar en la red y tomar las pelotas pronto suele ser la posición más fuerte.',
					'Una excepción importante: en el saque, el resto no puede jugarse de volea mientras la pelota todavía se mueva dentro del cuadro de saque — aquí las reglas exactas varían un poco según la federación, así que en caso de duda conviene consultar el reglamento de la federación correspondiente o preguntar en el club.'
				]
			},
			{
				id: 'anfaengerfehler',
				heading: 'Errores típicos de principiantes',
				box: {
					kind: 'mistakes',
					title: 'Estos errores los verás en casi cualquier partido de principiantes',
					items: [
						'Golpear la pelota lo más fuerte posible en cada ocasión en lugar de colocarla con control.',
						'Pensar en la pared antes de que la pelota haya botado — primero debe botar en el campo.',
						'Quedarse demasiado atrás aunque la red sea la posición más fuerte.',
						'Intentar sacar por arriba como en el tenis en lugar de por abajo tras el bote.',
						'No hablar con el compañero, lo que deja pelotas centrales sin jugar o hace que las persigan los dos.'
					]
				}
			},
			{
				id: 'checkliste',
				heading: 'Lista rápida de reglas',
				box: {
					kind: 'checklist',
					title: 'Antes de tu primer partido',
					items: [
						'Saque por debajo, tras el bote, en diagonal al cuadro del rival.',
						'La pelota debe botar primero en la pista antes de poder tocar una pared o la reja.',
						'Puntuación como en el tenis: 15, 30, 40, juego — deuce en 40 iguales.',
						'Tocar la pared directamente antes del bote en el suelo es falta.',
						'Las voleas están permitidas (salvo, en parte, en el resto justo después del saque).'
					]
				}
			}
		],
		faq: [
			{
				question: '¿Es difícil aprender pádel?',
				answer:
					'Las reglas básicas se entienden en pocos minutos, y los primeros peloteos suelen salir ya en la primera hora. Jugar bien con el cristal y la táctica más fina, en cambio, necesitan algo más de práctica — típico de un deporte con una barrera de entrada baja pero mucho recorrido hacia arriba.'
			},
			{
				question: '¿Necesito saber jugar al tenis para jugar al pádel?',
				answer:
					'No. El pádel tiene su propia técnica básica y está pensado para ser accesible. La experiencia en tenis puede ayudar con el tacto de bola y la técnica de golpeo, pero no es un requisito.'
			},
			{
				question: '¿Cuántos sets se juegan en pádel?',
				answer:
					'En torneo, normalmente al mejor de tres sets; en el juego de recreo, muchos grupos acuerdan un solo set o un límite de tiempo — es una práctica habitual entre jugadores recreativos, no una norma fija.'
			},
			{
				question: '¿Qué pasa si la pelota golpea el techo de una pista cubierta?',
				answer:
					'En pistas cubiertas se aplican reglas adicionales distintas según la instalación y la federación. Lo mejor es preguntar brevemente al club o al gestor de la instalación si no está claramente indicado.'
			}
		]
	},
	{
		slug: 'padel-vs-tennis',
		title: 'Pádel vs. tenis: las diferencias clave explicadas de forma sencilla',
		metaTitle: 'Pádel vs. tenis: las diferencias clave explicadas de forma sencilla',
		metaDescription:
			'Pádel y tenis comparados: pista, palas, reglas, técnica, táctica, cómo empezar y coste.',
		excerpt:
			'Qué tienen en común el pádel y el tenis — y en qué se diferencian en la pista, las palas, las reglas y la táctica.',
		category: 'regeln',
		difficulty: 'einsteiger',
		readingTime: 8,
		updatedAt: '2026-08-01',
		popular: true,
		relatedSlugs: ['padel-regeln', 'padel-fuer-anfaenger', 'padel-schlaeger', 'padel-begriffe'],
		sections: [
			{
				id: 'gemeinsamkeiten',
				heading: 'Similitudes',
				paragraphs: [
					'Ambos deportes son juegos de raqueta con red, una puntuación similar (15, 30, 40, juego) y el objetivo de colocar la pelota de modo que el rival ya no pueda alcanzarla.',
					'Quien ya haya jugado al tenis trae consigo un buen sentido básico del vuelo de la pelota, el timing y el juego de posición — eso ayuda notablemente al empezar en el pádel, aunque la técnica sea distinta en los detalles.'
				]
			},
			{
				id: 'spielfeld',
				heading: 'Diferencias en la pista',
				paragraphs: [
					'Una pista de pádel es claramente más pequeña que una de tenis y está completamente cerrada: paredes de cristal y rejas en lugar de espacio abierto. Estas paredes son parte activa del juego, no solo un límite.',
					'El pádel se juega prácticamente siempre en parejas, mientras que el tenis se juega tanto en individuales como en dobles de forma bastante habitual.'
				]
			},
			{
				id: 'schlaeger-baelle',
				heading: 'Diferencias en palas y pelotas',
				paragraphs: [
					'Las palas de pádel son más cortas, no tienen cuerdas y en su lugar tienen una superficie sólida y perforada de materiales compuestos de carbono o fibra de vidrio con núcleo de espuma. Las raquetas de tenis tienen un mango más largo y una cabeza ovalada encordada.',
					'Las pelotas de pádel se parecen a las de tenis, pero suelen tener algo menos de presión interna para adaptarse a la pista más pequeña y a las paredes.'
				]
			},
			{
				id: 'aufschlag-regeln-vergleich',
				heading: 'Saque y reglas',
				paragraphs: [
					'En el tenis se saca por arriba, en el pádel por abajo tras el bote. La mayor novedad estructural del pádel es la pared: tras el bote en el suelo, la pelota puede tocar la pared en tu propio lado y sigue en juego — algo que no existe en el tenis.'
				]
			},
			{
				id: 'tempo-taktik',
				heading: 'Ritmo de juego y táctica',
				paragraphs: [
					'El pádel vive mucho del juego de red: como la pista es más pequeña y las paredes permiten peloteos largos, la posición en la red suele ser más decisiva que la pura potencia del golpe. En el tenis, los duelos de fondo, la potencia de saque y los desplazamientos más largos tienen un papel mayor.',
					'Por eso el pádel resulta más accesible para muchos principiantes: incluso con una condición física moderada se pueden jugar peloteos largos e inteligentes.'
				]
			},
			{
				id: 'einstieg-tennisspieler',
				heading: 'Cómo empezar siendo jugador de tenis',
				paragraphs: [
					'Los jugadores de tenis sobre todo tienen que desaprender dos cosas: sacar por abajo y usar las paredes de forma consciente en vez de evitar cualquier pelota que vaya hacia ellas. La base de derecha y revés, en cambio, suele transferirse bien.',
					'Un error inicial habitual entre quienes cambian de deporte: golpear con fuerza por reflejo, como están acostumbrados en el tenis — en el pádel, por culpa de las paredes, eso suele acabar regalando una pelota fácil al rival.'
				]
			},
			{
				id: 'was-ist-einfacher',
				heading: '¿Qué es más fácil de aprender?',
				paragraphs: [
					'Para principiantes totales, el pádel se considera generalmente más accesible: pista más pequeña, desplazamientos más cortos, paredes que perdonan errores y un formato de dobles en el que compartes el espacio con un compañero. El tenis exige antes una técnica de golpeo más precisa solo para mantener la pelota dentro de la pista, más grande.',
					'Eso no significa que el pádel sea "más fácil" en el sentido de menos exigente — a nivel alto, la profundidad táctica es considerable. Pero empezar suele resultar más rápido.'
				]
			}
		],
		faq: [
			{
				question: '¿Puedo jugar bien al pádel desde el principio si tengo experiencia en tenis?',
				answer:
					'Traes un buen sentido básico, pero tendrás que acostumbrarte de nuevo al saque y al juego con las paredes. Las primeras sesiones les resultan poco familiares a muchos jugadores de tenis antes de que encaje.'
			},
			{
				question: '¿Necesito las mismas zapatillas para pádel que para tenis?',
				answer:
					'No necesariamente — las zapatillas de pádel están optimizadas para los cambios de dirección rápidos y cortos en la pista más pequeña. Más sobre esto en la guía de zapatillas de pádel.'
			},
			{
				question: '¿El pádel surgió de pistas de tenis adaptadas?',
				answer:
					'El pádel tiene una historia de origen propia y sus propias medidas de pista. Algunas instalaciones sí convierten pistas de tenis en pistas de pádel, pero es una decisión constructiva de operadores individuales, no una regla del deporte.'
			}
		]
	},
	{
		slug: 'padel-begriffe',
		title: 'Términos de pádel explicados: bandeja, víbora, chiquita, globo y más',
		metaTitle: 'Términos de pádel explicados: bandeja, víbora, chiquita, globo y más',
		metaDescription:
			'Los términos de pádel más importantes explicados de forma sencilla. Ideal para principiantes que quieren entender mejor las reglas, los golpes y la táctica del pádel.',
		excerpt:
			'De la bandeja a la chiquita: el pequeño diccionario de pádel para todos los que quieren seguir la conversación en la pista.',
		category: 'regeln',
		difficulty: 'einsteiger',
		readingTime: 7,
		updatedAt: '2026-08-01',
		beginnerRecommended: true,
		relatedSlugs: ['padel-technik', 'padel-taktik', 'padel-regeln', 'padel-doppel'],
		sections: [
			{
				id: 'grundbegriffe',
				heading: 'Términos básicos',
				paragraphs: [
					'Pista: el campo de juego, rodeado de paredes de cristal y rejas.',
					'Fuera: la pelota ha quedado inválida, el punto va para el otro lado.',
					'Punto de oro: en deuce, un único punto decide en lugar de la regla de los dos puntos — un atajo popular en el juego de recreo, no una obligación fija de torneo en todas partes.'
				]
			},
			{
				id: 'schlagbegriffe',
				heading: 'Términos de golpeo',
				paragraphs: [
					'Bandeja: un golpe de arriba controlado, jugado normalmente para mantener la posición de red en vez de acabar el punto de inmediato.',
					'Víbora: una variante de la bandeja con más efecto lateral, a menudo aún más agresiva en la colocación de la pelota.',
					'Chiquita: una pelota baja y controlada que se juega profunda, a los pies de los rivales que están en la red.',
					'Remate (smash): el golpe fuerte de arriba, generalmente el golpe de definición por excelencia — pero solo si está bien colocado.',
					'Globo (lob): una pelota alta por encima de los rivales para hacerlos retroceder desde la red.'
				]
			},
			{
				id: 'taktikbegriffe',
				heading: 'Términos tácticos',
				paragraphs: [
					'Posición de red: normalmente el lugar tácticamente más fuerte, cerca de la red, desde el que se genera presión.',
					'Resto (return): el golpe que devuelve el saque del rival.',
					'Winner: un golpe que el rival ya no puede alcanzar en absoluto — el punto se gana directamente.'
				]
			},
			{
				id: 'spielfeldbegriffe',
				heading: 'Términos de la pista',
				paragraphs: [
					'Línea de fondo: la línea límite trasera de la pista, justo delante de la pared de cristal.',
					'Cuadro de saque: el campo diagonal en el que debe caer el saque.',
					'Línea central: divide cada mitad de la pista en un cuadro de saque izquierdo y otro derecho.'
				]
			},
			{
				id: 'spanische-begriffe',
				heading: 'Origen de los términos',
				paragraphs: [
					'El pádel tiene raíces españolas y sudamericanas, por eso muchos términos técnicos vienen del español y se usan internacionalmente sin traducir — también en el pádel de habla inglesa o alemana los oyes constantemente: "bandeja", "víbora" y "chiquita" son ejemplos de ello.'
				]
			},
			{
				id: 'glossar',
				heading: 'Mini glosario de la A a la Z',
				box: {
					kind: 'info',
					title: 'Los términos más importantes de un vistazo',
					items: [
						'Bandeja — golpe de arriba controlado para asegurar la red',
						'Chiquita — pelota baja a los pies de los jugadores de red',
						'Punto de oro — punto único decisivo en deuce',
						'Globo (lob) — pelota alta por encima de los rivales',
						'Resto (return) — el golpe que devuelve el saque',
						'Remate (smash) — golpe fuerte de arriba',
						'Víbora — variante de la bandeja con más efecto lateral',
						'Winner — punto ganado directamente'
					]
				}
			}
		],
		faq: [
			{
				question: '¿Tengo que conocer todos los términos técnicos para jugar al pádel?',
				answer:
					'No. Para empezar bastan las reglas básicas y algunos nombres de golpes. Pero los términos ayudan a entender mejor los entrenamientos y las conversaciones tácticas en el club.'
			},
			{
				question: '¿Por qué tantos términos de pádel son en español?',
				answer:
					'El pádel tiene sus raíces en el mundo hispanohablante, por lo que muchos términos técnicos se han impuesto internacionalmente sin traducirse.'
			}
		]
	},

	// ------------------------------------------------------------
	// EQUIPAMIENTO
	// ------------------------------------------------------------
	{
		slug: 'padel-ausruestung',
		title: 'Equipamiento de pádel: lo que realmente necesitas para jugar',
		metaTitle: 'Equipamiento de pádel: lo que realmente necesitas para jugar',
		metaDescription:
			'Equipamiento de pádel para principiantes y avanzados: palas, zapatillas, pelotas, ropa y accesorios útiles explicados de forma sencilla.',
		excerpt: 'El equipo básico para empezar — y lo que puedes comprar tranquilamente más adelante.',
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
				heading: 'Equipo básico',
				paragraphs: [
					'Para empezar necesitas básicamente tres cosas: una pala de pádel, zapatillas adecuadas y pelotas de pádel. Muchas instalaciones prestan palas las primeras veces, así que no tienes que invertir enseguida.',
					'Todo lo demás — ropa especial, bolsas, overgrips — es útil, pero no decisivo para tus primeros partidos.'
				]
			},
			{
				id: 'padelschlaeger',
				heading: 'Palas de pádel',
				paragraphs: [
					'La pala es la compra más importante. A los principiantes normalmente les va bien con una forma redonda o de lágrima, que ofrece más control y un punto dulce más grande. Más detalles sobre formas, peso y elección en la guía dedicada a palas de pádel.'
				]
			},
			{
				id: 'padelschuhe',
				heading: 'Zapatillas de pádel',
				paragraphs: [
					'El pádel se juega con muchos esprints cortos y cambios de dirección rápidos. Las zapatillas específicas de pádel ofrecen el agarre y la estabilidad lateral adecuados para eso — más sobre esto en la guía de zapatillas de pádel. Para tu primera prueba, unas zapatillas estables de deporte de sala o de tenis suelen servir.'
				]
			},
			{
				id: 'padelbaelle',
				heading: 'Pelotas de pádel',
				paragraphs: [
					'Las pelotas de pádel se parecen a las de tenis, pero suelen tener algo menos de presión interna. La mayoría de las instalaciones y clubes ponen pelotas a disposición o las venden allí mismo — como principiante, rara vez tienes que preocuparte de esto tú mismo.'
				]
			},
			{
				id: 'kleidung',
				heading: 'Ropa',
				paragraphs: [
					'Con ropa de deporte normal es más que suficiente: camiseta transpirable, pantalón corto o falda que permitan libertad de movimiento, calcetines deportivos. Las colecciones específicas de pádel quedan bien, pero no son un requisito.'
				]
			},
			{
				id: 'zubehoer',
				heading: 'Accesorios',
				paragraphs: [
					'Complementos útiles con el tiempo: una funda o paletero para transportar la pala, un overgrip cuando el grip original esté gastado, y un antivibrador si el impacto se te hace muy fuerte en el brazo. Todo opcional, nada de eso es importante el primer día.'
				]
			},
			{
				id: 'nicht-sofort-kaufen',
				heading: 'Lo que los principiantes no necesitan comprar enseguida',
				box: {
					kind: 'tips',
					title: 'Puede esperar hasta que sepas si el pádel será tu deporte',
					items: [
						'Una pala profesional cara — una pala de iniciación sólida o prestada basta para los primeros meses.',
						'Una colección completa de ropa de pádel.',
						'Pelotas propias en grandes cantidades — la mayoría de las instalaciones las ponen.',
						'Accesorios como overgrips o antivibradores antes de jugar siquiera con regularidad.'
					]
				}
			},
			{
				id: 'kauf-checkliste',
				heading: 'Lista de compra',
				box: {
					kind: 'checklist',
					title: 'Antes de tu primera compra',
					items: [
						'Juega 1–2 veces con una pala prestada antes de invertir.',
						'Elige la pala según el control, no según el aspecto (ver la guía de palas de pádel).',
						'Elige zapatillas con buen sujeción lateral en vez de simples zapatillas de running.',
						'Pregunta en la instalación si ponen pelotas.',
						'Con ropa de deporte cómoda y que permita moverte libremente es más que suficiente.'
					]
				}
			}
		],
		faq: [
			{
				question: '¿Puedo jugar al pádel con raquetas de tenis?',
				answer:
					'No, las palas de pádel son un equipo deportivo propio, sin cuerdas y con una superficie sólida y perforada. Una raqueta de tenis no sirve para esto.'
			},
			{
				question: '¿Necesito equipamiento propio desde el principio?',
				answer:
					'No. Muchas instalaciones prestan palas, y las pelotas suelen estar incluidas. Para empezar, basta con ropa de deporte cómoda y calzado adecuado.'
			},
			{
				question: '¿Con qué frecuencia hay que reponer el equipamiento?',
				answer:
					'Depende mucho de la frecuencia con la que juegues y del material. Las zapatillas se desgastan notablemente por los muchos cambios de dirección, mientras que las palas suelen durar bastante más para jugadores recreativos.'
			}
		]
	},
	{
		slug: 'padel-schlaeger',
		title: 'Palas de pádel para principiantes: formas, peso y cómo elegir',
		metaTitle: 'Palas de pádel para principiantes: formas, peso y cómo elegir',
		metaDescription:
			'Cómo encontrar la pala de pádel adecuada: palas redondas, en forma de lágrima y de diamante, peso, balance y estilo de juego.',
		excerpt:
			'¿Redonda, lágrima o diamante? Así eliges la forma de pala que se adapta a tu estilo de juego.',
		category: 'ausruestung',
		difficulty: 'einsteiger',
		readingTime: 8,
		updatedAt: '2026-08-01',
		relatedSlugs: ['padel-ausruestung', 'padel-schuhe', 'padel-technik', 'padel-kosten'],
		sections: [
			{
				id: 'warum-wichtig',
				heading: 'Por qué es importante elegir bien la pala',
				paragraphs: [
					'La pala influye directamente en lo fácil que te resulta tener control y en cuánta fuerza tienes que poner tú mismo en un golpe. Una pala adecuada a tu estilo de juego hace que la curva de aprendizaje inicial sea notablemente más agradable.',
					'No existe una pala objetivamente "mejor" — solo la que se adapta a tu nivel actual y a tu estilo de juego.'
				]
			},
			{
				id: 'formen',
				heading: 'Formas de pala explicadas',
				paragraphs: [
					'Redonda: el punto dulce más grande, muy favorable para el control, generalmente la forma recomendada para empezar.',
					'Lágrima: una forma híbrida entre control y potencia, un buen compromiso para jugadores con algo de experiencia.',
					'Diamante: el peso está más arriba en la cabeza de la pala, más potencia, punto dulce más pequeño — más adecuada para jugadores avanzados con técnica limpia.'
				]
			},
			{
				id: 'gewicht-balance',
				heading: 'Peso y balance',
				paragraphs: [
					'Las palas más ligeras se manejan más rápido y cuidan más el brazo y el hombro; las palas más pesadas dan más potencia al golpe, pero también exigen más control y fuerza.',
					'Para principiantes se recomienda generalmente una clase de peso ligera a media — primero el control, la potencia llega sola con el tiempo.'
				]
			},
			{
				id: 'kontrolle-vs-power',
				heading: 'Control frente a potencia',
				paragraphs: [
					'Las palas orientadas al control (normalmente redondas, con balance equilibrado) perdonan más y ayudan a mantener la pelota en juego con seguridad. Las palas orientadas a la potencia (normalmente de diamante, con más peso en la cabeza) premian la técnica precisa con más fuerza, pero también castigan más los errores.',
					'Como regla general: quien todavía está trabajando en la técnica básica casi siempre se beneficia más del control que de potencia adicional.'
				]
			},
			{
				id: 'anfaenger-schlaeger',
				heading: 'Palas para principiantes',
				paragraphs: [
					'Una pala redonda o en forma de lágrima con peso moderado es la elección adecuada para la mayoría de los principiantes. Perdona los puntos de impacto imprecisos y facilita aprender los golpes básicos.'
				]
			},
			{
				id: 'fortgeschrittene-schlaeger',
				heading: 'Palas para jugadores avanzados',
				paragraphs: [
					'Con la técnica ya asentada, merece la pena mirar modelos en forma de lágrima o diamante con más potencia, según si prima el control o el juego de ataque.'
				]
			},
			{
				id: 'kauffehler',
				heading: 'Errores al comprar',
				box: {
					kind: 'mistakes',
					title: 'Esto suele generar frustración con la pala nueva',
					items: [
						'Comprar una pala profesional o de potencia aunque la técnica básica todavía no esté asentada.',
						'Decidir solo por el aspecto o la marca en lugar de comprobar la forma y el peso.',
						'Elegir una pala claramente demasiado pesada — eso sobrecarga innecesariamente el brazo y el hombro.',
						'No probar la pala ni pedir asesoramiento antes de comprar, aunque muchas tiendas lo ofrecen.'
					]
				}
			},
			{
				id: 'checkliste',
				heading: 'Lista de comprobación de la pala',
				box: {
					kind: 'checklist',
					title: 'Comprobar antes de comprar',
					items: [
						'Forma: redonda o en forma de lágrima para empezar.',
						'Peso: más bien ligero a medio, sobre todo si hay problemas de brazo u hombro.',
						'Balance: equilibrado en lugar de con peso en la cabeza, si el control es la prioridad.',
						'Si es posible, probar la pala o pedirla prestada antes.',
						'Decidir definitivamente solo después de algunas sesiones de entrenamiento.'
					]
				}
			}
		],
		faq: [
			{
				question: '¿Qué forma de pala es mejor para principiantes?',
				answer:
					'Por lo general una forma redonda: el punto dulce más grande, el máximo control, la más indulgente con los impactos imprecisos.'
			},
			{
				question: '¿Cuánto debería pesar mi primera pala de pádel?',
				answer:
					'En general, ligera a media. Las cifras exactas de peso varían según el fabricante — lo mejor es pedir asesoramiento en una tienda especializada o probar distintos modelos.'
			},
			{
				question: '¿Tengo que gastar mucho dinero de entrada siendo principiante?',
				answer:
					'No. Hay modelos de iniciación sólidos a precios moderados, y muchos clubes prestan palas de todos modos para las primeras veces.'
			}
		]
	},
	{
		slug: 'padel-schuhe',
		title: 'Zapatillas de pádel: en qué fijarte al comprarlas',
		metaTitle: 'Zapatillas de pádel: en qué fijarte al comprarlas',
		metaDescription:
			'Zapatillas de pádel explicadas: agarre, estabilidad, amortiguación, dibujos de suela y diferencias con zapatillas de tenis o running.',
		excerpt:
			'Por qué las zapatillas de running normales llegan rápido a su límite en la pista — y qué hacen distinto las zapatillas de pádel.',
		category: 'ausruestung',
		difficulty: 'einsteiger',
		readingTime: 7,
		updatedAt: '2026-08-01',
		relatedSlugs: ['padel-ausruestung', 'padel-schlaeger', 'padel-fuer-anfaenger', 'padel-kosten'],
		sections: [
			{
				id: 'warum-spezielle-schuhe',
				heading: 'Por qué importan las zapatillas específicas',
				paragraphs: [
					'El pádel exige muchos esprints cortos, paradas bruscas y cambios de dirección laterales en un espacio comparativamente pequeño. Las zapatillas de running están optimizadas para el movimiento en línea recta y suelen ofrecer poca sujeción lateral para eso.',
					'Las zapatillas de pádel están construidas específicamente para este tipo de exigencia, con una suela adecuada al pavimento y más soporte en los laterales.'
				]
			},
			{
				id: 'grip-sohlenprofil',
				heading: 'Agarre y dibujo de suela',
				paragraphs: [
					'El pavimento de las pistas de pádel (normalmente moqueta con relleno de arena) requiere un dibujo de suela propio que ofrezca suficiente agarre para arrancadas y paradas rápidas sin bloquear al deslizar y girar.',
					'Las suelas con tacos demasiado agresivos (como en algunas zapatillas de exterior o running) pueden engancharse en el pavimento, y las suelas demasiado lisas resbalan sin control — las zapatillas de pádel buscan deliberadamente el término medio.'
				]
			},
			{
				id: 'stabilitaet',
				heading: 'Estabilidad en los cambios de dirección',
				paragraphs: [
					'Una estructura de soporte lateral reforzada protege de las torceduras de tobillo en los movimientos laterales rápidos que se dan constantemente en el pádel. Es una de las mayores diferencias respecto a las zapatillas de running clásicas, pensadas sobre todo para amortiguación en línea recta.'
				]
			},
			{
				id: 'daempfung',
				heading: 'Amortiguación',
				paragraphs: [
					'Como hay muchas paradas cortas y bruscas y arrancadas, las zapatillas de pádel necesitan una amortiguación que descargue las articulaciones justo en este patrón de esfuerzo — no es lo mismo que la amortiguación de una zapatilla de running, pensada para pasos uniformes en línea recta.'
				]
			},
			{
				id: 'indoor-outdoor',
				heading: 'Interior frente a exterior',
				paragraphs: [
					'Algunos modelos están optimizados específicamente para suelos de pista cubierta o para pistas al aire libre; otros funcionan para ambos. Si juegas sobre todo en un tipo de instalación, merece la pena mirar la indicación del fabricante sobre el uso previsto.'
				]
			},
			{
				id: 'haeufige-fehler',
				heading: 'Errores frecuentes',
				box: {
					kind: 'mistakes',
					title: 'Esta elección de calzado suele arrepentirse rápido',
					items: [
						'Usar zapatillas de running normales para entrenar pádel con regularidad.',
						'Reutilizar zapatillas de tenis sin comprobarlas — algunas funcionan bien, otras no, depende del modelo.',
						'No fijarse en el ajuste ni en la sujeción lateral al comprar, solo en el aspecto.',
						'Comprar zapatillas claramente demasiado ajustadas o demasiado holgadas "porque estaban de oferta".'
					]
				}
			},
			{
				id: 'kauf-checkliste',
				heading: 'Lista de compra',
				box: {
					kind: 'checklist',
					title: 'Antes de comprar zapatillas',
					items: [
						'Probar la sujeción lateral y la estabilidad, no solo la amortiguación hacia delante.',
						'Elegir un dibujo de suela adaptado al pavimento de tu pista habitual.',
						'Comprobar el ajuste en la instalación o en una tienda especializada si es posible.',
						'Si juegas a menudo, vigilar el desgaste de la suela exterior.'
					]
				}
			}
		],
		faq: [
			{
				question: '¿Puedo usar zapatillas de tenis para pádel?',
				answer:
					'En parte sí, según el modelo — muchas zapatillas de tenis ya ofrecen buena sujeción lateral. Pero para jugar con regularidad, merece la pena tener zapatillas desarrolladas específicamente para pádel.'
			},
			{
				question: '¿Por qué las zapatillas de running no son adecuadas para pádel?',
				answer:
					'Las zapatillas de running están optimizadas para el movimiento en línea recta y suelen ofrecer poca sujeción lateral para los cambios de dirección rápidos del pádel — eso aumenta el riesgo de lesión.'
			},
			{
				question: '¿Con qué rapidez se desgastan las zapatillas de pádel?',
				answer:
					'Depende mucho de la frecuencia de juego, el pavimento y el estilo de movimiento. Quien juega mucho e intensamente desgastará la suela exterior más rápido que un jugador ocasional.'
			}
		]
	},

	// ------------------------------------------------------------
	// TÉCNICA Y TÁCTICA
	// ------------------------------------------------------------
	{
		slug: 'padel-technik',
		title: 'Técnica de pádel: los golpes más importantes explicados de forma sencilla',
		metaTitle: 'Técnica de pádel: los golpes más importantes explicados de forma sencilla',
		metaDescription:
			'Los golpes de pádel más importantes de un vistazo: derecha, revés, volea, bandeja, víbora, globo y remate.',
		excerpt:
			'De la derecha a la bandeja — los golpes básicos que componen cualquier partido de pádel.',
		category: 'technik-taktik',
		difficulty: 'fortgeschritten',
		readingTime: 9,
		updatedAt: '2026-08-01',
		relatedSlugs: ['padel-taktik', 'padel-begriffe', 'padel-training', 'padel-doppel'],
		sections: [
			{
				id: 'grundhaltung',
				heading: 'Postura básica',
				paragraphs: [
					'Una postura básica ligeramente flexionada y móvil, con el peso sobre la parte delantera del pie, es la base de casi cualquier golpe en pádel. Desde esta posición puedes arrancar rápido en cualquier dirección sin tener que buscar primero el equilibrio de forma incómoda.',
					'La pala se sostiene normalmente con las dos manos de forma relajada (un grip tipo continental para las voleas), para poder reaccionar igual de rápido de derecha y de revés.'
				]
			},
			{
				id: 'vorhand-rueckhand',
				heading: 'Derecha y revés',
				paragraphs: [
					'La derecha y el revés son los golpes básicos con los que se resuelven la mayoría de los peloteos. Lo importante es un movimiento de swing compacto y controlado en lugar de un armado exageradamente grande — en pádel la precisión suele contar más que la pura potencia.',
					'El punto de impacto ideal está ligeramente por delante del cuerpo, con una postura estable y una muñeca activa para el ajuste fino de la dirección.'
				]
			},
			{
				id: 'volley',
				heading: 'Volea',
				paragraphs: [
					'La volea se juega en la red, antes de que la pelota toque el suelo. El movimiento es corto y compacto, más un bloqueo y una guía controlados que un swing completo.',
					'Una buena volea mantiene la pelota baja y la coloca de forma deliberada, en lugar de devolverla "de cualquier manera".'
				]
			},
			{
				id: 'lob',
				heading: 'Globo (lob)',
				paragraphs: [
					'El globo es una pelota alta y profunda por encima de los rivales que están en la red. Técnicamente requiere una cara de pala abierta y un swing tranquilo y controlado de abajo hacia arriba — el objetivo es altura y profundidad, no velocidad.'
				]
			},
			{
				id: 'bandeja',
				heading: 'Bandeja',
				paragraphs: [
					'La bandeja es un golpe de arriba controlado que se juega como respuesta a un globo, con el que mantienes la posición de red en vez de dejarte empujar hacia atrás. El swing está amortiguado, casi como un slice desde arriba, en lugar de un remate completo.'
				]
			},
			{
				id: 'vibora',
				heading: 'Víbora',
				paragraphs: [
					'La víbora es una variante de la bandeja con un efecto lateral más marcado, que hace que la pelota rebote de forma más fuerte e incómoda después de botar. Requiere algo más de sensibilidad técnica que la bandeja clásica.'
				]
			},
			{
				id: 'smash',
				heading: 'Remate (smash)',
				paragraphs: [
					'El remate es el golpe de arriba completo, a máxima velocidad, pensado generalmente como golpe de definición directo. Lo decisivo es la colocación — un remate mal colocado a menudo se puede contrarrestar sorprendentemente bien con el cristal o la reja.'
				]
			},
			{
				id: 'glas-nutzen',
				heading: 'Aprovechar el cristal',
				paragraphs: [
					'Las técnicas con el cristal exigen sobre todo timing: reevaluar la pelota después del bote en el suelo y el rebote en la pared, y devolverla con control desde una postura tranquila, en lugar de precipitarse a por ella.'
				]
			},
			{
				id: 'technik-tipps',
				heading: 'Consejos técnicos para principiantes',
				box: {
					kind: 'tips',
					title: 'Con esto progresas más rápido',
					items: [
						'Aprende primero una derecha y un revés limpios antes de dar prioridad a la bandeja y la víbora.',
						'Practica en la red movimientos de volea cortos y compactos, deliberadamente, en lugar de swings completos.',
						'Incorpora el globo pronto a tu repertorio — técnicamente es más sencillo de lo que su fama sugiere.',
						'Ten paciencia con el juego de cristal: primero evalúa bien el rebote, luego golpea.'
					]
				}
			}
		],
		faq: [
			{
				question: '¿Qué golpe debería aprender primero como principiante?',
				answer:
					'Una derecha y un revés sólidos desde una posición básica estable — sobre eso se construyen todos los demás golpes.'
			},
			{
				question: '¿Es difícil aprender la bandeja?',
				answer:
					'Necesita algo de práctica, porque el swing está más amortiguado que en el remate. Con un entrenamiento específico en la pista o en clases individuales, se puede aprender bien.'
			},
			{
				question: '¿Cómo de importante es realmente el remate en el pádel?',
				answer:
					'Es un golpe de definición efectivo, pero menos central de lo que parece a primera vista — la colocación, el globo y el juego de red deciden más puntos a largo plazo.'
			}
		]
	},
	{
		slug: 'padel-taktik',
		title: 'Táctica de pádel: juega mejor en pareja de forma sencilla',
		metaTitle: 'Táctica de pádel: juega mejor en pareja de forma sencilla',
		metaDescription:
			'Táctica de pádel para principiantes y avanzados: posicionamiento, juego de red, globo, paciencia, comunicación y cómo evitar errores.',
		excerpt:
			'Por qué una colocación inteligente en pádel a menudo aporta más que el golpe más duro.',
		category: 'technik-taktik',
		difficulty: 'fortgeschritten',
		readingTime: 9,
		updatedAt: '2026-08-01',
		relatedSlugs: ['padel-technik', 'padel-doppel', 'padel-training', 'padel-begriffe'],
		sections: [
			{
				id: 'taktik-vs-power',
				heading: 'Por qué la táctica es más importante que la pura potencia',
				paragraphs: [
					'Como la pista está delimitada por paredes, vuelven muchas pelotas que en tenis ya habrían sido fuera. Por eso la pura dureza se castiga rápido: una pelota demasiado fuerte y sin colocar suele acabar como una pelota fácil para el rival.',
					'Quien en cambio usa la colocación, los cambios de ritmo y el posicionamiento gana más puntos a largo plazo que los jugadores de pura fuerza.'
				]
			},
			{
				id: 'grundpositionen',
				heading: 'Posiciones básicas en parejas',
				paragraphs: [
					'Lo ideal es que ambos compañeros estén a la misma altura — o los dos en la red (posición de ataque) o los dos en la línea de fondo (posición de defensa). Las formaciones mixtas, con uno delante y otro muy atrás, suelen abrir huecos innecesariamente grandes.'
				]
			},
			{
				id: 'netz-erobern',
				heading: 'Conquistar la red',
				paragraphs: [
					'La red suele ser la posición más fuerte en pádel: desde ahí se pueden tomar las pelotas pronto y generar presión. El camino hasta allí suele pasar por un buen globo o una bandeja controlada, que le da tiempo a la pareja rival a retroceder mientras tú avanzas.'
				]
			},
			{
				id: 'lob-einsetzen',
				heading: 'Usar bien el globo',
				paragraphs: [
					'Un globo bien calculado empuja a los rivales lejos de la red y le da a tu equipo la oportunidad de hacerse con la posición de red. Por eso es menos un golpe de apuro que una herramienta táctica activa.'
				]
			},
			{
				id: 'glas-verteidigen',
				heading: 'Defender con el cristal',
				paragraphs: [
					'En defensa, el cristal ayuda a ganar tiempo: en lugar de restar de forma inmediata y precipitada una pelota difícil, puedes aprovechar el rebote en la pared para reposicionarte y responder con control.'
				]
			},
			{
				id: 'kommunikation',
				heading: 'Comunicación con tu compañero',
				paragraphs: [
					'Avisos cortos y claros como "mía", "tuya", "fuera" o "globo" evitan malentendidos y pelotas que se persiguen entre los dos o que se quedan sin jugar. Los buenos equipos de dobles hablan continuamente durante el partido, no solo cuando hay problemas.'
				]
			},
			{
				id: 'taktische-fehler',
				heading: 'Errores tácticos frecuentes',
				box: {
					kind: 'mistakes',
					title: 'Esto es lo que más puntos cuesta en la práctica',
					items: [
						'Que ambos jugadores se queden fijos en la línea de fondo aunque la red esté libre.',
						'Dejar demasiado hueco entre los compañeros.',
						'Querer rematar cada pelota alta en lugar de elegir control y colocación.',
						'No comunicarse, con lo que las pelotas se quedan sin jugar en el centro.',
						'No reorganizar la posición después de ganar un punto.'
					]
				}
			},
			{
				id: 'match-checkliste',
				heading: 'Lista de comprobación para el partido',
				box: {
					kind: 'checklist',
					title: 'Tener en cuenta antes y durante el partido',
					items: [
						'Estar juntos en la red o juntos atrás, no mezclados.',
						'Usar el globo de forma activa para reconquistar la red.',
						'Intercambiar avisos cortos con el compañero continuamente.',
						'No golpear cada pelota lo más fuerte posible — colocación antes que dureza.',
						'Reposicionarse brevemente después de cada punto.'
					]
				}
			}
		],
		faq: [
			{
				question: '¿Cuál es la regla táctica más importante en el pádel de pareja?',
				answer:
					'Actuar juntos a la misma altura — o los dos en la red o los dos atrás. Las formaciones mixtas suelen ser el mayor punto débil.'
			},
			{
				question: '¿Con qué frecuencia debería hablar con mi compañero?',
				answer:
					'De forma continua, no solo cuando hay problemas. Los avisos cortos antes y durante cada peloteo evitan la mayoría de los malentendidos.'
			},
			{
				question: '¿Merece la pena arriesgar o es mejor jugar siempre seguro?',
				answer:
					'Ambas cosas tienen su lugar — elegir según la situación entre seguridad y riesgo controlado es precisamente lo que define la madurez táctica.'
			}
		]
	},
	{
		slug: 'padel-doppel',
		title: 'Pádel en pareja: posicionamiento, comunicación y juego en equipo',
		metaTitle: 'Pádel en pareja: posicionamiento, comunicación y juego en equipo',
		metaDescription:
			'El pádel se juega en parejas. Aprende posicionamiento, comunicación, coordinación, reparto de roles y errores típicos en equipo.',
		excerpt:
			'Por qué una pareja de pádel compenetrada es más que dos buenos jugadores individuales.',
		category: 'technik-taktik',
		difficulty: 'fortgeschritten',
		readingTime: 8,
		updatedAt: '2026-08-01',
		relatedSlugs: ['padel-taktik', 'padel-regeln', 'padel-technik', 'padel-training'],
		sections: [
			{
				id: 'warum-doppel-wichtig',
				heading: 'Por qué el juego en pareja es tan importante en el pádel',
				paragraphs: [
					'El pádel se juega prácticamente solo en parejas — la pista, las reglas y la táctica están completamente pensadas para que dos personas defiendan y ataquen juntas una mitad. Una pareja compenetrada gana casi siempre a dos jugadores individuales fuertes pero sin coordinación.'
				]
			},
			{
				id: 'grundposition',
				heading: 'Posición básica',
				paragraphs: [
					'La formación base: ambos compañeros aproximadamente a la misma altura, cada uno responsable de su mitad de la pista pero atento a las pelotas del centro. Este orden básico debe recuperarse rápido después de cada peloteo.'
				]
			},
			{
				id: 'wer-nimmt-welchen-ball',
				heading: '¿Quién toma cada pelota?',
				paragraphs: [
					'Como regla general: quien tenga mejor ángulo y mejor control de bola para la situación, la toma — normalmente el jugador al que la pelota se acerca más por su derecha. Las pelotas exactamente en el centro son negociables y hay que avisarlas claramente, para evitar colisiones o pelotas que se queden sin jugar.'
				]
			},
			{
				id: 'links-rechts',
				heading: 'Jugador de reves e izquierda y jugador de derecha',
				paragraphs: [
					'Muchas parejas juegan con una asignación fija de lado, a menudo según la mano dominante: los diestros suelen jugar en la mitad izquierda de la pista, para que el revés no tenga que ocuparse constantemente del centro, por donde llegan la mayoría de las pelotas — pero eso no es una regla fija, sino un criterio empírico que varía según el estilo de juego.'
				]
			},
			{
				id: 'netz-verteidigung-gemeinsam',
				heading: 'Jugar juntos la red y la defensa',
				paragraphs: [
					'Ya sea en la red o en defensa, lo decisivo es que ambos compañeros se muevan juntos, como conectados por una línea invisible. Si uno avanza o retrocede, el otro debería acompañarlo, para no abrir huecos.'
				]
			},
			{
				id: 'doppel-fehler',
				heading: 'Errores típicos en pareja',
				box: {
					kind: 'mistakes',
					title: 'Esto frena a la mayoría de las parejas',
					items: [
						'Responsabilidad poco clara con las pelotas del centro, sin avisar.',
						'Un compañero en la red, el otro muy atrás — una formación mixta permanente.',
						'Caer en la frustración tras un punto perdido en lugar de reorganizarse.',
						'No adaptarse al nivel del compañero, sino buscar riesgo de forma aislada.'
					]
				}
			}
		],
		faq: [
			{
				question: '¿Existe el pádel también en individuales?',
				answer:
					'El pádel se juega mayoritariamente en parejas. Existen variantes individuales de forma puntual, pero son la excepción, no el estándar del deporte.'
			},
			{
				question: '¿Cómo encuentro el lado adecuado para mí?',
				answer:
					'Lo mejor es probar ambos lados en el entrenamiento. Muchos jugadores prefieren el lado en el que su mano dominante no tiene que encargarse constantemente de las pelotas que vienen del centro.'
			},
			{
				question: '¿Qué hago si mi compañero es mucho más débil o más fuerte?',
				answer:
					'La comunicación es lo que más ayuda: acordar claramente quién toma cada pelota, y adaptar tu propio riesgo al nivel conjunto en lugar de actuar de forma aislada.'
			}
		]
	},

	// ------------------------------------------------------------
	// INICIACIÓN Y ENTRENAMIENTO
	// ------------------------------------------------------------
	{
		slug: 'padel-fuer-anfaenger',
		title: 'Pádel para principiantes: todo lo que debes saber antes de tu primer partido',
		metaTitle: 'Pádel para principiantes: todo lo que debes saber antes de tu primer partido',
		metaDescription:
			'Pádel para principiantes: reglas, equipamiento, primeros golpes, errores típicos y consejos para tu primer partido.',
		excerpt:
			'Tu punto de partida: todo lo importante para tu primer día de pádel, resumido de forma compacta.',
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
				heading: 'Por qué el pádel es amigable para principiantes',
				paragraphs: [
					'El pádel se juega en una pista más pequeña que el tenis, las paredes dan a los errores una segunda oportunidad, y jugar en pareja significa que compartes el espacio con un compañero. Por eso, incluso los principiantes totales suelen conseguir peloteos reales al poco tiempo.'
				]
			},
			{
				id: 'was-du-brauchst',
				heading: 'Lo que necesitas',
				paragraphs: [
					'Para tu primer intento basta con ropa de deporte cómoda, zapatillas estables y — si la instalación no presta nada — una pala prestada o económica de iniciación. Más detalles en la guía de equipamiento de pádel.'
				]
			},
			{
				id: 'wichtigste-regeln',
				heading: 'Las reglas más importantes',
				paragraphs: [
					'En resumen: saque por debajo tras el bote, puntuación como en el tenis, la pelota puede rebotar en tu propia pared tras botar en el suelo y sigue en juego. La visión completa la encuentras en la guía de reglas del pádel.'
				]
			},
			{
				id: 'erste-schlaege',
				heading: 'Primeros golpes',
				paragraphs: [
					'Al principio, concéntrate en una derecha y un revés estables desde una posición básica tranquila. Las voleas, el globo y la bandeja llegan solos en cuanto los golpes básicos están asentados — más sobre esto en la guía de técnica.'
				]
			},
			{
				id: 'verhalten-auf-dem-court',
				heading: 'Comportamiento en la pista',
				paragraphs: [
					'Se aplican las normas de cortesía habituales, como en cualquier deporte de raqueta: devolver la pelota solo cuando el punto haya terminado claramente, no hacer avisos molestos durante el golpe del rival, y ser generoso en caso de duda con decisiones de fuera discutidas.'
				]
			},
			{
				id: 'tipps-erstes-match',
				heading: 'Consejos para tu primer partido',
				box: {
					kind: 'tips',
					title: 'Para que tu primera visita a la pista sea relajada',
					items: [
						'Calienta un poco antes en lugar de empezar directamente el partido.',
						'No intentes golpear cada pelota fuerte — al principio importa más mantenerse en el peloteo.',
						'Acuerda brevemente con jugadores más experimentados cómo contáis y jugáis.',
						'Pregunta directamente las dudas sobre las reglas sin problema — todo el mundo empezó alguna vez.'
					]
				}
			},
			{
				id: 'anfaengerfehler',
				heading: 'Errores de principiante',
				box: {
					kind: 'mistakes',
					title: 'Típico al principio, pero fácil de evitar',
					items: [
						'Concentrarse demasiado en la fuerza en lugar de en el control.',
						'Retroceder constantemente en lugar de buscar la red.',
						'Evitar el juego con la pared en lugar de practicarlo.',
						'No hablar con el compañero.'
					]
				}
			},
			{
				id: 'start-checkliste',
				heading: 'Lista de comprobación para empezar',
				box: {
					kind: 'checklist',
					title: 'Antes de empezar',
					items: [
						'Ropa de deporte cómoda y zapatillas estables.',
						'Pala prestada o conseguida como modelo de iniciación.',
						'Reglas básicas de saque, puntuación y cristal interiorizadas.',
						'Calentar de forma relajada antes del primer punto.',
						'Empezar con los oídos abiertos a los consejos de jugadores más experimentados.'
					]
				}
			}
		],
		faq: [
			{
				question: '¿Con qué rapidez aprendo pádel como principiante absoluto?',
				answer:
					'Las reglas básicas y los primeros peloteos suelen salir ya en la primera hora. Después, un nivel de juego seguro se desarrolla a lo largo de varias sesiones de entrenamiento y partidos.'
			},
			{
				question: '¿Necesito experiencia previa en otros deportes?',
				answer:
					'No, no es un requisito — la forma física general y el tacto de bola ayudan, pero no son imprescindibles.'
			},
			{
				question: '¿Dónde encuentro compañeros de juego para empezar?',
				answer:
					'Muchos clubes ofrecen sesiones de prueba o horarios de entrenamiento abiertos. Las ofertas para encontrar jugadores dentro de la propia comunidad también pueden ayudar a encontrar compañeros adecuados.'
			}
		]
	},
	{
		slug: 'padel-training',
		title: 'Entrenamiento de pádel: ejercicios para técnica, táctica y mejores partidos',
		metaTitle: 'Entrenamiento de pádel: ejercicios para técnica, táctica y mejores partidos',
		metaDescription:
			'Entrenamiento de pádel para principiantes y avanzados: ejercicios de volea, globo, bandeja, cristal, posicionamiento y práctica de partido.',
		excerpt:
			'Cómo estructurar tu entrenamiento con sentido — desde ejercicios técnicos hasta tu propio plan de 4 semanas.',
		category: 'einstieg',
		difficulty: 'fortgeschritten',
		readingTime: 9,
		updatedAt: '2026-08-01',
		relatedSlugs: ['padel-technik', 'padel-taktik', 'padel-doppel', 'padel-fuer-anfaenger'],
		sections: [
			{
				id: 'trainingsaufbau',
				heading: 'Cómo se estructura un buen entrenamiento de pádel',
				paragraphs: [
					'Un entrenamiento eficaz suele combinar tres bloques: ejercicios técnicos para golpes concretos, ejercicios tácticos para el posicionamiento y las decisiones, y práctica de partido real, donde ambos se combinan. Quien solo juega partidos sin trabajar de forma específica la técnica suele estancarse en un nivel determinado.'
				]
			},
			{
				id: 'technikuebungen',
				heading: 'Ejercicios técnicos',
				paragraphs: [
					'Repetir golpes concretos — como series de voleas en la red o repeticiones de globo desde la posición básica — mejora la consistencia y el timing, sin la presión de un punto real.'
				]
			},
			{
				id: 'taktikuebungen',
				heading: 'Ejercicios tácticos',
				paragraphs: [
					'Ejercicios como "ambas parejas empiezan atrás, el objetivo es avanzar juntos a la red" entrenan específicamente la toma de decisiones y la coordinación, no solo la pura técnica de golpeo.'
				]
			},
			{
				id: 'partneruebungen',
				heading: 'Ejercicios con el compañero',
				paragraphs: [
					'Los ejercicios en pareja — como peloteos dirigidos con un tipo de golpe prefijado (solo globo, solo volea) — ayudan a construir automatismos con tu propio compañero, que luego se pueden usar de forma intuitiva en el partido.'
				]
			},
			{
				id: 'training-mit-trainer',
				heading: 'Entrenamiento con entrenador',
				paragraphs: [
					'Un entrenador puede lanzar pelotas de forma dirigida para practicar repetidamente ciertas situaciones (defensa de remate, variantes de resto) y da feedback directo sobre la técnica — eso suele acelerar notablemente el progreso frente al juego puramente recreativo.'
				]
			},
			{
				id: 'fehleranalyse',
				heading: 'Análisis de errores',
				paragraphs: [
					'Después de un partido o entrenamiento merece la pena hacer un repaso breve y honesto: ¿qué golpes fallaron con inseguridad? ¿Qué decisiones tácticas no funcionaron? Los ajustes pequeños y dirigidos aportan más a largo plazo que la pura repetición sin reflexión.'
				]
			},
			{
				id: 'vier-wochen-plan',
				heading: 'Plan de entrenamiento de 4 semanas',
				box: {
					kind: 'info',
					title: 'Un marco de inicio sencillo — adáptalo a tu nivel',
					items: [
						'Semana 1: afianzar los golpes básicos — derecha, revés, voleas sencillas.',
						'Semana 2: incorporar de forma dirigida el globo y la bandeja en ejercicios de pareja.',
						'Semana 3: practicar el posicionamiento y la conquista de la red en pareja.',
						'Semana 4: aplicar lo aprendido en partidos reales y reflexionar después.'
					]
				}
			}
		],
		faq: [
			{
				question: '¿Con qué frecuencia debería entrenar para mejorar?',
				answer:
					'Depende de tus objetivos. Ya con una o dos sesiones dirigidas por semana, además de los partidos normales, se nota un progreso claro.'
			},
			{
				question: '¿Necesito un entrenador para mejorar?',
				answer:
					'No es imprescindible, pero un feedback dirigido suele acelerar notablemente el desarrollo, sobre todo en detalles técnicos como la bandeja o la víbora.'
			},
			{
				question: '¿Qué me aportan los ejercicios técnicos frente a solo jugar partidos?',
				answer:
					'En el partido lo que importa es el resultado; en el entrenamiento puedes trabajar de forma específica debilidades concretas, sin la presión de ganar el punto.'
			}
		]
	},

	// ------------------------------------------------------------
	// COSTE
	// ------------------------------------------------------------
	{
		slug: 'padel-kosten',
		title: '¿Cuánto cuesta el pádel? Precios, equipamiento y gastos continuos explicados',
		metaTitle: '¿Cuánto cuesta el pádel? Precios, equipamiento y gastos continuos explicados',
		metaDescription:
			'¿Cuánto cuesta el pádel? Resumen de alquiler de pista, equipamiento, clases, cuotas de socio y consejos para ahorrar.',
		excerpt:
			'Qué partidas de coste aparecen realmente en el pádel — y dónde merece la pena ahorrar.',
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
				heading: '¿Qué costes surgen?',
				paragraphs: [
					'El coste del pádel se compone a grandes rasgos del alquiler de la pista, el equipamiento, en su caso clases, y opcionalmente una cuota de socio en un club. Cuánto suma todo en total depende mucho de la región, la instalación y la frecuencia de juego — no hay precios fijos a nivel nacional, porque la oferta varía demasiado para eso.'
				]
			},
			{
				id: 'courtmiete',
				heading: 'Alquiler de pista',
				paragraphs: [
					'La mayoría de las instalaciones alquilan pistas por horas, a menudo repartidas entre hasta cuatro jugadores. Los precios varían bastante según ubicación, hora del día y ocupación — consultar la lista de precios de la instalación en cuestión da la información más fiable.'
				]
			},
			{
				id: 'ausruestung-kosten',
				heading: 'Equipamiento',
				paragraphs: [
					'Las palas de iniciación suelen ser más baratas que los modelos para jugadores avanzados, a lo que se suman en su caso zapatillas y ropa. Quien solo quiere probar puede pedir una pala prestada en muchas instalaciones y así apenas tiene que invertir al principio — más sobre esto en la guía de equipamiento de pádel.'
				]
			},
			{
				id: 'training-kosten',
				heading: 'Clases',
				paragraphs: [
					'Las clases individuales o en grupo con entrenador cuestan cantidades distintas según la instalación y el entrenador. Las clases en grupo suelen ser más baratas por persona que las clases individuales.'
				]
			},
			{
				id: 'turniere',
				heading: 'Torneos',
				paragraphs: [
					'Participar en torneos suele conllevar una cuota de inscripción que cubre el alquiler de pista, las pelotas y la organización. El importe varía según el organizador y el formato del torneo.'
				]
			},
			{
				id: 'mitgliedschaften',
				heading: 'Cuotas de socio',
				paragraphs: [
					'Algunas instalaciones y clubes ofrecen cuotas de socio con precios de pista reducidos o horarios de juego fijos. Si merece la pena depende de con qué regularidad juegas realmente — con un juego ocasional, suele salir más barato el simple alquiler por horas.'
				]
			},
			{
				id: 'spartipps',
				heading: 'Consejos para ahorrar',
				box: {
					kind: 'tips',
					title: 'Así el pádel se mantiene asequible',
					items: [
						'Al principio, pide una pala prestada en lugar de comprar enseguida.',
						'Las horas valle (por la mañana, entre semana) suelen ser más baratas que los horarios de tarde y fin de semana.',
						'Jugad entre cuatro y compartid el alquiler de la pista.',
						'Elige clases en grupo en lugar de individuales para empezar.',
						'Antes de contratar una cuota de socio, calcula de forma realista con qué frecuencia juegas realmente.'
					]
				}
			},
			{
				id: 'kosten-checkliste',
				heading: 'Lista de comprobación de costes',
				box: {
					kind: 'checklist',
					title: 'Aclarar antes de empezar',
					items: [
						'Comprobar la lista de precios de la instalación deseada para alquiler de pista y horas valle.',
						'Aclarar si se prestan o se proporcionan palas y pelotas.',
						'Calcular tu propia frecuencia de juego de forma realista.',
						'Considerar las clases en grupo como una forma económica de empezar.',
						'Contratar una cuota de socio solo cuando se vea que vas a jugar con regularidad.'
					]
				}
			}
		],
		faq: [
			{
				question: '¿Es el pádel más caro que el tenis?',
				answer:
					'No se puede decir de forma general — los costes dependen mucho de la región, la instalación y la frecuencia de juego personal, en ambos deportes por igual.'
			},
			{
				question: '¿Merece la pena una cuota de socio para principiantes?',
				answer:
					'Al principio, normalmente no es imprescindible — primero prueba con qué frecuencia juegas de verdad, y después decide sobre una cuota de socio.'
			},
			{
				question: '¿Cuál es la forma más económica de empezar con el pádel?',
				answer:
					'Una pala prestada, aprovechar las horas valle y jugar entre cuatro para compartir el alquiler de la pista — así los costes iniciales se mantienen manejables.'
			}
		]
	}
];
