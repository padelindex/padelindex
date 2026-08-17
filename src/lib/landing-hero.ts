export function initLanding() {
	const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

	const io = new IntersectionObserver(
		(entries) => {
			entries.forEach((e) => {
				if (e.isIntersecting) {
					e.target.classList.add('in');
					io.unobserve(e.target);
				}
			});
		},
		{ threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
	);
	document.querySelectorAll('.rv').forEach((el) => io.observe(el));

	const W = 600;
	const BASE = 180;
	const TOP = 18;

	function gaussPath(centerX: number, spread: number) {
		const amp = Math.min(BASE - TOP, 5400 / spread);
		let d = '';
		for (let i = 0; i <= 120; i++) {
			const x = (i / 120) * W;
			const y = BASE - amp * Math.exp(-((x - centerX) ** 2) / (2 * spread * spread));
			d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1);
		}
		return d;
	}

	const el = {
		curve: document.getElementById('heroCurve'),
		fill: document.getElementById('heroFill'),
		peak: document.getElementById('heroPeak'),
		score: document.getElementById('heroScore'),
		ring: document.getElementById('heroRing'),
		conf: document.getElementById('heroConf'),
		matches: document.getElementById('heroMatches'),
		sigma: document.getElementById('heroSigma'),
		range: document.getElementById('heroRange'),
		slider: document.getElementById('mSlider') as HTMLInputElement | null,
		sliderVal: document.getElementById('sliderVal')
	};

	if (!el.curve || !el.fill || !el.peak || !el.score || !el.ring || !el.slider) return;

	const RING_CIRC = 2 * Math.PI * 18;
	const RATING_MAX = 4.82;
	const RATING_MIN = 3.1;

	const spreadFor = (m: number) => 130 / (1 + m / 6) + 22;
	const SPREAD_1 = spreadFor(1);
	const SPREAD_60 = spreadFor(60);

	function paint(matches: number) {
		const spread = spreadFor(matches);
		const t = (SPREAD_1 - spread) / (SPREAD_1 - SPREAD_60);
		const rating = RATING_MIN + (RATING_MAX - RATING_MIN) * t;
		const conf = Math.max(0, Math.min(1, t));
		const centerX = (rating / 7) * W;
		const d = gaussPath(centerX, spread);

		el.curve?.setAttribute('d', d);
		el.fill?.setAttribute('d', d + ` L${W} ${BASE} L0 ${BASE} Z`);
		el.peak?.setAttribute('x1', centerX.toFixed(1));
		el.peak?.setAttribute('x2', centerX.toFixed(1));
		if (el.score) el.score.textContent = rating.toFixed(2);
		el.ring?.setAttribute(
			'stroke-dasharray',
			`${(RING_CIRC * conf).toFixed(2)} ${RING_CIRC.toFixed(2)}`
		);
		if (el.conf) el.conf.textContent = Math.round(conf * 100) + '%';
		if (el.matches) el.matches.textContent = String(matches);
		if (el.sigma) el.sigma.textContent = conf < 0.34 ? 'niedrig' : conf < 0.72 ? 'mittel' : 'hoch';
		if (el.range) {
			el.range.textContent = '±' + (1.9 * (1 - conf * 0.82)).toFixed(2).replace('.', ',');
		}
		if (el.sliderVal) el.sliderVal.textContent = String(matches);
	}

	const START = 1;
	const END = 34;
	const DUR = 2100;

	function intro(ts: number, t0: number) {
		const p = Math.min(1, (ts - t0) / DUR);
		const eased = 1 - Math.pow(1 - p, 3);
		const m = Math.round(START + (END - START) * eased);
		paint(m);
		if (el.slider) el.slider.value = String(m);
		if (p < 1) requestAnimationFrame((n) => intro(n, t0));
	}

	paint(START);
	if (reduce) {
		paint(END);
		el.slider.value = String(END);
	} else {
		requestAnimationFrame((ts) => intro(ts, ts));
	}

	el.slider.addEventListener('input', (e) => {
		paint(Number((e.target as HTMLInputElement).value));
	});

	const btn = document.getElementById('joinBtn') as HTMLButtonElement | null;
	const mail = document.getElementById('mail') as HTMLInputElement | null;
	const msg = document.getElementById('joinMsg');
	if (!btn || !mail || !msg) return;

	btn.addEventListener('click', async () => {
		const v = mail.value.trim();
		if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v)) {
			msg.style.color = 'var(--signal)';
			msg.textContent = 'Bitte eine gültige E-Mail-Adresse eingeben.';
			mail.focus();
			return;
		}
		btn.disabled = true;
		try {
			const res = await fetch('/api/waitlist', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ email: v })
			});
			const data = (await res.json().catch(() => ({}))) as { message?: string };
			if (!res.ok) {
				msg.style.color = 'var(--signal)';
				msg.textContent =
					data.message || 'Konnte nicht eingetragen werden. Bitte später erneut versuchen.';
				btn.disabled = false;
				return;
			}
			msg.style.color = 'var(--court)';
			msg.textContent = 'Eingetragen. Wir melden uns, sobald dein Verein dabei ist.';
			mail.value = '';
			btn.textContent = 'Notiert';
		} catch {
			msg.style.color = 'var(--signal)';
			msg.textContent = 'Netzwerkfehler. Bitte später erneut versuchen.';
			btn.disabled = false;
		}
	});
	mail.addEventListener('keydown', (e) => {
		if (e.key === 'Enter') btn.click();
	});
}
