// ============================================================
// PadelIndex — Contenido del quiz (español)
// ============================================================
// Traducción al español de de.ts. Mismos ids, mismos valores de
// difficulty/correctOptionId y relatedGuideSlugs — solo cambia el
// texto. Mantener sincronizado con de.ts y en.ts; quiz-data.test.ts
// lo comprueba automáticamente.

import type { QuizDifficulty, QuizQuestion, QuizResultTier } from '../../quiz';

export const QUIZ_DIFFICULTIES_ES: QuizDifficulty[] = [
	{
		slug: 'anfaenger',
		label: 'Principiante',
		description: 'Reglas básicas, puntuación, saque, cristal y situaciones de juego sencillas.',
		color: '#16A394',
		metaTitle: 'Quiz de pádel para principiantes: ¿conoces las reglas más importantes?',
		metaDescription:
			'Pon a prueba tus conocimientos sobre las reglas del pádel, el saque, la puntuación, el cristal y situaciones de juego sencillas.',
		recommendedGuideSlugs: ['padel-regeln', 'padel-fuer-anfaenger', 'padel-ausruestung']
	},
	{
		slug: 'fortgeschritten',
		label: 'Avanzado',
		description:
			'Decisiones tácticas, bandeja, globo, volea, posicionamiento y comunicación en pareja.',
		color: '#0F6E5C',
		metaTitle: 'Quiz de pádel para avanzados: técnica, táctica y situaciones de juego',
		metaDescription:
			'Pon a prueba tus conocimientos de pádel sobre la bandeja, el globo, la volea, la táctica de pareja, el posicionamiento y el cristal.',
		recommendedGuideSlugs: ['padel-technik', 'padel-taktik', 'padel-doppel']
	},
	{
		slug: 'experte',
		label: 'Experto',
		description:
			'Situaciones de reglas complejas, estrategia de partido, elección de golpe bajo presión, ángulos, ritmo y riesgo.',
		color: '#0B1E26',
		metaTitle: 'Quiz de pádel para expertos: táctica, estrategia y situaciones de juego complejas',
		metaDescription:
			'El quiz de pádel difícil para jugadores con experiencia: estrategia de partido, elección de golpe, riesgo y decisiones tácticas.',
		recommendedGuideSlugs: ['padel-taktik', 'padel-training', 'padel-doppel']
	}
];

export const QUIZ_RESULT_TIERS_ES: QuizResultTier[] = [
	{
		minPercentage: 0,
		maxPercentage: 39,
		title: 'Todavía hay margen de mejora',
		text: 'Aún no dominas los fundamentos con seguridad. Empieza por las reglas más importantes y por situaciones de juego sencillas.'
	},
	{
		minPercentage: 40,
		maxPercentage: 69,
		title: 'Base sólida',
		text: 'Ya tienes una buena comprensión básica. Con algo más de conocimiento de reglas y táctica ganarás seguridad rápidamente.'
	},
	{
		minPercentage: 70,
		maxPercentage: 89,
		title: 'Buen conocimiento de pádel',
		text: 'Ya entiendes bien muchas situaciones importantes. Ahora merece la pena dar el siguiente paso en técnica y táctica de partido.'
	},
	{
		minPercentage: 90,
		maxPercentage: 100,
		title: 'Experto en pádel',
		text: '¡Muy fuerte! Conoces muy bien las reglas, la táctica y las situaciones de juego.'
	}
];

export const QUIZ_QUESTIONS_ES: QuizQuestion[] = [
	// ------------------------------------------------------------
	// PRINCIPIANTE
	// ------------------------------------------------------------
	{
		id: 'anfaenger-1',
		difficulty: 'anfaenger',
		question: '¿Qué es principalmente el pádel?',
		options: [
			{ id: 'A', text: 'Un deporte individual sin paredes' },
			{
				id: 'B',
				text: 'Un deporte de raqueta que se juega normalmente en parejas en una pista con paredes de cristal'
			},
			{ id: 'C', text: 'Una variante del squash sin red' },
			{ id: 'D', text: 'Un entrenamiento puramente físico' }
		],
		correctOptionId: 'B',
		explanation:
			'El pádel es un deporte de raqueta que se juega normalmente en parejas. Son característicos la pista más pequeña, la red y las paredes de cristal.',
		relatedGuideSlugs: ['padel-regeln']
	},
	{
		id: 'anfaenger-2',
		difficulty: 'anfaenger',
		question: '¿Cómo se cuenta normalmente en pádel?',
		options: [
			{ id: 'A', text: '1, 2, 3, 4' },
			{ id: 'B', text: '0, 1, 2, 3' },
			{ id: 'C', text: '15, 30, 40, juego' },
			{ id: 'D', text: 'Cada pelota cuenta como un set' }
		],
		correctOptionId: 'C',
		explanation: 'La puntuación es parecida a la del tenis: 15, 30, 40 y juego.',
		relatedGuideSlugs: ['padel-regeln']
	},
	{
		id: 'anfaenger-3',
		difficulty: 'anfaenger',
		question: '¿Cómo debe ejecutarse el saque en pádel?',
		options: [
			{ id: 'A', text: 'Por arriba, por encima de la cabeza' },
			{ id: 'B', text: 'Por abajo, después de que la pelota haya botado una vez en el suelo' },
			{ id: 'C', text: 'Directamente del aire, como una volea' },
			{ id: 'D', text: 'Con las dos manos' }
		],
		correctOptionId: 'B',
		explanation: 'El saque se golpea por abajo. La pelota debe botar antes en el suelo.',
		relatedGuideSlugs: ['padel-regeln']
	},
	{
		id: 'anfaenger-4',
		difficulty: 'anfaenger',
		question: '¿Puede la pelota tocar la pared de cristal después de botar?',
		options: [
			{ id: 'A', text: 'Sí, es una parte central del juego' },
			{ id: 'B', text: 'No, entonces el punto se pierde inmediatamente' },
			{ id: 'C', text: 'Solo en el saque' },
			{ id: 'D', text: 'Solo si ambos equipos están de acuerdo' }
		],
		correctOptionId: 'A',
		explanation:
			'Tras el bote en el suelo, la pelota puede tocar la pared de cristal y sigue en juego.',
		relatedGuideSlugs: ['padel-regeln']
	},
	{
		id: 'anfaenger-5',
		difficulty: 'anfaenger',
		question: '¿Cuántos jugadores suele haber en la pista en un partido de pádel?',
		options: [
			{ id: 'A', text: '2' },
			{ id: 'B', text: '3' },
			{ id: 'C', text: '4' },
			{ id: 'D', text: '6' }
		],
		correctOptionId: 'C',
		explanation: 'El pádel se juega mayoritariamente en parejas, es decir, con cuatro jugadores.',
		relatedGuideSlugs: ['padel-doppel']
	},
	{
		id: 'anfaenger-6',
		difficulty: 'anfaenger',
		question: '¿Qué es un globo (lob)?',
		options: [
			{ id: 'A', text: 'Una pelota corta justo detrás de la red' },
			{ id: 'B', text: 'Una pelota alta por encima de los rivales' },
			{ id: 'C', text: 'Una falta de saque' },
			{ id: 'D', text: 'Un golpe contra tu propio cristal' }
		],
		correctOptionId: 'B',
		explanation:
			'El globo es una pelota alta pensada para hacer retroceder a los rivales desde la red.',
		relatedGuideSlugs: ['padel-begriffe', 'padel-technik']
	},
	{
		id: 'anfaenger-7',
		difficulty: 'anfaenger',
		question:
			'¿Qué ocurre si la pelota se golpea directamente contra la pared de cristal rival sin botar antes en el suelo?',
		options: [
			{ id: 'A', text: 'La pelota es buena' },
			{ id: 'B', text: 'La pelota está fuera' },
			{ id: 'C', text: 'Hay que repetir el punto' },
			{ id: 'D', text: 'El rival recibe dos puntos' }
		],
		correctOptionId: 'B',
		explanation:
			'La pelota primero debe botar en el campo rival. Si golpea directamente la pared de cristal rival, está fuera.',
		relatedGuideSlugs: ['padel-regeln']
	},
	{
		id: 'anfaenger-8',
		difficulty: 'anfaenger',
		question: '¿Qué es especialmente importante para los principiantes?',
		options: [
			{ id: 'A', text: 'Golpear siempre lo más fuerte posible' },
			{ id: 'B', text: 'Jugar cada pelota como un remate' },
			{ id: 'C', text: 'Mantener la pelota en juego con control' },
			{ id: 'D', text: 'No hablar nunca con el compañero' }
		],
		correctOptionId: 'C',
		explanation:
			'Para los principiantes, el control y la constancia importan más que la pura dureza de golpe.',
		relatedGuideSlugs: ['padel-fuer-anfaenger']
	},
	{
		id: 'anfaenger-9',
		difficulty: 'anfaenger',
		question: '¿Qué equipamiento se necesita como mínimo?',
		options: [
			{ id: 'A', text: 'Una pala de pádel, zapatillas adecuadas y pelotas' },
			{ id: 'B', text: 'Una raqueta de tenis y botas de fútbol' },
			{ id: 'C', text: 'Una raqueta de squash y un casco' },
			{ id: 'D', text: 'Solo guantes' }
		],
		correctOptionId: 'A',
		explanation:
			'Para el pádel se necesita una pala de pádel, zapatillas adecuadas y pelotas de pádel.',
		relatedGuideSlugs: ['padel-ausruestung']
	},
	{
		id: 'anfaenger-10',
		difficulty: 'anfaenger',
		question: '¿Cuál es un error frecuente de principiante?',
		options: [
			{ id: 'A', text: 'Comunicarse demasiado con el compañero' },
			{ id: 'B', text: 'Jugar de forma demasiado controlada' },
			{ id: 'C', text: 'Colocarse demasiado cerca de la red en el resto' },
			{ id: 'D', text: 'Querer golpear cada pelota demasiado fuerte' }
		],
		correctOptionId: 'D',
		explanation:
			'Muchos principiantes intentan golpear fuerte con demasiada frecuencia. En pádel, la colocación, la paciencia y el control suelen ser más importantes.',
		relatedGuideSlugs: ['padel-fuer-anfaenger', 'padel-taktik']
	},

	// ------------------------------------------------------------
	// AVANZADO
	// ------------------------------------------------------------
	{
		id: 'fortgeschritten-1',
		difficulty: 'fortgeschritten',
		question: '¿Por qué es tan importante tácticamente el globo en pádel?',
		options: [
			{ id: 'A', text: 'Termina automáticamente el punto' },
			{ id: 'B', text: 'Ayuda a alejar a los rivales de la red' },
			{ id: 'C', text: 'Cuenta doble' },
			{ id: 'D', text: 'Solo lo pueden jugar los profesionales' }
		],
		correctOptionId: 'B',
		explanation:
			'Con un buen globo se puede hacer retroceder a los rivales desde la red y ocupar tú mismo una mejor posición.',
		relatedGuideSlugs: ['padel-taktik']
	},
	{
		id: 'fortgeschritten-2',
		difficulty: 'fortgeschritten',
		question: '¿Cuál es el objetivo principal de una bandeja?',
		options: [
			{ id: 'A', text: 'Ganar siempre el punto de inmediato' },
			{ id: 'B', text: 'Mantener la pelota baja con control y conservar la posición de red' },
			{ id: 'C', text: 'Golpear la pelota fuera a propósito' },
			{ id: 'D', text: 'Sustituir al saque' }
		],
		correctOptionId: 'B',
		explanation:
			'La bandeja es un golpe de arriba controlado con el que se presiona y a la vez se asegura la posición de red.',
		relatedGuideSlugs: ['padel-technik']
	},
	{
		id: 'fortgeschritten-3',
		difficulty: 'fortgeschritten',
		question: '¿Cuándo es especialmente útil una volea?',
		options: [
			{ id: 'A', text: 'Cuando estás en la red y puedes tomar la pelota pronto' },
			{ id: 'B', text: 'Cuando la pelota está detrás de tu propia línea de fondo' },
			{ id: 'C', text: 'Solo en el saque' },
			{ id: 'D', text: 'Nunca, las voleas están prohibidas en pádel' }
		],
		correctOptionId: 'A',
		explanation:
			'Las voleas se juegan sobre todo en la red, para tomar la pelota pronto y generar presión.',
		relatedGuideSlugs: ['padel-technik']
	},
	{
		id: 'fortgeschritten-4',
		difficulty: 'fortgeschritten',
		question: '¿Qué posición suele ser ventajosa en pádel?',
		options: [
			{ id: 'A', text: 'Los dos jugadores permanentemente muy atrás' },
			{ id: 'B', text: 'Los dos jugadores en la red con control, cuando pueden ejercer presión' },
			{ id: 'C', text: 'Un jugador se sienta fuera de la pista' },
			{ id: 'D', text: 'Los dos jugadores uno junto al otro en el centro' }
		],
		correctOptionId: 'B',
		explanation:
			'La red suele ser una posición fuerte en pádel, porque desde ahí se puede generar presión.',
		relatedGuideSlugs: ['padel-taktik']
	},
	{
		id: 'fortgeschritten-5',
		difficulty: 'fortgeschritten',
		question: '¿Qué es importante en la comunicación en pareja?',
		options: [
			{ id: 'A', text: 'Hablar lo menos posible' },
			{ id: 'B', text: 'Hablar solo después del partido' },
			{ id: 'C', text: 'Avisos claros como «mía», «tuya», «fuera» o «globo»' },
			{ id: 'D', text: 'Confundir al compañero durante el peloteo' }
		],
		correctOptionId: 'C',
		explanation: 'Los avisos cortos y claros ayudan a evitar malentendidos.',
		relatedGuideSlugs: ['padel-doppel']
	},
	{
		id: 'fortgeschritten-6',
		difficulty: 'fortgeschritten',
		question: '¿Qué es una chiquita?',
		options: [
			{ id: 'A', text: 'Un remate muy fuerte' },
			{ id: 'B', text: 'Una pelota baja y controlada a los pies de los rivales en la red' },
			{ id: 'C', text: 'Un tipo de saque por arriba' },
			{ id: 'D', text: 'Un peloteo sin cristal' }
		],
		correctOptionId: 'B',
		explanation:
			'La chiquita es una pelota táctica que se juega baja, a los pies de los rivales, para dificultar su volea.',
		relatedGuideSlugs: ['padel-begriffe']
	},
	{
		id: 'fortgeschritten-7',
		difficulty: 'fortgeschritten',
		question: '¿Cuándo conviene usar el cristal de forma deliberada?',
		options: [
			{
				id: 'A',
				text: 'Cuando el golpe directo es difícil y la pelota se vuelve más jugable tras la pared'
			},
			{ id: 'B', text: 'Solo en el saque' },
			{ id: 'C', text: 'Nunca, tocar el cristal está prohibido' },
			{ id: 'D', text: 'Solo si el rival lo permite' }
		],
		correctOptionId: 'A',
		explanation: 'El cristal puede ayudar a ganar más tiempo y a jugar la pelota con más control.',
		relatedGuideSlugs: ['padel-taktik']
	},
	{
		id: 'fortgeschritten-8',
		difficulty: 'fortgeschritten',
		question: '¿Cuál es un error táctico en la red?',
		options: [
			{ id: 'A', text: 'Tomar la pelota pronto' },
			{ id: 'B', text: 'Poner al rival bajo presión' },
			{ id: 'C', text: 'Dejar demasiado hueco entre los compañeros' },
			{ id: 'D', text: 'Colocar la pelota con control' }
		],
		correctOptionId: 'C',
		explanation:
			'Los huecos grandes entre los compañeros abren oportunidades de ataque fáciles para los rivales.',
		relatedGuideSlugs: ['padel-doppel']
	},
	{
		id: 'fortgeschritten-9',
		difficulty: 'fortgeschritten',
		question: '¿Por qué no conviene rematar cada pelota alta?',
		options: [
			{ id: 'A', text: 'Porque los remates nunca están permitidos' },
			{
				id: 'B',
				text: 'Porque un mal remate puede darle al rival una buena oportunidad de contraataque'
			},
			{ id: 'C', text: 'Porque las pelotas altas están fuera automáticamente' },
			{ id: 'D', text: 'Porque si no se repite el punto' }
		],
		correctOptionId: 'B',
		explanation:
			'Un remate mal colocado o demasiado flojo se puede defender o contrarrestar con facilidad.',
		relatedGuideSlugs: ['padel-technik', 'padel-taktik']
	},
	{
		id: 'fortgeschritten-10',
		difficulty: 'fortgeschritten',
		question: '¿Qué es especialmente importante en el resto?',
		options: [
			{ id: 'A', text: 'Golpear lo más fuerte posible de inmediato' },
			{
				id: 'B',
				text: 'Poner la pelota en juego con seguridad y colocarla lo más profunda posible'
			},
			{ id: 'C', text: 'Jugar la pelota directamente contra tu propia pared' },
			{ id: 'D', text: 'Jugar la pelota a la red a propósito' }
		],
		correctOptionId: 'B',
		explanation: 'Un resto seguro y profundo evita ataques fáciles del equipo que saca.',
		relatedGuideSlugs: ['padel-taktik']
	},

	// ------------------------------------------------------------
	// EXPERTO
	// ------------------------------------------------------------
	{
		id: 'experte-1',
		difficulty: 'experte',
		question:
			'Estás en la red, el rival juega un globo muy bueno hacia tu lado de revés. ¿Cuál suele ser la mejor decisión?',
		options: [
			{ id: 'A', text: 'Correr hacia atrás y rematar a ciegas' },
			{ id: 'B', text: 'Devolver la pelota con control mediante una bandeja o un golpe defensivo' },
			{ id: 'C', text: 'Dejar pasar la pelota a propósito' },
			{ id: 'D', text: 'Ignorar al compañero' }
		],
		correctOptionId: 'B',
		explanation:
			'Bajo presión, el control importa más que el riesgo. Una bandeja defensiva o una retirada controlada suelen ser mejores que un remate forzado.',
		relatedGuideSlugs: ['padel-taktik', 'padel-technik']
	},
	{
		id: 'experte-2',
		difficulty: 'experte',
		question: '¿Por qué es importante el cambio de ritmo en el pádel de alto nivel?',
		options: [
			{ id: 'A', text: 'Para que el peloteo se vuelva aleatorio' },
			{
				id: 'B',
				text: 'Para alterar el ritmo, la posición y el tiempo de reacción de los rivales'
			},
			{ id: 'C', text: 'Porque las pelotas fuertes siempre ganan' },
			{ id: 'D', text: 'Porque las pelotas lentas están prohibidas' }
		],
		correctOptionId: 'B',
		explanation: 'Alternar ritmo, altura y colocación hace que el juego sea más difícil de leer.',
		relatedGuideSlugs: ['padel-taktik']
	},
	{
		id: 'experte-3',
		difficulty: 'experte',
		question: '¿Cuándo es estratégicamente arriesgado un remate fuerte?',
		options: [
			{
				id: 'A',
				text: 'Cuando no está colocado y el rival puede contrarrestarlo con el cristal o la reja'
			},
			{ id: 'B', text: 'Cuando se quiere ganar el punto' },
			{ id: 'C', text: 'Cuando la pelota está alta' },
			{ id: 'D', text: 'Siempre en el primer juego del set' }
		],
		correctOptionId: 'A',
		explanation: 'Un remate impreciso puede volver y debilitar tu propia posición.',
		relatedGuideSlugs: ['padel-technik']
	},
	{
		id: 'experte-4',
		difficulty: 'experte',
		question: '¿Cuál es un objetivo útil de una chiquita a alto nivel?',
		options: [
			{ id: 'A', text: 'Forzar al rival a una volea baja difícil' },
			{ id: 'B', text: 'Jugar la pelota lo más alta posible contra la pared del fondo' },
			{ id: 'C', text: 'Regalar la pelota directamente' },
			{ id: 'D', text: 'Sustituir al saque' }
		],
		correctOptionId: 'A',
		explanation:
			'Una buena chiquita fuerza al rival a una volea baja e incómoda y puede ayudar a conquistar la red.',
		relatedGuideSlugs: ['padel-begriffe', 'padel-taktik']
	},
	{
		id: 'experte-5',
		difficulty: 'experte',
		question: '¿Qué decisión suele tener sentido cuando tu propio equipo presiona en la red?',
		options: [
			{ id: 'A', text: 'Apostar solo por la máxima dureza' },
			{
				id: 'B',
				text: 'Abrir ángulos, jugar a los pies o buscar huecos entre los rivales'
			},
			{ id: 'C', text: 'Interrumpir el peloteo' },
			{ id: 'D', text: 'Jugar siempre al centro de tu propia mitad' }
		],
		correctOptionId: 'B',
		explanation:
			'En la red, la colocación, los ángulos y la presión a los pies suelen ser más efectivos que la pura potencia.',
		relatedGuideSlugs: ['padel-taktik']
	},
	{
		id: 'experte-6',
		difficulty: 'experte',
		question: '¿Por qué el centro entre los rivales suele ser un buen objetivo?',
		options: [
			{ id: 'A', text: 'Porque ahí nunca hay nadie' },
			{
				id: 'B',
				text: 'Porque las responsabilidades pueden quedar poco claras y se reducen los ángulos'
			},
			{ id: 'C', text: 'Porque ahí la pelota cuenta doble' },
			{ id: 'D', text: 'Porque solo se puede jugar ahí' }
		],
		correctOptionId: 'B',
		explanation:
			'El centro puede poner a prueba la comunicación y la responsabilidad, y suele quitarle ángulo a los rivales.',
		relatedGuideSlugs: ['padel-doppel', 'padel-taktik']
	},
	{
		id: 'experte-7',
		difficulty: 'experte',
		question:
			'Estás defendiendo profundo y los rivales están muy cerca de la red. ¿Qué opción suele tener sentido?',
		options: [
			{ id: 'A', text: 'Un globo controlado por encima de los dos rivales' },
			{ id: 'B', text: 'Una pelota lenta hacia tu propia red' },
			{ id: 'C', text: 'Un remate desde la defensa' },
			{ id: 'D', text: 'La pelota directa contra la pared de cristal rival sin bote' }
		],
		correctOptionId: 'A',
		explanation: 'Un buen globo puede reconquistar la red y quitar presión a la situación.',
		relatedGuideSlugs: ['padel-taktik']
	},
	{
		id: 'experte-8',
		difficulty: 'experte',
		question: '¿Qué caracteriza a una buena táctica de pareja?',
		options: [
			{ id: 'A', text: 'Ambos jugadores toman decisiones de forma independiente' },
			{ id: 'B', text: 'Movimiento conjunto, roles claros y elección de riesgo coordinada' },
			{ id: 'C', text: 'Solo juega todas las pelotas el jugador más fuerte' },
			{ id: 'D', text: 'La mayor distancia posible entre los jugadores' }
		],
		correctOptionId: 'B',
		explanation:
			'Las parejas exitosas se mueven de forma coordinada y toman decisiones tácticas juntas.',
		relatedGuideSlugs: ['padel-doppel']
	},
	{
		id: 'experte-9',
		difficulty: 'experte',
		question: '¿Cuándo puede ser más efectiva una pelota lenta que una pelota fuerte?',
		options: [
			{
				id: 'A',
				text: 'Cuando fuerza al rival a un punto de contacto bajo o a un movimiento incómodo'
			},
			{ id: 'B', text: 'Nunca' },
			{ id: 'C', text: 'Solo durante el calentamiento' },
			{ id: 'D', text: 'Solo en el punto de partido' }
		],
		correctOptionId: 'A',
		explanation: 'Una pelota lenta y bien colocada puede romper el ritmo y provocar errores.',
		relatedGuideSlugs: ['padel-taktik']
	},
	{
		id: 'experte-10',
		difficulty: 'experte',
		question: '¿Cuál es una señal de madurez táctica en pádel?',
		options: [
			{ id: 'A', text: 'Jugar cada pelota con el máximo riesgo' },
			{ id: 'B', text: 'Elegir conscientemente entre riesgo, control, colocación y posición' },
			{ id: 'C', text: 'No jugar nunca globos' },
			{ id: 'D', text: 'Querer ganar puntos solo con potencia' }
		],
		correctOptionId: 'B',
		explanation:
			'Los buenos jugadores eligen según la situación entre seguridad, presión y riesgo.',
		relatedGuideSlugs: ['padel-taktik', 'padel-training']
	}
];
