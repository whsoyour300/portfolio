"use client";

/* DRAM 퀴즈 — 시작 · 문항(입력 → 정답 공개) · 결과 · 공유
 * 정답과 근거는 src/data/quiz.json 에만 있다. 서버나 DB는 부르지 않는다.
 */

import { useEffect, useState } from "react";

type Question = {
  id: string;
  text: string;
  unit: string;
  hint: string;
  answer: number;
  why: string;
  basis: string;
};

type QuizData = {
  title: string;
  subtitle: string;
  source: string;
  source_url: string;
  retrieved: string;
  caveat: string;
  questions: Question[];
};

type Phase = "home" | "quiz" | "result";

/* ── 채점 ────────────────────────────────────────────
 * 오차율 × 200 만큼 깎는다 (10% 빗나가면 80점, 50% 이상이면 0점)
 */
const errRate = (q: Question, mine: number) => Math.abs(mine - q.answer) / Math.abs(q.answer);
const scoreOne = (q: Question, mine: number) => Math.max(0, Math.round(100 - errRate(q, mine) * 200));

function reaction(q: Question, mine: number) {
  const e = errRate(q, mine);
  if (e === 0) return { text: "정확히 맞혔어요!", cls: "hit" };
  const dir = mine > q.answer ? "실제보다 높게" : "실제보다 낮게";
  if (e <= 0.1) return { text: `거의 맞혔어요 · ${dir} 봤어요`, cls: "hit" };
  if (e <= 0.4) return { text: `감은 잡았어요 · ${dir} 봤어요`, cls: "" };
  return { text: `차이가 꽤 나요 · ${dir} 봤어요`, cls: "miss" };
}

function gradeOf(s: number) {
  if (s >= 85) return { name: "DRAM 애널리스트급", emoji: "🏆" };
  if (s >= 60) return { name: "시장 감각 있음", emoji: "📈" };
  if (s >= 30) return { name: "감 잡는 중", emoji: "🔍" };
  return { name: "변동성에 놀라셨죠?", emoji: "🎢" };
}

const fmt = (v: number, unit: string) => `${v.toLocaleString("ko-KR")}${unit}`;

/* 숫자로 읽을 수 있으면 그 값, 아니면 null. 쉼표와 % 는 허용한다. */
function parse(s: string): number | null {
  const t = s.replace(/[,%\s]/g, "");
  if (t === "" || !/^-?\d*\.?\d+$/.test(t)) return null;
  return Number(t);
}

export default function Quiz({ quiz }: { quiz: QuizData }) {
  const qs = quiz.questions;
  const [phase, setPhase] = useState<Phase>("home");
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [answers, setAnswers] = useState<number[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [shared, setShared] = useState<{ s: number; g: string } | null>(null);
  const [shareLabel, setShareLabel] = useState("친구에게 보내기");

  // 공유 링크로 들어온 경우 친구 점수를 보여 준다 (주소창은 브라우저에서만 읽을 수 있다)
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    const s = Number(p.get("s"));
    if (p.has("s") && Number.isFinite(s)) setShared({ s, g: p.get("g") ?? "" });
  }, []);

  useEffect(() => { window.scrollTo({ top: 0 }); }, [phase, idx]);

  const q = qs[idx];
  const mine = parse(input);
  const total = answers.length === qs.length
    ? Math.round(qs.reduce((a, x, i) => a + scoreOne(x, answers[i]), 0) / qs.length)
    : 0;

  function start() {
    setIdx(0); setInput(""); setAnswers([]); setRevealed(false);
    setPhase("quiz");
  }

  function submit() {
    if (revealed) return next();
    if (mine === null) return;
    const a = [...answers]; a[idx] = mine;
    setAnswers(a);
    setRevealed(true);
  }

  function next() {
    if (idx < qs.length - 1) {
      setIdx(idx + 1); setInput(""); setRevealed(false);
    } else {
      setPhase("result");
    }
  }

  async function share() {
    const g = gradeOf(total).name;
    const url = `${location.origin}${location.pathname}?s=${total}&g=${encodeURIComponent(g)}`;
    const text = `${quiz.title} ${total}점 · ${g}`;
    try {
      if (navigator.share) { await navigator.share({ title: quiz.title, text, url }); return; }
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setShareLabel("링크를 복사했습니다");
      setTimeout(() => setShareLabel("친구에게 보내기"), 1800);
    } catch { /* 사용자가 취소한 경우 */ }
  }

  /* ── 시작 ──────────────────────────────────────── */
  if (phase === "home") {
    return (
      <main id="app" className="view">
        {shared && (
          <p className="banner">
            친구의 점수 <b>{shared.s}점{shared.g && ` · ${shared.g}`}</b> — 당신은 몇 점일까요?
          </p>
        )}
        <div className="hero">
          <div className="badge">한국은행 공개 데이터</div>
          <h1>{quiz.title}</h1>
          <p className="muted">{quiz.subtitle}</p>
        </div>
        <div className="list-head">
          <span>숫자를 직접 입력해 맞혀요</span>
          <span className="muted">{qs.length}문항 · 1분</span>
        </div>
        <button className="primary" onClick={start}>시작하기</button>
        <p className="fineprint">
          모든 정답은 한국은행 ECOS의 DRAM 수출물가지수에서 직접 계산했습니다.
          정답 아래 <b>근거 보기</b>를 누르면 기준 날짜와 계산 방식이 나옵니다.
        </p>
      </main>
    );
  }

  /* ── 문항 ──────────────────────────────────────── */
  if (phase === "quiz") {
    const done = idx + (revealed ? 1 : 0);
    return (
      <main id="app" className="view" key={idx}>
        <button className="linkish" onClick={() => setPhase("home")}>← 처음으로</button>
        <div className="progress"><div style={{ width: `${(done / qs.length) * 100}%` }} /></div>
        <p className="muted small count">{idx + 1} / {qs.length}</p>
        <h2>{q.text}</h2>

        <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <div className="field">
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              autoFocus
              placeholder="숫자 입력"
              aria-label="내 답"
              value={input}
              disabled={revealed}
              onChange={(e) => setInput(e.target.value)}
            />
            <span className="unit">{q.unit}</span>
          </div>
          <p className="muted small hint">{q.hint}</p>

          {revealed && <AnswerCard q={q} mine={answers[idx]} />}

          <button type="submit" className="primary" disabled={!revealed && mine === null}>
            {!revealed ? "정답 확인" : idx === qs.length - 1 ? "결과 보기" : "다음"}
          </button>
        </form>
      </main>
    );
  }

  /* ── 결과 ──────────────────────────────────────── */
  const g = gradeOf(total);
  return (
    <main id="app" className="view">
      <div className="score-card">
        <div className="grade-emoji">{g.emoji}</div>
        <div className="score">{total}<span>점</span></div>
        <div className="grade">{g.name}</div>
      </div>

      <h3 className="section">내 답 vs 정답</h3>
      <table className="summary">
        <thead><tr><th>#</th><th>내 답</th><th>정답</th><th>점수</th></tr></thead>
        <tbody>
          {qs.map((x, i) => (
            <tr key={x.id}>
              <td>{i + 1}</td>
              <td>{fmt(answers[i], x.unit)}</td>
              <td><b>{fmt(x.answer, x.unit)}</b></td>
              <td>{scoreOne(x, answers[i])}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {qs.map((x, i) => (
        <div className="card" key={x.id}>
          <h3>{i + 1}. {x.text}</h3>
          <AnswerCard q={x} mine={answers[i]} bare />
        </div>
      ))}

      <div className="caveat"><b>이 데이터의 한계</b><br />{quiz.caveat}</div>
      <p className="fineprint">
        출처 <a href={quiz.source_url} target="_blank" rel="noopener noreferrer">{quiz.source}</a>
        <br />조회일 {quiz.retrieved}
      </p>

      <div className="actions">
        <button className="primary" onClick={share}>{shareLabel}</button>
        <button className="ghost" onClick={start}>다시 풀기</button>
      </div>
    </main>
  );
}

/* 정답 공개 — 내 답과 정답 막대, 해설, 근거 */
function AnswerCard({ q, mine, bare }: { q: Question; mine: number; bare?: boolean }) {
  const r = reaction(q, mine);
  const max = Math.max(Math.abs(mine), Math.abs(q.answer)) || 1;
  const [grow, setGrow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setGrow(true), 60); return () => clearTimeout(t); }, []);

  const rows: [string, number, string][] = [["내 답", mine, "mine"], ["정답", q.answer, "real"]];
  return (
    <div className={bare ? "" : "card reveal"}>
      <p className={`react ${r.cls}`}>{r.text}</p>
      <div className="rows">
        {rows.map(([k, v, cls]) => (
          <div className="row" key={k}>
            <span className="k">{k}</span>
            <span className={`bar ${cls}`}>
              <i style={{ width: grow ? `${(Math.abs(v) / max) * 100}%` : 0 }} />
            </span>
            <span className="v">{fmt(v, q.unit)}</span>
          </div>
        ))}
      </div>
      <p className="why">💡 {q.why}</p>
      <details>
        <summary>근거 보기</summary>
        <p className="basis">{q.basis}</p>
      </details>
    </div>
  );
}
