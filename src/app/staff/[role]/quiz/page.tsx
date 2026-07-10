"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, XCircle, Trophy, RotateCcw } from "lucide-react";
import { QUIZ_QUESTIONS, ROLE_CONFIGS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { StaffRole, QuizQuestion } from "@/types";

type QuizState = "intro" | "playing" | "result";

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const roleId = params.role as StaffRole;

  const [state, setState] = useState<QuizState>("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Array<{ selected: string | boolean; correct: boolean }>>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastSelected, setLastSelected] = useState<string | boolean | null>(null);
  const [score, setScore] = useState(0);

  const roleConfig = ROLE_CONFIGS.find((r) => r.id === roleId);
  const questions = QUIZ_QUESTIONS[roleId] || [];

  useEffect(() => {
    if (!roleConfig) router.push("/staff");
  }, [roleConfig, router]);

  const handleAnswer = (selected: string | boolean) => {
    if (showFeedback) return;
    const q = questions[currentQ];
    const correct = selected === q.answer;
    setLastSelected(selected);
    setShowFeedback(true);
    setAnswers((prev) => [...prev, { selected, correct }]);
    if (correct) setScore((s) => s + 1);
  };

  const handleNext = async () => {
    setShowFeedback(false);
    setLastSelected(null);

    if (currentQ + 1 >= questions.length) {
      // Save result to Supabase
      try {
        const supabase = createClient();
        const finalScore = score + (answers[answers.length - 1]?.correct ? 0 : 0);
        await supabase.from("quiz_results").insert({
          role: roleId,
          score: finalScore,
          total: questions.length,
          answers: answers,
        });
      } catch {}
      // Update localStorage
      const saved = localStorage.getItem("pv2026_progress") || "{}";
      const data = JSON.parse(saved);
      data[roleId] = { ...data[roleId], learned: true, quizPassed: score >= 5 };
      localStorage.setItem("pv2026_progress", JSON.stringify(data));

      setState("result");
    } else {
      setCurrentQ((q) => q + 1);
    }
  };

  const handleRestart = () => {
    setState("intro");
    setCurrentQ(0);
    setAnswers([]);
    setScore(0);
    setShowFeedback(false);
    setLastSelected(null);
  };

  if (!roleConfig) return null;

  const q = questions[currentQ];
  const progress = ((currentQ) / questions.length) * 100;
  const isPassed = score >= 5;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0B1628]/95 backdrop-blur border-b border-white/5 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href={`/staff/${roleId}`} className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-white" />
          </Link>
          <div>
            <h1 className="font-bold text-white text-sm">{roleConfig.label} — 돌발상황 퀴즈</h1>
            {state === "playing" && (
              <p className="text-xs text-slate-500">{currentQ + 1} / {questions.length} 문항</p>
            )}
          </div>
        </div>

        {state === "playing" && (
          <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </header>

      <main className="flex-1 p-4">
        {state === "intro" && (
          <IntroScreen
            roleConfig={roleConfig}
            questionCount={questions.length}
            onStart={() => setState("playing")}
          />
        )}

        {state === "playing" && q && (
          <QuizScreen
            question={q}
            questionNumber={currentQ + 1}
            total={questions.length}
            showFeedback={showFeedback}
            lastSelected={lastSelected}
            onAnswer={handleAnswer}
            onNext={handleNext}
          />
        )}

        {state === "result" && (
          <ResultScreen
            score={score}
            total={questions.length}
            isPassed={isPassed}
            answers={answers}
            questions={questions}
            roleConfig={roleConfig}
            onRestart={handleRestart}
          />
        )}
      </main>
    </div>
  );
}

function IntroScreen({ roleConfig, questionCount, onStart }: {
  roleConfig: typeof ROLE_CONFIGS[0];
  questionCount: number;
  onStart: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
      <div className="text-6xl">{roleConfig.icon}</div>
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">{roleConfig.label}</h2>
        <h3 className="text-lg text-amber-400 font-semibold">돌발상황 대응 퀴즈</h3>
      </div>

      <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
        {[
          { label: "문항 수", value: `${questionCount}문항` },
          { label: "유형", value: "O/X·선택" },
          { label: "합격 기준", value: "5점 이상" },
        ].map((item) => (
          <div key={item.label} className="bg-white/5 border border-white/10 rounded-xl p-3">
            <p className="text-amber-400 font-bold text-sm">{item.value}</p>
            <p className="text-slate-500 text-xs mt-1">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-amber-400/10 border border-amber-400/20 rounded-2xl p-4 text-sm text-amber-300 text-left">
        <p className="font-medium mb-2">📋 퀴즈 안내</p>
        <ul className="space-y-1 text-xs text-slate-400">
          <li>· 실제 행사 현장 상황 기반 문항</li>
          <li>· 답 선택 후 즉시 피드백 제공</li>
          <li>· 점수는 시스템에 자동 저장</li>
          <li>· 5점 미만 시 재응시 가능</li>
        </ul>
      </div>

      <button
        onClick={onStart}
        className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-400 text-[#0B1628] rounded-2xl font-bold text-base"
      >
        퀴즈 시작 🚀
      </button>
    </div>
  );
}

function QuizScreen({ question, questionNumber, total, showFeedback, lastSelected, onAnswer, onNext }: {
  question: QuizQuestion;
  questionNumber: number;
  total: number;
  showFeedback: boolean;
  lastSelected: string | boolean | null;
  onAnswer: (v: string | boolean) => void;
  onNext: () => void;
}) {
  const isCorrect = lastSelected === question.answer;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Question number badge */}
      <div className="flex items-center gap-2">
        <span className="bg-amber-400/20 text-amber-400 text-xs font-bold px-3 py-1 rounded-full border border-amber-400/30">
          Q{questionNumber}
        </span>
        <span className="text-slate-500 text-xs">{total - questionNumber}문항 남음</span>
      </div>

      {/* Scenario */}
      {question.scenario && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <p className="text-xs text-slate-500 mb-1">📍 상황</p>
          <p className="text-slate-300 text-sm leading-relaxed">{question.scenario}</p>
        </div>
      )}

      {/* Question */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <p className="text-white font-medium text-base leading-relaxed">{question.question}</p>
      </div>

      {/* Answer options */}
      {question.type === "ox" ? (
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: true, label: "O", sub: "맞다", color: "green" },
            { value: false, label: "X", sub: "틀리다", color: "red" },
          ].map(({ value, label, sub, color }) => {
            let btnClass = "bg-white/5 border border-white/10 text-white";
            if (showFeedback && lastSelected === value) {
              btnClass = isCorrect
                ? "bg-green-500/20 border-green-500 text-green-300"
                : "bg-red-500/20 border-red-500 text-red-300";
            } else if (showFeedback && value === question.answer) {
              btnClass = "bg-green-500/20 border-green-500 text-green-300";
            }

            return (
              <button
                key={String(value)}
                onClick={() => onAnswer(value)}
                disabled={showFeedback}
                className={`rounded-2xl p-6 font-bold text-4xl transition-all border-2 ${btnClass}`}
              >
                {label}
                <div className="text-sm font-normal mt-1">{sub}</div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {question.options?.map((opt: string, i: number) => {
            let btnClass = "bg-white/5 border border-white/10 text-slate-300";
            if (showFeedback && lastSelected === opt) {
              btnClass = opt === question.answer
                ? "bg-green-500/20 border-green-500 text-green-300"
                : "bg-red-500/20 border-red-500 text-red-300";
            } else if (showFeedback && opt === question.answer) {
              btnClass = "bg-green-500/20 border-green-500 text-green-300";
            }

            return (
              <button
                key={i}
                onClick={() => onAnswer(opt)}
                disabled={showFeedback}
                className={`w-full rounded-xl px-4 py-3.5 text-left text-sm font-medium transition-all border ${btnClass}`}
              >
                <span className="text-slate-500 mr-2">{String.fromCharCode(65 + i)}.</span>
                {opt}
              </button>
            );
          })}
        </div>
      )}

      {/* Feedback */}
      {showFeedback && (
        <div className={`rounded-2xl p-4 border animate-slide-up ${
          isCorrect
            ? "bg-green-500/10 border-green-500/30"
            : "bg-red-500/10 border-red-500/30"
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {isCorrect ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400" />
            )}
            <span className={`font-bold text-sm ${isCorrect ? "text-green-400" : "text-red-400"}`}>
              {isCorrect ? "정답입니다!" : "오답입니다"}
            </span>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">{question.explanation}</p>
        </div>
      )}

      {/* Next button */}
      {showFeedback && (
        <button
          onClick={onNext}
          className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-400 text-[#0B1628] rounded-2xl font-bold text-base"
        >
          다음 문항 →
        </button>
      )}
    </div>
  );
}

function ResultScreen({ score, total, isPassed, answers, questions, roleConfig, onRestart }: {
  score: number;
  total: number;
  isPassed: boolean;
  answers: Array<{ selected: string | boolean; correct: boolean }>;
  questions: QuizQuestion[];
  roleConfig: typeof ROLE_CONFIGS[0];
  onRestart: () => void;
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Result card */}
      <div className={`rounded-3xl p-8 text-center border-2 ${
        isPassed
          ? "bg-gradient-to-b from-amber-500/10 to-amber-400/5 border-amber-400/40"
          : "bg-gradient-to-b from-red-500/10 to-red-400/5 border-red-400/30"
      }`}>
        {isPassed ? (
          <>
            <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-1">수료 완료!</h2>
            <p className="text-amber-400 text-sm mb-4">{roleConfig.label} 교육 이수 인정</p>
          </>
        ) : (
          <>
            <div className="text-5xl mb-4">😔</div>
            <h2 className="text-2xl font-bold text-white mb-1">아쉽습니다</h2>
            <p className="text-red-400 text-sm mb-4">5점 이상이어야 합격입니다</p>
          </>
        )}

        <div className="text-6xl font-black text-white mb-2">
          {score}<span className="text-2xl text-slate-400">/{total}</span>
        </div>
        <p className="text-slate-400 text-sm">
          정답률 {Math.round((score / total) * 100)}%
        </p>
      </div>

      {/* Answer review */}
      <div>
        <p className="text-sm font-medium text-slate-400 mb-3">📋 문항별 결과</p>
        <div className="space-y-2">
          {answers.map((ans, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${
              ans.correct
                ? "bg-green-500/5 border-green-500/20"
                : "bg-red-500/5 border-red-500/20"
            }`}>
              {ans.correct ? (
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              )}
              <p className="text-slate-300 text-xs flex-1 line-clamp-1">
                Q{i + 1}. {questions[i]?.question}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onRestart}
          className="flex items-center justify-center gap-2 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-slate-300 text-sm font-medium"
        >
          <RotateCcw className="w-4 h-4" />
          다시 풀기
        </button>
        <Link href="/staff" className="flex items-center justify-center gap-2 py-3.5 bg-amber-400/20 border border-amber-400/30 rounded-2xl text-amber-400 text-sm font-bold">
          홈으로 →
        </Link>
      </div>
    </div>
  );
}
