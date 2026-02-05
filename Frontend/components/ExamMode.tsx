import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Clock,
  Trophy,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  XCircle,
  Play,
  History,
  Flag,
  RotateCcw,
  Eye,
  FileText,
  BarChart3,
  Minus,
  Timer,
  ArrowLeft,
} from 'lucide-react';
import { examAPI } from '../services/api';
import type { ExamQuestion, ExamResultItem, ExamHistoryItem, ExamDetailExam } from '../services/api';

// ============================================
// TYPES
// ============================================
type Screen = 'setup' | 'loading' | 'exam' | 'results' | 'history-detail';
type Difficulty = 'easy' | 'medium' | 'hard';

// ============================================
// MAIN COMPONENT
// ============================================
const ExamMode: React.FC = () => {
  // Screen state
  const [screen, setScreen] = useState<Screen>('setup');

  // Setup state
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [duration, setDuration] = useState(30);

  // Exam state
  const [examId, setExamId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Results state
  const [results, setResults] = useState<ExamResultItem[]>([]);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // History state
  const [history, setHistory] = useState<ExamHistoryItem[]>([]);
  const [selectedExam, setSelectedExam] = useState<ExamDetailExam | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Loading screen state
  const [loadingStep, setLoadingStep] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);

  // Fetch history on mount
  useEffect(() => {
    fetchHistory();
  }, []);

  // Timer countdown
  useEffect(() => {
    if (screen === 'exam' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, [screen]);

  // Loading screen animations
  useEffect(() => {
    if (screen !== 'loading') {
      setLoadingStep(0);
      setTipIndex(0);
      return;
    }
    // Step through loading stages
    const stepTimer = setInterval(() => {
      setLoadingStep(prev => (prev < 3 ? prev + 1 : prev));
    }, 3000);
    // Cycle through tips
    const tipTimer = setInterval(() => {
      setTipIndex(prev => (prev + 1) % loadingTips.length);
    }, 4000);
    return () => { clearInterval(stepTimer); clearInterval(tipTimer); };
  }, [screen]);

  const handleAutoSubmit = useCallback(async () => {
    if (!examId) return;
    setIsSubmitting(true);
    const res = await examAPI.submitExam(examId, answers);
    if (res.success && res.results) {
      setResults(res.results);
      setScore(res.score ?? 0);
      setCorrectCount(res.correct_count ?? 0);
      setScreen('results');
    }
    setIsSubmitting(false);
  }, [examId, answers]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    const res = await examAPI.getHistory();
    if (res.success) setHistory(res.exams || []);
    setLoadingHistory(false);
  };

  // ============================================
  // ACTIONS
  // ============================================
  const startExam = async () => {
    setScreen('loading');
    const res = await examAPI.generateExam(difficulty, duration);
    if (res.success && res.questions && res.exam_id) {
      setExamId(res.exam_id);
      setQuestions(res.questions);
      setAnswers({});
      setCurrentQ(0);
      setTimeLeft(duration * 60);
      setScreen('exam');
    } else {
      alert(res.message || 'Failed to generate exam. Please try again.');
      setScreen('setup');
    }
  };

  const handleAnswer = (questionId: number, optionIdx: number) => {
    setAnswers(prev => ({ ...prev, [String(questionId)]: optionIdx }));
  };

  const finishExam = async () => {
    if (!examId) return;
    setShowConfirm(false);
    setIsSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const res = await examAPI.submitExam(examId, answers);
    if (res.success && res.results) {
      setResults(res.results);
      setScore(res.score ?? 0);
      setCorrectCount(res.correct_count ?? 0);
      setScreen('results');
      fetchHistory();
    } else {
      alert(res.message || 'Failed to submit exam.');
    }
    setIsSubmitting(false);
  };

  const viewExamDetail = async (id: number) => {
    setLoadingDetail(true);
    setScreen('history-detail');
    const res = await examAPI.getExamDetail(id);
    if (res.success && res.exam) {
      setSelectedExam(res.exam);
    }
    setLoadingDetail(false);
  };

  const resetToSetup = () => {
    setScreen('setup');
    setExamId(null);
    setQuestions([]);
    setAnswers({});
    setResults([]);
    setScore(0);
    setCorrectCount(0);
    setCurrentQ(0);
    setSelectedExam(null);
    if (timerRef.current) clearInterval(timerRef.current);
    fetchHistory();
  };

  // ============================================
  // HELPERS
  // ============================================
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const answeredCount = Object.values(answers).filter(a => a !== null && a !== undefined).length;

  const difficultyConfig = {
    easy: { label: 'Easy', questions: 10, color: 'from-emerald-500 to-green-500', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-300', desc: 'Basic concepts & recall' },
    medium: { label: 'Medium', questions: 15, color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300', desc: 'Applied & analytical' },
    hard: { label: 'Hard', questions: 20, color: 'from-red-500 to-rose-500', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-300', desc: 'Advanced & reasoning' },
  };

  const timerDurations = [15, 30, 45, 60];

  const loadingSteps = [
    'Analyzing curriculum modules',
    'Crafting questions for your level',
    'Reviewing difficulty balance',
    'Finalizing your exam',
  ];

  const loadingTips = [
    { title: 'Did you know?', text: 'RAG pipelines combine retrieval and generation to reduce LLM hallucinations by grounding responses in real data.' },
    { title: 'Quick Tip', text: 'Chain-of-thought prompting can improve LLM reasoning accuracy by up to 40% on complex tasks.' },
    { title: 'Fun Fact', text: 'The "Attention Is All You Need" paper that introduced Transformers has been cited over 100,000 times.' },
    { title: 'Did you know?', text: 'LoRA fine-tuning can adapt a large model by training less than 1% of its parameters.' },
    { title: 'Quick Tip', text: 'Vector databases use approximate nearest neighbor (ANN) search to find similar embeddings in milliseconds.' },
    { title: 'Fun Fact', text: 'GPT-3 has 175 billion parameters, while GPT-4 is estimated to use a mixture-of-experts architecture.' },
    { title: 'Did you know?', text: 'Temperature=0 makes an LLM fully deterministic, while Temperature>1 increases randomness and creativity.' },
    { title: 'Quick Tip', text: 'Chunking strategy matters: smaller chunks improve precision, larger chunks preserve more context.' },
  ];

  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-emerald-600';
    if (s >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBg = (s: number) => {
    if (s >= 80) return 'from-emerald-500 to-green-500';
    if (s >= 60) return 'from-amber-500 to-orange-500';
    return 'from-red-500 to-rose-500';
  };

  // ============================================
  // RENDER: SETUP SCREEN
  // ============================================
  const renderSetup = () => (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Difficulty Selection */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">Select Difficulty</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {(Object.keys(difficultyConfig) as Difficulty[]).map((d) => {
            const cfg = difficultyConfig[d];
            const isActive = difficulty === d;
            return (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`relative p-3 md:p-4 rounded-xl border-2 text-left transition-all ${
                  isActive
                    ? `${cfg.border} ${cfg.bg} shadow-md`
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <div className="mb-1.5">
                  <span className={`text-sm font-bold ${isActive ? cfg.text : 'text-slate-700'}`}>{cfg.label}</span>
                </div>
                <p className="text-[11px] text-slate-500">{cfg.desc}</p>
                <p className="text-[11px] font-medium text-slate-400 mt-1">{cfg.questions} questions</p>
                {isActive && (
                  <div className={`absolute top-2 right-2 w-5 h-5 rounded-full bg-gradient-to-br ${cfg.color} flex items-center justify-center`}>
                    <CheckCircle2 size={12} className="text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Timer Selection */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">Set Timer</h3>
        <div className="flex flex-wrap gap-2">
          {timerDurations.map((t) => (
            <button
              key={t}
              onClick={() => setDuration(t)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                duration === t
                  ? 'bg-[#00A0E3] text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Timer size={13} />
              {t} min
            </button>
          ))}
        </div>
      </div>

      {/* Summary & Start */}
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-4 border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <span className="flex items-center gap-1"><FileText size={13} /> {difficultyConfig[difficulty].questions} Questions</span>
            <span className="flex items-center gap-1"><Clock size={13} /> {duration} Minutes</span>
            <span className={`font-bold ${difficultyConfig[difficulty].text}`}>
              {difficultyConfig[difficulty].label}
            </span>
          </div>
          <button
            onClick={startExam}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#00A0E3] to-[#0060A9] text-white text-sm font-bold rounded-xl hover:shadow-lg transition-all hover:scale-[1.02] active:scale-95"
          >
            <Play size={16} />
            Start Exam
          </button>
        </div>
      </div>

      {/* Exam History */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <History size={13} /> Exam History
        </h3>
        {loadingHistory ? (
          <div className="flex items-center justify-center py-8 text-slate-400">
            <Loader2 size={18} className="animate-spin mr-2" /> Loading history...
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No exams taken yet. Start your first exam above!
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((exam) => {
              const cfg = difficultyConfig[exam.difficulty as Difficulty] || difficultyConfig.medium;
              return (
                <div
                  key={exam.id}
                  className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all group"
                >
                  <div>
                    <p className={`text-xs font-bold ${cfg.text}`}>{cfg.label} Exam</p>
                    <p className="text-[10px] text-slate-400">{formatDate(exam.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className={`text-sm font-black ${getScoreColor(exam.score)}`}>{exam.score}%</p>
                      <p className="text-[10px] text-slate-400">{exam.correct_count}/{exam.total_questions} correct</p>
                    </div>
                    <button
                      onClick={() => viewExamDetail(exam.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-[#00A0E3] hover:bg-blue-50 transition-colors"
                      title="View Details"
                    >
                      <Eye size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // ============================================
  // RENDER: LOADING SCREEN
  // ============================================
  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] animate-in fade-in duration-300 px-4">
      <h3 className="text-base font-bold text-slate-800 mb-1">Preparing Your Exam</h3>
      <p className="text-xs text-slate-500 mb-6">
        Generating {difficultyConfig[difficulty].questions} {difficultyConfig[difficulty].label.toLowerCase()} questions from the curriculum
      </p>

      {/* Step Progress */}
      <div className="w-full max-w-sm mb-8">
        <div className="space-y-2.5">
          {loadingSteps.map((step, idx) => {
            const isActive = idx === loadingStep;
            const isDone = idx < loadingStep;
            return (
              <div key={idx} className={`flex items-center gap-3 transition-all duration-500 ${isActive ? 'opacity-100' : isDone ? 'opacity-50' : 'opacity-30'}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold transition-all duration-500 ${
                  isDone ? 'bg-emerald-500 text-white' : isActive ? 'bg-[#00A0E3] text-white' : 'bg-slate-200 text-slate-400'
                }`}>
                  {isDone ? <CheckCircle2 size={12} /> : isActive ? <Loader2 size={12} className="animate-spin" /> : idx + 1}
                </div>
                <span className={`text-xs font-medium transition-colors duration-500 ${isActive ? 'text-slate-800' : isDone ? 'text-slate-500' : 'text-slate-400'}`}>
                  {step}
                </span>
              </div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="mt-4 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#00A0E3] to-[#0060A9] rounded-full transition-all duration-[3000ms] ease-linear"
            style={{ width: `${Math.min(((loadingStep + 1) / loadingSteps.length) * 100, 95)}%` }}
          />
        </div>
      </div>

      {/* Rotating Tips */}
      <div className="w-full max-w-md bg-slate-50 rounded-xl border border-slate-200 p-4 relative overflow-hidden min-h-[80px]">
        <div key={tipIndex} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <p className="text-[10px] font-bold text-[#00A0E3] uppercase tracking-wider mb-1">{loadingTips[tipIndex].title}</p>
          <p className="text-xs text-slate-600 leading-relaxed">{loadingTips[tipIndex].text}</p>
        </div>
      </div>
    </div>
  );

  // ============================================
  // RENDER: EXAM SCREEN
  // ============================================
  const renderExam = () => {
    const q = questions[currentQ];
    if (!q) return null;

    const isWarning = timeLeft <= 300 && timeLeft > 60;
    const isCritical = timeLeft <= 60;

    return (
      <div className="flex flex-col h-full animate-in fade-in duration-300">
        {/* Exam Header */}
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${
              isCritical ? 'bg-red-100 text-red-600 animate-pulse' :
              isWarning ? 'bg-amber-100 text-amber-600' :
              'bg-blue-50 text-[#00A0E3]'
            }`}>
              <Timer size={14} />
              {formatTime(timeLeft)}
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Q {currentQ + 1}/{questions.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 hidden sm:inline">{answeredCount}/{questions.length} answered</span>
            <button
              onClick={() => setShowConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors"
            >
              <Flag size={13} />
              <span className="hidden sm:inline">Finish</span>
            </button>
          </div>
        </div>

        {/* Question Navigation */}
        <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1 flex-shrink-0 scrollbar-hide">
          {questions.map((_, idx) => {
            const isAnswered = answers[String(questions[idx].id)] !== undefined && answers[String(questions[idx].id)] !== null;
            const isCurrent = idx === currentQ;
            return (
              <button
                key={idx}
                onClick={() => setCurrentQ(idx)}
                className={`w-7 h-7 rounded-lg text-[10px] font-bold flex-shrink-0 transition-all ${
                  isCurrent
                    ? 'bg-[#00A0E3] text-white shadow-md'
                    : isAnswered
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Question Card */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-y-auto p-4 md:p-5">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{q.topic}</span>
          <h4 className="text-sm md:text-base font-bold text-slate-800 mt-1.5 mb-4 leading-relaxed">
            Q{currentQ + 1}. {q.question}
          </h4>

          <div className="space-y-2.5">
            {q.options.map((opt, idx) => {
              const isSelected = answers[String(q.id)] === idx;
              const optLabel = String.fromCharCode(65 + idx);
              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(q.id, idx)}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                    isSelected
                      ? 'border-[#00A0E3] bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${
                    isSelected
                      ? 'bg-[#00A0E3] text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {optLabel}
                  </div>
                  <span className={`text-xs md:text-sm ${isSelected ? 'text-[#00A0E3] font-medium' : 'text-slate-600'}`}>
                    {opt}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-3 pb-14 md:pb-4 flex-shrink-0">
          <button
            onClick={() => setCurrentQ(prev => Math.max(0, prev - 1))}
            disabled={currentQ === 0}
            className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={14} /> Previous
          </button>
          <span className="text-[10px] text-slate-400">{answeredCount} of {questions.length} answered</span>
          <button
            onClick={() => setCurrentQ(prev => Math.min(questions.length - 1, prev + 1))}
            disabled={currentQ === questions.length - 1}
            className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-white bg-[#00A0E3] rounded-lg hover:bg-[#0080C0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>

        {/* Confirm Dialog */}
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-5 max-w-sm mx-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={18} className="text-amber-500" />
                <h4 className="text-sm font-bold text-slate-800">Finish Exam?</h4>
              </div>
              <p className="text-xs text-slate-500 mb-1">
                You have answered <strong>{answeredCount}</strong> of <strong>{questions.length}</strong> questions.
              </p>
              {answeredCount < questions.length && (
                <p className="text-xs text-amber-600 mb-3">
                  {questions.length - answeredCount} question(s) are unanswered and will be marked wrong.
                </p>
              )}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 px-3 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Continue Exam
                </button>
                <button
                  onClick={finishExam}
                  disabled={isSubmitting}
                  className="flex-1 px-3 py-2 text-xs font-bold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-60"
                >
                  {isSubmitting ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Submit Exam'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ============================================
  // RENDER: RESULTS SCREEN
  // ============================================
  const renderResults = () => {
    const unanswered = results.filter(r => r.student_answer === null || r.student_answer === undefined).length;
    const incorrect = results.length - correctCount - unanswered;

    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Score Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 text-center">
          <Trophy size={28} className="mx-auto mb-2 text-amber-500" />
          <h3 className="text-base font-bold text-slate-800 mb-3">Exam Complete!</h3>
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br ${getScoreBg(score)} shadow-lg mb-3`}>
            <span className="text-2xl font-black text-white">{score}%</span>
          </div>
          <div className="flex items-center justify-center gap-4 text-xs mt-2">
            <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 size={13} /> {correctCount} Correct</span>
            <span className="flex items-center gap-1 text-red-500"><XCircle size={13} /> {incorrect} Wrong</span>
            {unanswered > 0 && <span className="flex items-center gap-1 text-slate-400"><Minus size={13} /> {unanswered} Skipped</span>}
          </div>
          <p className="text-[10px] text-slate-400 mt-2">{results.length} questions | {difficultyConfig[difficulty].label} | {duration} min</p>
        </div>

        {/* Question Review */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <BarChart3 size={13} /> Question Review
          </h3>
          <div className="space-y-2.5">
            {results.map((r, idx) => (
              <ResultCard key={idx} result={r} index={idx} />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={resetToSetup}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Setup
          </button>
          <button
            onClick={() => { resetToSetup(); setTimeout(startExam, 100); }}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-[#00A0E3] to-[#0060A9] rounded-xl hover:shadow-lg transition-all"
          >
            <RotateCcw size={14} /> Take New Exam
          </button>
        </div>
      </div>
    );
  };

  // ============================================
  // RENDER: HISTORY DETAIL SCREEN
  // ============================================
  const renderHistoryDetail = () => {
    if (loadingDetail || !selectedExam) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
          <Loader2 size={24} className="animate-spin text-[#00A0E3] mb-2" />
          <p className="text-xs text-slate-500">Loading exam details...</p>
        </div>
      );
    }

    const cfg = difficultyConfig[selectedExam.difficulty as Difficulty] || difficultyConfig.medium;
    const examResults = selectedExam.results || [];
    const unanswered = examResults.filter(r => r.student_answer === null || r.student_answer === undefined).length;
    const incorrect = selectedExam.total_questions - selectedExam.correct_count - unanswered;

    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Back Button */}
        <button
          onClick={resetToSetup}
          className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-[#00A0E3] transition-colors"
        >
          <ArrowLeft size={14} /> Back to Exam Mode
        </button>

        {/* Exam Summary */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className={`text-sm font-bold ${cfg.text}`}>{cfg.label} Exam</p>
              <p className="text-[10px] text-slate-400">{formatDate(selectedExam.created_at)}</p>
            </div>
            <div className={`text-xl font-black ${getScoreColor(selectedExam.score)}`}>
              {selectedExam.score}%
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 size={13} /> {selectedExam.correct_count} Correct</span>
            <span className="flex items-center gap-1 text-red-500"><XCircle size={13} /> {incorrect} Wrong</span>
            {unanswered > 0 && <span className="flex items-center gap-1 text-slate-400"><Minus size={13} /> {unanswered} Skipped</span>}
            <span className="flex items-center gap-1 text-slate-400"><Clock size={13} /> {selectedExam.duration_minutes} min</span>
          </div>
        </div>

        {/* Questions with Solutions */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <FileText size={13} /> Question Paper with Solutions
          </h3>
          <div className="space-y-2.5">
            {examResults.map((r, idx) => (
              <ResultCard key={idx} result={r} index={idx} />
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      {screen !== 'exam' && (
        <div className="flex-shrink-0 mb-3 md:mb-4">
          <h2 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">
            Exam Mode
          </h2>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
            Test your knowledge with AI-generated questions from the curriculum
          </p>
        </div>
      )}

      {/* Content */}
      <div className={`flex-1 ${screen === 'exam' ? '' : 'bg-white rounded-2xl md:rounded-3xl shadow-lg border border-slate-200 overflow-y-auto p-3 md:p-5'} min-h-0`}>
        {screen === 'setup' && renderSetup()}
        {screen === 'loading' && renderLoading()}
        {screen === 'exam' && renderExam()}
        {screen === 'results' && renderResults()}
        {screen === 'history-detail' && renderHistoryDetail()}
      </div>
    </div>
  );
};

// ============================================
// RESULT CARD COMPONENT
// ============================================
const ResultCard: React.FC<{ result: ExamResultItem; index: number }> = ({ result, index }) => {
  const [expanded, setExpanded] = useState(false);
  const studentLabel = result.student_answer !== null && result.student_answer !== undefined
    ? String.fromCharCode(65 + result.student_answer) : '—';
  const correctLabel = String.fromCharCode(65 + result.correct_answer);

  return (
    <div className={`rounded-xl border overflow-hidden transition-all ${
      result.is_correct ? 'border-emerald-200 bg-emerald-50/50' :
      result.student_answer === null || result.student_answer === undefined ? 'border-slate-200 bg-slate-50/50' :
      'border-red-200 bg-red-50/50'
    }`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-2.5 p-3 text-left"
      >
        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
          result.is_correct ? 'bg-emerald-500' :
          result.student_answer === null || result.student_answer === undefined ? 'bg-slate-300' :
          'bg-red-500'
        }`}>
          {result.is_correct ? <CheckCircle2 size={12} className="text-white" /> :
           result.student_answer === null || result.student_answer === undefined ? <Minus size={12} className="text-white" /> :
           <XCircle size={12} className="text-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-700 leading-relaxed">Q{index + 1}. {result.question}</p>
          <div className="flex items-center gap-3 mt-1 text-[10px]">
            <span className={result.is_correct ? 'text-emerald-600 font-medium' : 'text-red-500 font-medium'}>
              Your: {studentLabel}
            </span>
            {!result.is_correct && (
              <span className="text-emerald-600 font-medium">Correct: {correctLabel}</span>
            )}
            <span className="text-slate-400">{result.topic}</span>
          </div>
        </div>
        <ChevronRight size={14} className={`text-slate-400 flex-shrink-0 mt-1 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {expanded && (
        <div className="px-3 pb-3 pt-0 border-t border-slate-200/50">
          {/* Options */}
          <div className="space-y-1 mt-2 mb-2.5">
            {result.options.map((opt, idx) => {
              const isCorrect = idx === result.correct_answer;
              const isStudent = idx === result.student_answer;
              const optLabel = String.fromCharCode(65 + idx);
              return (
                <div
                  key={idx}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs ${
                    isCorrect ? 'bg-emerald-100 text-emerald-800 font-medium' :
                    isStudent && !result.is_correct ? 'bg-red-100 text-red-700' :
                    'text-slate-600'
                  }`}
                >
                  <span className="font-bold text-[10px] w-4">{optLabel}.</span>
                  {opt}
                  {isCorrect && <CheckCircle2 size={12} className="ml-auto text-emerald-600 flex-shrink-0" />}
                  {isStudent && !isCorrect && <XCircle size={12} className="ml-auto text-red-500 flex-shrink-0" />}
                </div>
              );
            })}
          </div>
          {/* Explanation */}
          {result.explanation && (
            <div className="bg-blue-50 rounded-lg p-2.5 border border-blue-100">
              <p className="text-[10px] font-bold text-blue-700 mb-0.5">Explanation</p>
              <p className="text-[11px] text-blue-800 leading-relaxed">{result.explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExamMode;
