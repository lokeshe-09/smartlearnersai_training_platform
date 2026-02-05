import React, { useState, useEffect } from 'react';
import {
  Clock,
  HelpCircle,
  Target,
  Lock,
  ArrowRight,
  X,
  FileQuestion,
  CheckCircle,
  XCircle,
  Loader2,
  RotateCcw
} from 'lucide-react';
import { assessmentAPI } from '../services/api';

// ============================================
// ASSESSMENT DATA
// ============================================
interface Assessment {
  id: number;
  title: string;
  topic: string;
  questions: number;
  duration: string;
  passingScore: number;
  color: string;
}

interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: number;
}

const ASSESSMENTS: Assessment[] = [
  {
    id: 1,
    title: "Foundations & Prompting",
    topic: "Week 1-2 Curriculum",
    questions: 7,
    duration: "25 Min",
    passingScore: 80,
    color: "from-indigo-500 to-purple-500",
  },
  {
    id: 2,
    title: "Advanced Systems",
    topic: "Week 3-4 Curriculum",
    questions: 7,
    duration: "30 Min",
    passingScore: 75,
    color: "from-teal-400 to-emerald-500",
  },
  {
    id: 3,
    title: "Production Mastery",
    topic: "Week 5 Curriculum",
    questions: 6,
    duration: "20 Min",
    passingScore: 80,
    color: "from-cyan-500 to-blue-600",
  }
];

const ASSESSMENT_QUESTIONS: Record<number, Question[]> = {
  1: [
    { id: 1, text: "Which component of the Transformer architecture allows the model to focus on different parts of the input sequence?", options: ["Self-Attention Mechanism", "Feed-Forward Network", "Positional Encoding", "Layer Normalization"], correctAnswer: 0 },
    { id: 2, text: "What is a 'Token' in the context of Large Language Models?", options: ["A cryptocurrency used to pay for API calls", "The smallest unit of text processed by the model", "A security key for authentication", "A specific type of Python variable"], correctAnswer: 1 },
    { id: 3, text: "Which is a key difference between Predictive AI and Generative AI?", options: ["Predictive AI uses more data", "Generative AI creates new content, Predictive AI forecasts outcomes", "Predictive AI is always faster", "Generative AI cannot handle text"], correctAnswer: 1 },
    { id: 4, text: "What is 'Zero-Shot' prompting?", options: ["Providing no examples to the model", "Providing many examples", "Training the model from scratch", "Using a model with 0 parameters"], correctAnswer: 0 },
    { id: 5, text: "Which technique involves asking the model to 'think step-by-step'?", options: ["Tree of Thoughts", "Chain of Thought (CoT)", "ReAct", "RAG"], correctAnswer: 1 },
    { id: 6, text: "How can you mitigate 'Hallucinations' in LLMs?", options: ["Increase temperature", "Use generic prompts", "Ground the model with external data (RAG)", "Reduce the model size"], correctAnswer: 2 },
    { id: 7, text: "What defines 'Few-Shot' prompting?", options: ["Using small models", "Providing a set of input-output examples in the context", "Running a prompt only a few times", "Low latency inference"], correctAnswer: 1 }
  ],
  2: [
    { id: 1, text: "What is the primary role of a Vector Database in RAG?", options: ["To store user passwords", "To store high-dimensional embeddings for similarity search", "To cache HTML pages", "To run Python scripts"], correctAnswer: 1 },
    { id: 2, text: "What are 'Embeddings'?", options: ["HTML tags", "Vector representations of semantic meaning", "Attached files in an email", "Plugins for the LLM"], correctAnswer: 1 },
    { id: 3, text: "Which metric is commonly used to measure distance between vectors?", options: ["Euclidean Distance", "Cosine Similarity", "Manhattan Distance", "All of the above"], correctAnswer: 3 },
    { id: 4, text: "What does the 'ReAct' framework stand for?", options: ["Read + Act", "Reason + Act", "Repeat + Act", "React + Adapt"], correctAnswer: 1 },
    { id: 5, text: "What enables an LLM to interact with external APIs?", options: ["Function Calling / Tool Use", "Stronger GPU", "More training data", "Temperature settings"], correctAnswer: 0 },
    { id: 6, text: "In an agentic workflow, what is the 'Planner'?", options: ["The project manager", "The component that breaks down goals into tasks", "The calendar API", "The database"], correctAnswer: 1 },
    { id: 7, text: "What is 'Chunking' regarding data ingestion?", options: ["Splitting text into manageable segments for embedding", "Deleting large files", "Compressing images", "Merging databases"], correctAnswer: 0 }
  ],
  3: [
    { id: 1, text: "Which factor is critical when deploying LLMs to production?", options: ["Latency", "Cost", "Safety/Guardrails", "All of the above"], correctAnswer: 3 },
    { id: 2, text: "What is 'Quantization' used for?", options: ["Increasing model size", "Reducing model precision to lower memory usage", "Measuring quantum fluctuations", "Counting tokens"], correctAnswer: 1 },
    { id: 3, text: "How do you protect against Prompt Injection attacks?", options: ["Trust the user", "Input validation and separation of instruction/data", "Use a smaller model", "Disable the API"], correctAnswer: 1 },
    { id: 4, text: "What is A/B testing in the context of LLMs?", options: ["Testing two different prompts/models to compare performance", "Testing the alphabet", "Checking for bugs", "Backtesting"], correctAnswer: 0 },
    { id: 5, text: "What does 'Responsible AI' prioritize?", options: ["Speed at all costs", "Fairness, Accountability, and Transparency", "Maximum profit", "Replacing humans"], correctAnswer: 1 },
    { id: 6, text: "What is 'Fine-tuning'?", options: ["Adjusting volume", "Retraining a model on a specific dataset to improve performance on specific tasks", "Cleaning data", "Buying a better computer"], correctAnswer: 1 }
  ]
};

// ============================================
// COMPONENT TYPES
// ============================================
interface AssessmentProgress {
  status: 'Locked' | 'Unlocked' | 'Completed';
  score: number | null;
  passed: boolean;
}

// ============================================
// MAIN COMPONENT
// ============================================
const Assessments: React.FC = () => {
  // State
  const [assessmentProgress, setAssessmentProgress] = useState<Record<number, AssessmentProgress>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [averageScore, setAverageScore] = useState(0);

  // Quiz state
  const [activeQuizId, setActiveQuizId] = useState<number | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // Fetch saved results on mount
  useEffect(() => {
    const loadSavedResults = async () => {
      setIsLoading(true);
      try {
        const response = await assessmentAPI.getAssessmentResults();

        if (response.success && response.results.length > 0) {
          const progressMap: Record<number, AssessmentProgress> = {};

          response.results.forEach(result => {
            progressMap[result.assessment_id] = {
              status: 'Completed',
              score: result.score,
              passed: result.passed
            };
          });

          setAssessmentProgress(progressMap);

          // Calculate average score
          const scores = response.results.map(r => r.score);
          const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
          setAverageScore(avg);
        }
      } catch (error) {
        console.error('Error loading assessment results:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedResults();
  }, []);

  // Get effective status considering unlock logic
  const getEffectiveStatus = (id: number): AssessmentProgress => {
    const saved = assessmentProgress[id];
    if (saved?.status === 'Completed') return saved;

    // Module 1 is always unlocked
    if (id === 1) return { status: 'Unlocked', score: null, passed: false };

    // Check if previous module is completed
    const prevStatus = assessmentProgress[id - 1];
    if (prevStatus?.status === 'Completed') {
      return { status: 'Unlocked', score: null, passed: false };
    }

    return { status: 'Locked', score: null, passed: false };
  };

  // Start quiz
  const startQuiz = (assessmentId: number) => {
    setActiveQuizId(assessmentId);
    setCurrentQuestionIdx(0);
    setQuizAnswers({});
    setQuizCompleted(false);
    setQuizScore(0);
  };

  // Handle answer selection
  const handleQuizAnswer = (questionId: number, optionIdx: number) => {
    setQuizAnswers(prev => ({ ...prev, [questionId]: optionIdx }));
  };

  // Go to next question
  const nextQuestion = () => {
    if (activeQuizId) {
      const questions = ASSESSMENT_QUESTIONS[activeQuizId];
      if (currentQuestionIdx < questions.length - 1) {
        setCurrentQuestionIdx(prev => prev + 1);
      }
    }
  };

  // Submit quiz
  const submitQuiz = async () => {
    if (!activeQuizId) return;

    const questions = ASSESSMENT_QUESTIONS[activeQuizId];
    const assessment = ASSESSMENTS.find(a => a.id === activeQuizId);
    if (!assessment) return;

    // Calculate score
    let correct = 0;
    questions.forEach(q => {
      if (quizAnswers[q.id] === q.correctAnswer) correct++;
    });

    const scorePercent = Math.round((correct / questions.length) * 100);
    const passed = scorePercent >= assessment.passingScore;

    setQuizScore(scorePercent);
    setQuizCompleted(true);

    // Update local state
    const newProgress: AssessmentProgress = {
      status: 'Completed',
      score: scorePercent,
      passed
    };

    setAssessmentProgress(prev => ({
      ...prev,
      [activeQuizId]: newProgress
    }));

    // Recalculate average score
    const allScores = Object.values({ ...assessmentProgress, [activeQuizId]: newProgress })
      .filter(p => p.status === 'Completed' && p.score !== null)
      .map(p => p.score as number);

    if (allScores.length > 0) {
      setAverageScore(Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length));
    }

    // Save to backend
    try {
      await assessmentAPI.submitAssessment({
        assessment_id: activeQuizId,
        assessment_title: assessment.title,
        score: scorePercent,
        total_questions: questions.length,
        correct_answers: correct,
        passing_score: assessment.passingScore
      });
    } catch (error) {
      console.error('Error saving assessment result:', error);
    }
  };

  // Close quiz
  const closeQuiz = () => {
    setActiveQuizId(null);
    setCurrentQuestionIdx(0);
    setQuizAnswers({});
    setQuizCompleted(false);
    setQuizScore(0);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 h-full overflow-y-auto pb-10">
      {/* Quiz Modal */}
      {activeQuizId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-2xl mx-3 relative">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="bg-slate-50 border-b border-slate-100 p-4 md:p-5 flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-blue-100 text-[#00A0E3] rounded-lg">
                    <FileQuestion size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-xs md:text-sm">
                      {ASSESSMENTS.find(a => a.id === activeQuizId)?.title}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      Question {currentQuestionIdx + 1} of {ASSESSMENT_QUESTIONS[activeQuizId].length}
                    </p>
                  </div>
                </div>
                {!quizCompleted && (
                  <button
                    onClick={closeQuiz}
                    className="p-1.5 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              {/* Progress Bar */}
              <div className="h-1 bg-slate-100 relative">
                <div
                  className="h-full bg-gradient-to-r from-[#00A0E3] to-blue-600 transition-all duration-500"
                  style={{ width: `${((currentQuestionIdx + 1) / ASSESSMENT_QUESTIONS[activeQuizId].length) * 100}%` }}
                />
              </div>

              {/* Content */}
              <div className="p-5 md:p-6 flex-1 overflow-y-auto">
                {!quizCompleted ? (
                  <>
                    <h4 className="text-sm md:text-base font-bold text-slate-800 mb-4 leading-relaxed">
                      {ASSESSMENT_QUESTIONS[activeQuizId][currentQuestionIdx].text}
                    </h4>
                    <div className="space-y-2.5">
                      {ASSESSMENT_QUESTIONS[activeQuizId][currentQuestionIdx].options.map((option, idx) => {
                        const isSelected = quizAnswers[ASSESSMENT_QUESTIONS[activeQuizId][currentQuestionIdx].id] === idx;
                        return (
                          <button
                            key={idx}
                            onClick={() => handleQuizAnswer(ASSESSMENT_QUESTIONS[activeQuizId][currentQuestionIdx].id, idx)}
                            className={`w-full text-left p-3 rounded-xl border-2 transition-all duration-200 ${
                              isSelected
                                ? 'border-[#00A0E3] bg-blue-50 text-slate-800'
                                : 'border-slate-200 hover:border-slate-300 text-slate-600'
                            }`}
                          >
                            <span className="text-xs md:text-sm font-medium">{option}</span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
                      quizScore >= (ASSESSMENTS.find(a => a.id === activeQuizId)?.passingScore || 80)
                        ? 'bg-green-100'
                        : 'bg-red-100'
                    }`}>
                      {quizScore >= (ASSESSMENTS.find(a => a.id === activeQuizId)?.passingScore || 80) ? (
                        <CheckCircle size={32} className="text-green-600" />
                      ) : (
                        <XCircle size={32} className="text-red-600" />
                      )}
                    </div>
                    <h3 className="text-lg md:text-xl font-black text-slate-800 mb-1.5">
                      {quizScore >= (ASSESSMENTS.find(a => a.id === activeQuizId)?.passingScore || 80)
                        ? 'Congratulations!'
                        : 'Keep Learning!'}
                    </h3>
                    <p className="text-xs md:text-sm text-slate-500 mb-4">
                      You scored <span className="font-bold text-slate-800">{quizScore}%</span>
                      {quizScore >= (ASSESSMENTS.find(a => a.id === activeQuizId)?.passingScore || 80)
                        ? ' - You passed!'
                        : ` - You need ${ASSESSMENTS.find(a => a.id === activeQuizId)?.passingScore}% to pass`}
                    </p>
                    <div className="flex gap-2.5 justify-center mt-5">
                      <button
                        onClick={() => startQuiz(activeQuizId)}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00A0E3] to-[#0060A9] text-white font-bold text-xs hover:shadow-lg transition-all flex items-center gap-1.5"
                      >
                        <RotateCcw size={14} /> Retake
                      </button>
                      <button
                        onClick={closeQuiz}
                        className="px-4 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-black transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              {!quizCompleted && (
                <div className="bg-slate-50 border-t border-slate-100 p-3 md:p-4 flex justify-end gap-2.5">
                  {currentQuestionIdx === ASSESSMENT_QUESTIONS[activeQuizId].length - 1 ? (
                    <button
                      onClick={submitQuiz}
                      disabled={quizAnswers[ASSESSMENT_QUESTIONS[activeQuizId][currentQuestionIdx].id] === undefined}
                      className="px-4 py-2.5 rounded-xl bg-green-600 text-white font-bold text-xs hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Submit Assessment
                    </button>
                  ) : (
                    <button
                      onClick={nextQuestion}
                      disabled={quizAnswers[ASSESSMENT_QUESTIONS[activeQuizId][currentQuestionIdx].id] === undefined}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                      Next <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-lg md:text-xl font-black text-slate-800 tracking-tight">Skill Assessments</h2>
            <p className="text-xs md:text-sm text-slate-500 font-medium">Verify your knowledge and earn badges</p>
          </div>
          <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Avg</span>
            <span className="text-sm md:text-base font-black text-[#00A0E3]">{averageScore}%</span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={24} className="text-[#00A0E3] animate-spin" />
              <p className="text-slate-500 text-xs font-medium">Loading your progress...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ASSESSMENTS.map((assessment) => {
              const progress = getEffectiveStatus(assessment.id);
              const isLocked = progress.status === 'Locked';

              return (
                <div key={assessment.id} className={`bg-white rounded-2xl border transition-all duration-300 relative overflow-hidden flex flex-col group
                  ${isLocked ? 'border-slate-100 opacity-75' : 'border-slate-200 shadow-md hover:-translate-y-1 hover:shadow-xl hover:border-blue-200'}`}>

                  {/* Card Header */}
                  <div className={`h-24 md:h-28 bg-gradient-to-br ${assessment.color} p-4 md:p-5 relative overflow-hidden`}>
                    <div className="relative z-10 text-white">
                      <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded-md backdrop-blur-sm">
                        Module {assessment.id}
                      </span>
                      <h3 className="text-sm md:text-base font-black mt-2 leading-tight">{assessment.title}</h3>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 md:p-5 flex-1 flex flex-col">
                    <div className="space-y-2.5 mb-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium flex items-center gap-1.5"><Clock size={13} /> Duration</span>
                        <span className="font-bold text-slate-700">{assessment.duration}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium flex items-center gap-1.5"><HelpCircle size={13} /> Questions</span>
                        <span className="font-bold text-slate-700">{assessment.questions}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium flex items-center gap-1.5"><Target size={13} /> Pass Score</span>
                        <span className="font-bold text-slate-700">{assessment.passingScore}%</span>
                      </div>
                    </div>

                    <div className="mt-auto space-y-2.5">
                      {progress.status === 'Completed' ? (
                        <>
                          <div className={`rounded-xl p-3 border text-center ${
                            progress.passed
                              ? 'bg-green-50 border-green-100'
                              : 'bg-red-50 border-red-100'
                          }`}>
                            <p className={`text-[10px] font-bold uppercase mb-0.5 ${
                              progress.passed ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {progress.passed ? 'Passed' : 'Not Passed'}
                            </p>
                            <p className={`text-xl md:text-2xl font-black ${
                              progress.passed ? 'text-green-700' : 'text-red-700'
                            }`}>
                              {progress.score}%
                            </p>
                          </div>
                          {/* Prominent Retake Button */}
                          <button
                            onClick={() => startQuiz(assessment.id)}
                            className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all hover:shadow-md ${
                              progress.passed
                                ? 'bg-gradient-to-r from-[#00A0E3] to-[#0060A9] text-white hover:scale-[1.02]'
                                : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:scale-[1.02] animate-pulse'
                            }`}
                          >
                            <RotateCcw size={13} /> {progress.passed ? 'Retake Assessment' : 'Try Again'}
                          </button>
                        </>
                      ) : isLocked ? (
                        <button disabled className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs flex items-center justify-center gap-1.5 cursor-not-allowed">
                          <Lock size={13} /> Locked
                        </button>
                      ) : (
                        <button
                          onClick={() => startQuiz(assessment.id)}
                          className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-black hover:scale-[1.02] transition-all shadow-lg flex items-center justify-center gap-1.5"
                        >
                          Start Assessment <ArrowRight size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Assessments;
