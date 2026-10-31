// data/ecos-dram.json(ECOS 원자료)에서 5문항의 정답을 계산해 src/data/quiz.json 으로 쓴다.
// 실행: npm run data
// 원자료를 다시 받으면 이 스크립트만 다시 돌리면 된다. 정답을 손으로 적지 않는다.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const raw = JSON.parse(readFileSync(new URL("../data/ecos-dram.json", import.meta.url)));
const A = raw.annual;
const M = raw.monthly;

const round1 = (x) => Math.round(x * 10) / 10;
const pct = (to, from) => (to / from - 1) * 100;
const fmt = (v) => v.toFixed(2);

// ── 검증 ──────────────────────────────────────────────
// 1) 월별 값이 빠짐없이 있는지
const months = Object.keys(M).sort();
for (let i = 1; i < months.length; i++) {
  const [y0, m0] = months[i - 1].split("-").map(Number);
  const [y1, m1] = months[i].split("-").map(Number);
  if ((y1 * 12 + m1) - (y0 * 12 + m0) !== 1) throw new Error(`월 누락: ${months[i - 1]} → ${months[i]}`);
}
// 2) 연간 값 = 그 해 월별 평균인지 (ECOS 연간 지수는 월평균)
for (const y of Object.keys(A)) {
  const ms = months.filter((k) => k.startsWith(y + "-"));
  if (ms.length !== 12) continue;
  const avg = ms.reduce((s, k) => s + M[k], 0) / 12;
  if (Math.abs(avg - A[y]) / A[y] > 0.005) throw new Error(`${y} 연간 ${A[y]} ≠ 월평균 ${avg.toFixed(2)}`);
}

// ── 계산 ──────────────────────────────────────────────
const LAST_YEAR = 2025;                       // 연간 값이 있는 마지막 해
const years = Array.from({ length: 10 }, (_, i) => LAST_YEAR - 9 + i); // 2016~2025
const yoy = years.map((y) => ({ y, prev: A[y - 1], cur: A[y], r: pct(A[y], A[y - 1]) }));

const up = yoy.reduce((a, b) => (b.r > a.r ? b : a));
const down = yoy.reduce((a, b) => (b.r < a.r ? b : a));
const ups = yoy.filter((d) => d.r > 0);

const lastM = months.at(-1);                  // 가장 최근 월
const [ly, lm] = lastM.split("-");
const prevM = `${Number(ly) - 1}-${lm}`;
const r1y = pct(M[lastM], M[prevM]);

// 최근 120개월 안에서 고점 대비 가장 크게 떨어진 폭 (최대 낙폭)
const win = months.slice(-120);
let peak = win[0], best = { peak: win[0], trough: win[0], r: 0 };
for (const k of win) {
  if (M[k] > M[peak]) peak = k;
  const r = pct(M[k], M[peak]);
  if (r < best.r) best = { peak, trough: k, r };
}

const SRC = `${raw.source} · ${raw.item_name}(${raw.item_code}) · ${raw.basis} · ${raw.unit}`;
const yoyTable = yoy.map((d) => `${d.y} ${d.r >= 0 ? "+" : ""}${round1(d.r)}%`).join(" · ");
const ym = (k) => `${k.slice(0, 4)}년 ${Number(k.slice(5))}월`;

const questions = [
  {
    id: "max-rise",
    text: `최근 10년(${years[0]}~${LAST_YEAR}년) 중 DRAM 수출가격이 전년보다 가장 많이 오른 해, 상승률은 몇 %였을까요?`,
    unit: "%",
    hint: "상승률을 숫자로 입력하세요",
    answer: round1(up.r),
    why: `${up.y}년에 연평균 지수가 ${fmt(up.prev)}에서 ${fmt(up.cur)}까지 올라 ${round1(up.r)}% 상승했습니다.`,
    basis: `기준: ${years[0]}~${LAST_YEAR}년 연간 지수(월평균). 계산: (해당 연도 ÷ 전년 − 1) × 100 중 최댓값. 연도별: ${yoyTable}.`,
  },
  {
    id: "max-drop",
    text: `같은 10년 동안 DRAM 수출가격이 가장 크게 떨어진 해, 하락률은 몇 %였을까요?`,
    unit: "%",
    hint: "하락한 크기를 양수로 입력하세요 (예: 20)",
    answer: round1(-down.r),
    why: `${down.y}년에 연평균 지수가 ${fmt(down.prev)}에서 ${fmt(down.cur)}까지 ${round1(-down.r)}% 떨어졌습니다.`,
    basis: `기준: ${years[0]}~${LAST_YEAR}년 연간 지수(월평균). 계산: (해당 연도 ÷ 전년 − 1) × 100 중 최솟값을 양수로 표시. 연도별: ${yoyTable}.`,
  },
  {
    id: "last-year",
    text: `최근 1년(${ym(prevM)} → ${ym(lastM)}) 동안 DRAM 수출가격은 몇 % 올랐을까요?`,
    unit: "%",
    hint: "상승률을 숫자로 입력하세요",
    answer: round1(r1y),
    why: `월별 지수가 ${fmt(M[prevM])}에서 ${fmt(M[lastM])}까지 ${round1(r1y)}% 올랐습니다.`,
    basis: `기준: ${ym(prevM)}, ${ym(lastM)} 월별 지수. 계산: (${fmt(M[lastM])} ÷ ${fmt(M[prevM])} − 1) × 100. 최근 몇 달 값은 ECOS에서 잠정치로 나중에 고쳐질 수 있습니다.`,
  },
  {
    id: "drawdown",
    text: `최근 10년(${ym(win[0])}~${ym(lastM)}) 월별 지수에서, 고점을 찍은 뒤 가장 크게 떨어졌을 때 하락률은 몇 %였을까요?`,
    unit: "%",
    hint: "하락한 크기를 양수로 입력하세요 (예: 50)",
    answer: round1(-best.r),
    why: `${ym(best.peak)} 고점 ${fmt(M[best.peak])}에서 ${ym(best.trough)} 저점 ${fmt(M[best.trough])}까지 ${round1(-best.r)}% 떨어졌습니다.`,
    basis: `기준: ${ym(win[0])}~${ym(lastM)} 월별 지수 120개월. 계산: 각 달을 그 전까지의 최고치와 비교한 하락률 중 가장 큰 값 (최대 낙폭). (${fmt(M[best.trough])} ÷ ${fmt(M[best.peak])} − 1) × 100.`,
  },
  {
    id: "up-years",
    text: `${years[0]}~${LAST_YEAR}년 10년 가운데, DRAM 수출가격이 전년보다 오른 해는 몇 번일까요?`,
    unit: "번",
    hint: "0~10 사이 숫자를 입력하세요",
    answer: ups.length,
    why: `오른 해는 ${ups.map((d) => d.y).join(", ")}년, 모두 ${ups.length}번입니다. 나머지 ${10 - ups.length}번은 떨어졌습니다.`,
    basis: `기준: ${years[0]}~${LAST_YEAR}년 연간 지수(월평균)를 전년과 비교. 연도별: ${yoyTable}.`,
  },
];

const quiz = {
  title: "DRAM 가격, 얼마나 알고 있나요?",
  subtitle: "한국은행 DRAM 수출물가지수로 맞혀 보는 숫자 퀴즈",
  source: SRC,
  source_url: "https://ecos.bok.or.kr/",
  retrieved: raw.retrieved,
  caveat: "수출물가지수는 국내 기업이 수출하는 DRAM의 계약 가격을 지수로 만든 것으로, 시장 현물가격과는 다를 수 있습니다. 달러기준이라 환율 효과는 빠져 있습니다. 최근 몇 달 값은 잠정치입니다.",
  questions,
};

mkdirSync(new URL("../src/data/", import.meta.url), { recursive: true });
writeFileSync(new URL("../src/data/quiz.json", import.meta.url), JSON.stringify(quiz, null, 2) + "\n");
for (const q of questions) console.log(`${q.id.padEnd(10)} ${q.answer}${q.unit}  — ${q.why}`);
