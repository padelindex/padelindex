// ============================================================
// PadelIndex — JSON-LD sicher in <script>-Tags einbetten
// ============================================================
// JSON.stringify() allein reicht nicht: ein Vereins- oder Spielername
// mit "</script>" darin (Nutzereingabe, siehe claim-match.ts) würde den
// script-Tag vorzeitig beenden. "<" als < zu escapen ist innerhalb
// eines JSON-Strings gültig und macht das strukturell unmöglich, egal
// welcher Text vorkommt.
export function jsonLd(data: unknown): string {
	return JSON.stringify(data).replace(/</g, '\\u003c');
}
