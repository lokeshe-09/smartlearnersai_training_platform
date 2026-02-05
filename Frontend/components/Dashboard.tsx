import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Rocket,
  Award,
  LogOut,
  Search,
  Bell,
  Calendar,
  Clock,
  ChevronRight,
  BrainCircuit,
  Database,
  Bot,
  Layers,
  Code,
  Check,
  Sparkles,
  PlayCircle,
  X,
  User,
  Settings,
  MessageSquare,
  AlertCircle,
  ArrowLeft,
  FileQuestion,
  Timer,
  BarChart,
  CheckCircle2,
  HelpCircle,
  GraduationCap,
  Camera,
  Image as ImageIcon,
  Send,
  Lightbulb,
  FlaskConical,
  Menu,
  TrendingUp,
  ClipboardCheck,
  Loader2
} from 'lucide-react';
import { chatAPI } from '../services/api';

import Curriculum from './Curriculum';
import Projects from './Projects';
import Assessments from './Assessments';
import Certificates from './Certificates';
import AILab from './AILab';
import Progress from './Progress';
import OrcaAI from './OrcaAI';
import OrcaAIPage from './OrcaAIPage';
import ExamMode from './ExamMode';

// --- RICH TEXT RENDERER FOR SOLUTIONS ---
const RichTextRenderer: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;

  // Function to parse bold (**text**) and code blocks (```code```) and LaTeX ($text$)
  const parts = text.split(/(\*\*.*?\*\*|`.*?`|\$.*?\$)/g);

  return (
    <span className="leading-relaxed">
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={index} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={index} className="bg-slate-100 text-pink-600 px-1.5 py-0.5 rounded font-mono text-sm border border-slate-200">{part.slice(1, -1)}</code>;
        }
        if (part.startsWith('$') && part.endsWith('$')) {
           return <span key={index} className="font-serif italic text-indigo-700 px-1">{part.slice(1, -1)}</span>;
        }
        
        return part.split('\n').map((line, i) => (
          <React.Fragment key={`${index}-${i}`}>
            {i > 0 && <span className="block mb-2" />}
            {line}
          </React.Fragment>
        ));
      })}
    </span>
  );
};

// --- HELPER TO EXTRACT YOUTUBE ID ---
const getYouTubeID = (urlOrId: string) => {
  // Regex to match YouTube video IDs from various URL formats
  // Handles: youtu.be/ID, youtube.com/watch?v=ID, youtube.com/embed/ID
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = urlOrId.match(regExp);
  // If it matches a URL pattern and ID length is 11, return ID. Otherwise assume the string itself is the ID.
  return (match && match[2].length === 11) ? match[2] : urlOrId;
};

// --- MOCK DATA GENERATOR FOR PRACTICE ARENA ---
const generateMockQuestions = (domain: string, count: number) => {
  const baseQuestions = [
    { 
        text: "What is the primary function of an Embedding model in a RAG pipeline?", 
        options: ["To generate human-like text responses", "To convert unstructured data into vector space", "To store data in a relational database", "To authenticate user API requests"], 
        correct: 1, 
        difficulty: "EASY", 
        type: "MCQ", 
        concepts: [
            { title: "Vector Embeddings", desc: "Numerical representations of data that capture semantic meaning in a high-dimensional space." },
            { title: "Semantic Search", desc: "Searching for data based on meaning/intent rather than exact keyword matching." },
            { title: "Dimensionality Reduction", desc: "The process of reducing the number of random variables under consideration." }
        ],
        solution: "The correct answer is **To convert unstructured data into vector space**.\n\n**Detailed Explanation:**\n1.  **Input Processing**: Embedding models take text, images, or audio as input.\n2.  **Vectorization**: They map this input to a fixed-size vector of real numbers.\n3.  **Semantic Capture**: In this vector space, semantically similar items are mathematically close (e.g., small angle/distance).\n4.  **Role in RAG**: These vectors allow the system to retrieve relevant context for the LLM based on meaning, not just keywords."
    },
    { 
        text: "Explain how RLHF (Reinforcement Learning from Human Feedback) significantly improves LLM safety and alignment.", 
        options: [], 
        correct: 0, 
        difficulty: "HARD", 
        type: "DESCRIPTIVE", 
        concepts: [
            { title: "Reinforcement Learning", desc: "Machine learning method based on rewarding desired behaviors." },
            { title: "Reward Modeling", desc: "Training a separate model to mimic human preference ranking." },
            { title: "PPO (Proximal Policy Optimization)", desc: "An algorithm used to fine-tune the LLM policy to maximize reward without deviating too far from the original model." }
        ],
        solution: "**Step-by-Step Explanation:**\n\n1.  **Supervised Fine-Tuning (SFT)**: The model is first trained on high-quality demonstration data to learn the basic format of instruction following.\n\n2.  **Reward Model Training**: Human labelers rank different model outputs for the same prompt from best to worst. A separate 'Reward Model' is trained on this data to predict human preference scores.\n\n3.  **Reinforcement Learning (PPO)**: The SFT model acts as a 'policy'. It generates text, the Reward Model assigns a score, and the PPO algorithm updates the model's weights to maximize this score. This aligns the model with human values like safety, helpfulness, and honesty."
    },
    { 
        text: "In the context of Vector Databases, what does 'Retrieval' specifically imply?", 
        options: ["Fetching data from the open internet via search engine", "Fetching relevant context chunks based on vector similarity", "Retrieving model weights from the cloud storage", "Downloading a PDF document from a URL"], 
        correct: 1, 
        difficulty: "MEDIUM", 
        type: "MCQ", 
        concepts: [
            { title: "Vector Database", desc: "A DB optimized for storing and querying high-dimensional vectors." },
            { title: "Context Window", desc: "The limit on the amount of text an LLM can process in one go." },
            { title: "Similarity Search", desc: "Finding vectors closest to the query vector using metrics like Cosine Similarity." }
        ],
        solution: "The correct answer is **Fetching relevant context chunks based on vector similarity**.\n\n**Why?**\n*   **Query Embedding**: The user's question is converted into a vector.\n*   **Search**: The database compares this vector against stored document vectors.\n*   **Retrieval**: The 'top-k' most similar chunks are retrieved.\n*   **Generation**: These chunks are fed into the LLM as context to answer the question."
    },
    { 
        text: "Write a Python snippet to initialize the Vertex AI SDK and list available models.", 
        options: [], 
        correct: 0, 
        difficulty: "MEDIUM", 
        type: "DESCRIPTIVE", 
        concepts: [
            { title: "Google Cloud SDK", desc: "Command-line tools and libraries for GCP services." },
            { title: "Vertex AI", desc: "Google's unified ML platform." },
            { title: "Model Garden", desc: "A collection of pre-trained models available in Vertex AI." }
        ],
        solution: "```python\nimport vertexai\nfrom vertexai.preview import model_garden\n\n# 1. Initialize the SDK\n# Replace with your specific project ID and location\nvertexai.init(project='your-project-id', location='us-central1')\n\n# 2. (Conceptual) Listing models usually involves the Model Garden API\n# or simply instantiating a known model:\nfrom vertexai.generative_models import GenerativeModel\n\nmodel = GenerativeModel('gemini-1.5-flash')\nprint('Model initialized successfully')\n```\n\n**Note**: Actual programmatic listing of all available models usually requires the `google-cloud-aiplatform` library directly."
    },
    { 
        text: "Identify the hallucination type in this output: 'The Golden Gate Bridge connects London to Paris.'", 
        options: ["Logical Fallacy", "Factuality Error", "Instruction Disobedience", "Context Omission"], 
        correct: 1, 
        difficulty: "EASY", 
        type: "MCQ", 
        concepts: [
            { title: "Factuality", desc: "The adherence of the model's output to real-world facts." },
            { title: "Grounding", desc: "Anchoring model outputs to provided trusted sources." },
            { title: "Hallucination", desc: "When an LLM generates plausible-sounding but incorrect information." }
        ],
        solution: "The correct answer is **Factuality Error**.\n\n**Analysis:**\n*   **Fact**: The Golden Gate Bridge is in San Francisco, USA.\n*   **Fact**: London and Paris are connected by the Channel Tunnel (rail) or air/sea routes.\n*   **Error**: The model stated a geographical impossibility as a fact. This is a direct contradiction of world knowledge."
    },
  ];

  return Array.from({ length: count }, (_, i) => {
    const base = baseQuestions[i % baseQuestions.length];
    return {
      id: i + 1,
      text: `${base.text}`,
      options: base.options,
      correctAnswer: base.correct,
      difficulty: base.difficulty,
      type: base.type,
      concepts: base.concepts,
      solution: base.solution,
      domain: domain,
      status: "unattempted" as "unattempted" | "correct" | "incorrect"
    };
  });
};


// --- SIDEBAR ITEM ---
interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden ${
        active
          ? 'bg-[#00A0E3] text-white shadow-lg shadow-blue-900/20'
          : 'text-slate-400 hover:text-white hover:bg-white/5'
      }`}
    >
      <div className={`relative z-10 ${active ? 'scale-110' : 'group-hover:scale-110'} transition-transform duration-300`}>
        {icon}
      </div>
      <span className={`font-bold text-sm relative z-10 ${active ? 'translate-x-0' : 'group-hover:translate-x-1'} transition-transform duration-300`}>
        {label}
      </span>
      {active && (
        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      )}
    </button>
  );
};

interface DashboardProps {
  onLogout: () => void;
  username: string;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout, username }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- PRACTICE ARENA STATE ---
  const [practiceConfig, setPracticeConfig] = useState({
    proficiency: 'Beginner (Foundations)',
    domain: 'Foundations of Modern AI',
    topic: 'All Topics',
    mode: 'Multiple Choice Quiz'
  });
  const [isPracticeOpen, setIsPracticeOpen] = useState(false);
  const [practiceQuestions, setPracticeQuestions] = useState<any[]>([]);
  const [activePracticeQuestionId, setActivePracticeQuestionId] = useState<number | null>(null);
  const [practiceAnswers, setPracticeAnswers] = useState<Record<number, number | null>>({});
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<number>>(new Set());
  const [isSelectingQuestions, setIsSelectingQuestions] = useState(false);

  const [questionTimer, setQuestionTimer] = useState(0);
  const [activeDetailView, setActiveDetailView] = useState<'concepts' | 'solution' | null>(null);
  const [aiCorrectionResults, setAiCorrectionResults] = useState<Record<number, { loading: boolean; result: string | null; isCorrect: boolean | null }>>({});
  const [isSubmittingAll, setIsSubmittingAll] = useState(false);

  // Per-question timer: resets when user views a new question
  useEffect(() => {
    let interval: any;
    if (activePracticeQuestionId !== null) {
      setQuestionTimer(0);
      interval = setInterval(() => setQuestionTimer(t => t + 1), 1000);
    } else {
      setQuestionTimer(0);
    }
    return () => clearInterval(interval);
  }, [activePracticeQuestionId]);

  useEffect(() => {
    setActiveDetailView(null);
  }, [activePracticeQuestionId]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const startPracticeSession = () => {
    const questions = generateMockQuestions(practiceConfig.domain, 20);
    setPracticeQuestions(questions);
    setSelectedQuestionIds(new Set());
    setIsSelectingQuestions(true);
    setIsPracticeOpen(true);
    setActivePracticeQuestionId(null);
    setPracticeAnswers({});
  };

  const closePracticeSession = () => {
    setIsPracticeOpen(false);
    setActivePracticeQuestionId(null);
    setPracticeQuestions([]);
    setSelectedQuestionIds(new Set());
    setIsSelectingQuestions(false);
    setAiCorrectionResults({});
    setIsSubmittingAll(false);
  };

  const startSelectedQuestions = () => {
    const filtered = practiceQuestions.filter(q => selectedQuestionIds.has(q.id));
    setPracticeQuestions(filtered);
    setIsSelectingQuestions(false);
    setPracticeAnswers({});
  };

  const toggleQuestionSelection = (qId: number) => {
    setSelectedQuestionIds(prev => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  const selectAllQuestions = () => {
    setSelectedQuestionIds(new Set(practiceQuestions.map(q => q.id)));
  };

  const deselectAllQuestions = () => {
    setSelectedQuestionIds(new Set());
  };

  const handlePracticeAnswer = (qId: number, optionIdx: number) => {
    setPracticeAnswers(prev => ({ ...prev, [qId]: optionIdx }));
  };

  const getPracticeQuestionStatus = (qId: number) => {
    const question = practiceQuestions.find(q => q.id === qId);
    const answer = practiceAnswers[qId];
    if (answer === undefined || answer === null) return 'unattempted';
    return answer === question.correctAnswer ? 'correct' : 'incorrect';
  };

  // AI Correct a single question
  const aiCorrectQuestion = async (questionId: number) => {
    const question = practiceQuestions.find(q => q.id === questionId);
    if (!question) return;
    const userAnswer = practiceAnswers[questionId];
    if (userAnswer === undefined || userAnswer === null) return;

    setAiCorrectionResults(prev => ({ ...prev, [questionId]: { loading: true, result: null, isCorrect: null } }));

    const prompt = `You are an AI tutor. A student answered this question:\n\nQuestion: ${question.text}\nOptions:\n${question.options.map((o: string, i: number) => `${String.fromCharCode(65 + i)}) ${o}`).join('\n')}\n\nStudent selected: ${String.fromCharCode(65 + userAnswer)}) ${question.options[userAnswer]}\nCorrect answer: ${String.fromCharCode(65 + question.correctAnswer)}) ${question.options[question.correctAnswer]}\n\nIs the student correct? Give a brief explanation (2-3 sentences) of why the correct answer is right. Start with "Correct!" or "Incorrect." then explain.`;

    try {
      const res = await chatAPI.sendMessage(prompt, []);
      const text = res.response || res.message || 'Unable to get AI feedback.';
      const correct = userAnswer === question.correctAnswer;
      setAiCorrectionResults(prev => ({ ...prev, [questionId]: { loading: false, result: text, isCorrect: correct } }));
    } catch {
      setAiCorrectionResults(prev => ({ ...prev, [questionId]: { loading: false, result: 'Failed to get AI feedback. Please try again.', isCorrect: null } }));
    }
  };

  // AI Correct all questions at once
  const aiCorrectAllQuestions = async () => {
    setIsSubmittingAll(true);
    const promises = practiceQuestions.map(q => {
      if (practiceAnswers[q.id] !== undefined && practiceAnswers[q.id] !== null) {
        return aiCorrectQuestion(q.id);
      }
      return Promise.resolve();
    });
    await Promise.all(promises);
    setIsSubmittingAll(false);
    setActivePracticeQuestionId(null); // Go back to list to see all results
  };

  // Helper to handle navigation click
  const handleNavClick = (tab: string) => {
    setActiveTab(tab);
    setIsPracticeOpen(false);
    setIsMobileMenuOpen(false); // Close mobile menu when navigating
  };

  const notifications = [
    { 
      id: 1, 
      title: "Week 3 Unlocked", 
      message: "Retrieval-Augmented Generation content is now available.", 
      time: "2h ago", 
      icon: <Database size={16} className="text-blue-500" />,
      bg: "bg-blue-50"
    },
    { 
      id: 2, 
      title: "Lab Reminder", 
      message: "Don't forget to submit your Prompt Engineering lab.", 
      time: "5h ago", 
      icon: <AlertCircle size={16} className="text-orange-500" />,
      bg: "bg-orange-50"
    },
    { 
      id: 3, 
      title: "Welcome!", 
      message: "Welcome to the Applied AI Training Program.", 
      time: "1d ago", 
      icon: <Sparkles size={16} className="text-yellow-500" />,
      bg: "bg-yellow-50"
    }
  ];

  const courseData = {
    weeks: [
      {
        id: 1,
        title: "Foundations of Modern AI",
        duration: "7 Hours",
        icon: <BrainCircuit size={24} />,
        progress: 100,
        topics: [
          { title: "Evolution of AI vs ML vs Deep Learning", type: "video", duration: "15 min", completed: true, videoId: "qYNweeDHiyU" },
          { title: "High-level LLM Architecture (Tokens, Embeddings)", type: "video", duration: "25 min", completed: true, videoId: "qYNweeDHiyU" },
          { title: "Popular LLM Ecosystems (Open vs Closed)", type: "reading", duration: "10 min", completed: true },
          { title: "Lab: First AI-powered text generation app", type: "video", duration: "45 min", completed: true, videoId: "qYNweeDHiyU" }
        ],
        status: "Completed"
      },
      {
        id: 2,
        title: "Prompt Engineering & Optimization",
        duration: "7 Hours",
        icon: <Code size={24} />,
        progress: 35,
        topics: [
          { title: "Zero-shot & Few-shot prompting", type: "video", duration: "20 min", completed: true, videoId: "yu27PWzJI_Y" },
          { title: "Chain-of-thought & Role prompting", type: "video", duration: "30 min", completed: false, videoId: "yu27PWzJI_Y" },
          { title: "Handling hallucinations & Token limits", type: "reading", duration: "15 min", completed: false },
          { title: "Lab: Build a prompt-driven AI assistant", type: "video", duration: "60 min", completed: false, videoId: "yu27PWzJI_Y" }
        ],
        status: "In Progress"
      },
      {
        id: 3,
        title: "Retrieval-Augmented Generation (RAG)",
        duration: "7 Hours",
        icon: <Database size={24} />,
        progress: 0,
        topics: [
          { title: "RAG Architecture & Vector Databases", type: "video", duration: "40 min", completed: false, videoId: "T-D1OfcDW1M" },
          { title: "Data ingestion & Chunking strategies", type: "reading", duration: "20 min", completed: false },
          { title: "Similarity Search", type: "video", duration: "25 min", completed: false, videoId: "T-D1OfcDW1M" },
          { title: "Project: AI-Driven Campaign Management System", type: "project", duration: "2 hrs", completed: false }
        ],
        status: "Locked"
      },
      {
        id: 4,
        title: "Fine-Tuning, Agents & Workflows",
        duration: "7 Hours",
        icon: <Bot size={24} />,
        progress: 0,
        topics: [
          { title: "Instruction tuning vs LoRA", type: "video", duration: "35 min", completed: false, videoId: "iOdFUJiB0Zc" },
          { title: "Tool calling & Function execution", type: "video", duration: "30 min", completed: false, videoId: "iOdFUJiB0Zc" },
          { title: "Multi-step reasoning workflows", type: "reading", duration: "20 min", completed: false },
          { title: "Project: Smart CRM Assistant (Agentic AI)", type: "project", duration: "3 hrs", completed: false }
        ],
        status: "Locked"
      },
      {
        id: 5,
        title: "Deployment & Responsible AI",
        duration: "7 Hours",
        icon: <Rocket size={24} />,
        progress: 0,
        topics: [
          { title: "Backend integration (APIs)", type: "video", duration: "45 min", completed: false, videoId: "yh-3WU1FKrk" },
          { title: "Cost optimization & Latency", type: "reading", duration: "15 min", completed: false },
          { title: "AI Safety, Bias & Ethics", type: "video", duration: "30 min", completed: false, videoId: "yh-3WU1FKrk" },
          { title: "Capstone Final Assessment", type: "exam", duration: "1 hr", completed: false }
        ],
        status: "Locked"
      }
    ],
    projects: [
      {
        id: 1,
        title: "Intelligent Inventory Control",
        type: "Fine-Tuning",
        difficulty: "Intermediate",
        estimatedTime: "4 Hours",
        techStack: ["Llama-3.2-3B-Instruct", "Unsloth", "Hugging Face", "vLLM"],
        desc: "Customize an AI assistant using inventory data and product catalogs to answer stock queries.",
        color: "from-purple-500 to-indigo-600",
        lightColor: "bg-purple-50 text-purple-700",
        architecture: "The system utilizes Llama-3.2-3B-Instruct from Hugging Face, fine-tuned with Unsloth on a custom dataset of inventory logs and product specifications. Unsloth enables 2x faster training with 60% less memory using QLoRA (4-bit quantization). The fine-tuned model is pushed to Hugging Face Hub and deployed using vLLM for high-throughput, low-latency inference. A frontend interface sends user queries to the vLLM API endpoint, which parses warehouse terminology specifically taught during the training phase.",
        steps: [
            "Data Collection: Export 500+ rows of historical inventory Q&A logs from the ERP system.",
            "Data Formatting: Clean and format data into the Alpaca/ChatML format compatible with Unsloth fine-tuning.",
            "Fine-Tuning with Unsloth: Load Llama-3.2-3B-Instruct from Hugging Face with 4-bit quantization and apply LoRA adapters for efficient training.",
            "Model Upload: Push the fine-tuned model and LoRA adapters to Hugging Face Hub for version control and sharing.",
            "Deployment with vLLM: Deploy the model using vLLM server for optimized inference with continuous batching and PagedAttention."
        ]
      },
      {
        id: 2,
        title: "Campaign Management System",
        type: "RAG Pipeline",
        difficulty: "Advanced",
        estimatedTime: "6 Hours",
        techStack: ["LangChain", "ChromaDB", "Gemini AI"],
        desc: "Build a system to retrieve past campaign documents and generate actionable marketing insights.",
        color: "from-blue-500 to-cyan-600",
        lightColor: "bg-blue-50 text-blue-700",
        architecture: "This application uses a RAG (Retrieval-Augmented Generation) architecture. Marketing documents (PDFs, Docx) are ingested, chunked, and embedded using Gemini's text-embedding model. These embeddings are stored in ChromaDB, an open-source vector database that runs locally with persistent storage. When a user asks a question, the system retrieves relevant chunks via cosine similarity and passes them as context to Gemini Pro for synthesis.",
        steps: [
            "Document Ingestion: Upload marketing briefs and past campaign performance reports.",
            "Chunking Strategy: Implement a recursive character text splitter with a chunk size of 500 tokens and 50 token overlap.",
            "Vector Storage: Generate embeddings using Gemini and store them in ChromaDB with persistent local storage.",
            "Retrieval Logic: Build a Python function to query ChromaDB and return the top 5 most similar context chunks.",
            "Synthesis: Construct a prompt containing the user query and retrieved context, then call Gemini Pro for response generation."
        ]
      },
      {
        id: 3,
        title: "Smart CRM Assistant",
        type: "Agentic AI",
        difficulty: "Expert",
        estimatedTime: "8 Hours",
        techStack: ["Function Calling", "React Flow", "Node.js"],
        desc: "Design an autonomous workflow to plan actions, retrieve customer context, and execute follow-ups.",
        color: "from-emerald-500 to-teal-600",
        lightColor: "bg-emerald-50 text-emerald-700",
        architecture: "The CRM Assistant is built as an Agentic Workflow using the ReAct (Reasoning + Acting) pattern. The core LLM has access to defined tools (Function Calling): 'search_customer', 'read_email', and 'schedule_meeting'. The agent iteratively reasons about the user's request, calls the appropriate tools, observes the output, and formulates a final response or action.",
        steps: [
            "Tool Definition: Define Python functions for CRM API interactions (e.g., getting customer details by ID).",
            "Function Declaration: Map these functions to the Gemini API's 'tools' configuration schema.",
            "Agent Loop: Implement a loop that checks if the model wants to call a function, executes it, and feeds the result back.",
            "State Management: Ensure conversation history and intermediate steps are preserved in the context window.",
            "Guardrails: Implement checks to prevent the agent from deleting records or sending unapproved emails."
        ]
      }
    ]
  };

  const practiceDomains = useMemo(() => courseData.weeks.map(w => w.title), []);
  const practiceTopics = useMemo(() => {
    const selectedWeek = courseData.weeks.find(w => w.title === practiceConfig.domain);
    return selectedWeek ? selectedWeek.topics.map(t => t.title) : [];
  }, [practiceConfig.domain]);

  useEffect(() => {
    if (activeTab === 'projects' && !selectedProject && courseData.projects.length > 0) {
      setSelectedProject(courseData.projects[0]);
    }
  }, [activeTab]);

  return (
    <div className="flex h-full w-full bg-white/95 backdrop-blur-xl overflow-hidden relative">

      {/* Video Modal Overlay - ADDED ORIGIN PARAMETER TO FIX ERROR 153 */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-black rounded-2xl overflow-hidden shadow-2xl w-full max-w-4xl mx-4 relative group">
            <button 
              onClick={() => setActiveVideo(null)}
              className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/50 p-2 rounded-full backdrop-blur-sm transition-colors z-20"
            >
              <X size={24} />
            </button>
            <div className="aspect-video w-full">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${getYouTubeID(activeVideo)}?rel=0&modestbranding=1&enablejsapi=1`}
                title="Course Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            </div>
            <div className="p-6 bg-slate-900 text-white border-t border-slate-800">
              <h3 className="text-xl font-bold">Now Playing</h3>
              <p className="text-slate-400 text-sm mt-1">Lesson Demo Content</p>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Updated to Drawer for Mobile */}
      <div className={`
        fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#0B1120] flex flex-col justify-between py-8 transition-transform duration-300 ease-in-out shadow-2xl border-r border-white/5
        md:relative md:translate-x-0 md:flex
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="absolute top-0 left-[-20%] w-60 h-60 bg-blue-600/10 rounded-full blur-[60px] pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-0 right-[-20%] w-60 h-60 bg-purple-600/10 rounded-full blur-[60px] pointer-events-none animate-pulse delay-700"></div>

        <div className="px-3 md:px-8 mb-10 relative z-10 flex justify-between items-center">
          <div className="flex items-center gap-4">
             <div className="block animate-in fade-in slide-in-from-left-4 duration-700">
                <h1 className="font-black text-white text-xl tracking-tight leading-none mb-1">
                  SMART<span className="text-[#00A0E3]">LEARNERS.AI</span>
                </h1>
                <div className="flex items-center gap-2">
                   <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                   </span>
                   <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Student Portal</p>
                </div>
             </div>
          </div>
          {/* Close button for mobile */}
          <button 
            className="md:hidden text-slate-400 hover:text-white transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        <nav className="px-3 md:px-5 space-y-2 flex-1 relative z-10">
          <SidebarItem icon={<LayoutDashboard size={22} />} label="Overview" active={activeTab === 'overview'} onClick={() => handleNavClick('overview')} />
          <SidebarItem icon={<BookOpen size={22} />} label="Curriculum" active={activeTab === 'curriculum'} onClick={() => handleNavClick('curriculum')} />
          <SidebarItem icon={<FlaskConical size={22} />} label="AI Lab" active={activeTab === 'ailab'} onClick={() => handleNavClick('ailab')} />
          <SidebarItem icon={<Layers size={22} />} label="Projects" active={activeTab === 'projects'} onClick={() => handleNavClick('projects')} />
          <SidebarItem icon={<FileQuestion size={22} />} label="Assessments" active={activeTab === 'assessments'} onClick={() => handleNavClick('assessments')} />
          <SidebarItem icon={<ClipboardCheck size={22} />} label="Exam Mode" active={activeTab === 'exammode'} onClick={() => handleNavClick('exammode')} />
          <SidebarItem icon={<Bot size={22} />} label="OrcaAI" active={activeTab === 'orcaai'} onClick={() => handleNavClick('orcaai')} />
          <SidebarItem icon={<TrendingUp size={22} />} label="Progress" active={activeTab === 'progress'} onClick={() => handleNavClick('progress')} />
          <SidebarItem icon={<Award size={22} />} label="Certificates" active={activeTab === 'certificates'} onClick={() => handleNavClick('certificates')} />
        </nav>

        <div className="px-3 md:px-5 relative z-10 mt-6">
           <div className="flex flex-col gap-3 p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/5 group hover:border-white/10 transition-colors">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 p-[2px]">
                   <div className="w-full h-full rounded-full bg-[#0B1120] flex items-center justify-center">
                     <span className="text-white font-bold text-sm">{username.charAt(0).toUpperCase()}</span>
                   </div>
                 </div>
                 <div className="overflow-hidden">
                    <p className="text-white text-sm font-bold truncate">{username}</p>
                 </div>
              </div>
              <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white/5 hover:bg-red-500/10 hover:text-red-400 text-slate-400 text-xs font-bold transition-all border border-transparent hover:border-red-500/20">
                <LogOut size={14} /> Sign Out
              </button>
           </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden bg-[#F8FAFC] relative">
        {!isPracticeOpen && (
          <header className="h-20 flex items-center justify-between px-4 md:px-10 bg-white/80 backdrop-blur-xl sticky top-0 z-20 border-b border-slate-200/60 shadow-sm">
            <div className="flex items-center gap-3">
              {/* Hamburger Button - Visible on Mobile */}
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <Menu size={24} />
              </button>
              
              <div>
                <h2 className="text-lg md:text-2xl font-black text-slate-800 tracking-tight leading-tight">
                  {activeTab === 'overview' ? `Good Afternoon, ${username}` :
                  (activeTab === 'ailab' ? 'AI Lab' : activeTab === 'orcaai' ? 'OrcaAI Assistant' : activeTab === 'exammode' ? 'Exam Mode' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1))}
                </h2>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider hidden md:block">
                  Applied AI Training Program
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 md:gap-6">
              <div className="hidden md:flex items-center bg-slate-50/50 rounded-full px-5 py-2.5 border border-slate-200 focus-within:ring-2 focus-within:ring-blue-100 transition-all shadow-inner w-72">
                <Search size={18} className="text-slate-400" />
                <input type="text" placeholder="Search resources, lessons..." className="bg-transparent border-none focus:outline-none text-sm ml-3 w-full text-slate-600 placeholder-slate-400 font-medium" />
              </div>
              <div className="relative">
                <button onClick={() => { setIsNotificationsOpen(!isNotificationsOpen); setIsProfileOpen(false); }} className={`relative p-2.5 md:p-3 rounded-full transition-all ${isNotificationsOpen ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-white hover:shadow-md hover:text-slate-700'}`}>
                  <Bell size={20} />
                  <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>
                {isNotificationsOpen && (
                  <div className="absolute top-14 right-[-50px] md:right-0 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-5 py-4 border-b border-slate-50 flex justify-between items-center">
                      <h4 className="font-bold text-slate-800">Notifications</h4>
                      <span className="text-xs text-[#00A0E3] font-bold cursor-pointer hover:underline">Mark all read</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.map((notif) => (
                        <div key={notif.id} className="px-5 py-4 hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-50 last:border-0 group">
                          <div className="flex gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${notif.bg} group-hover:scale-110 transition-transform`}>
                              {notif.icon}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800 leading-snug">{notif.title}</p>
                              <p className="text-xs text-slate-500 mt-1 line-clamp-2 font-medium">{notif.message}</p>
                              <p className="text-[10px] text-slate-400 mt-1.5 font-bold uppercase tracking-wide">{notif.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="px-4 py-3 border-t border-slate-50 text-center bg-slate-50/50">
                      <button className="text-xs font-bold text-slate-500 hover:text-[#00A0E3] transition-colors">View All Notifications</button>
                    </div>
                  </div>
                )}
              </div>
              <div className="relative">
                <button onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotificationsOpen(false); }} className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 p-[2px] shadow-lg shadow-blue-200 transition-transform active:scale-95 focus:outline-none hover:shadow-xl">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-[#0060A9] font-black text-sm">
                    {username.charAt(0).toUpperCase()}
                  </div>
                </button>
                {isProfileOpen && (
                  <div className="absolute top-16 right-0 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-4 pb-4 border-b border-slate-100 mb-2">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 p-[2px]">
                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-[#0060A9] font-bold text-xl">
                          {username.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-base">{username}</h4>
                        <p className="text-xs text-slate-500 font-medium">Student</p>
                        <p className="text-xs text-slate-400 mt-0.5 break-all">{username.toLowerCase()}@smartlearners.ai</p>
                      </div>
                    </div>
                    <div className="space-y-1 mt-3">
                      <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-600 hover:text-[#00A0E3] hover:bg-slate-50 rounded-xl transition-colors text-left group">
                        <User size={18} className="text-slate-400 group-hover:text-[#00A0E3] transition-colors" /> My Profile
                      </button>
                      <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-600 hover:text-[#00A0E3] hover:bg-slate-50 rounded-xl transition-colors text-left group">
                        <Settings size={18} className="text-slate-400 group-hover:text-[#00A0E3] transition-colors" /> Settings
                      </button>
                      <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-600 hover:text-[#00A0E3] hover:bg-slate-50 rounded-xl transition-colors text-left group">
                        <MessageSquare size={18} className="text-slate-400 group-hover:text-[#00A0E3] transition-colors" /> Support
                      </button>
                    </div>
                    <div className="pt-3 mt-2 border-t border-slate-100">
                      <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors text-left">
                        <LogOut size={18} /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>
        )}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-hide bg-[#F8FAFC] relative">
          {isPracticeOpen ? (
            isSelectingQuestions ? (
              /* ── QUESTION SELECTION PHASE ── */
              <div className="flex flex-col max-w-5xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <button onClick={closePracticeSession} className="bg-white p-2 rounded-xl border border-slate-100 text-slate-500 hover:text-[#00A0E3] shadow-sm transition-all flex-shrink-0">
                      <ArrowLeft size={18} />
                    </button>
                    <div>
                      <h2 className="text-lg md:text-xl font-black text-slate-800 tracking-tight">Select Questions</h2>
                      <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">{practiceConfig.domain} &bull; {practiceConfig.proficiency}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#00A0E3] bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                    {selectedQuestionIds.size}/{practiceQuestions.length} selected
                  </span>
                </div>

                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                  {/* Toolbar */}
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex gap-2">
                      <button onClick={selectAllQuestions} className="text-[10px] font-bold text-[#00A0E3] hover:underline">Select All</button>
                      <span className="text-slate-300">|</span>
                      <button onClick={deselectAllQuestions} className="text-[10px] font-bold text-slate-400 hover:text-slate-600 hover:underline">Deselect All</button>
                    </div>
                    <span className="text-[10px] font-medium text-slate-400">{practiceQuestions.length} questions generated</span>
                  </div>

                  {/* Question List with Checkboxes */}
                  <div className="max-h-[55vh] overflow-y-auto divide-y divide-slate-50">
                    {practiceQuestions.map((q: any, idx: number) => {
                      const isSelected = selectedQuestionIds.has(q.id);
                      return (
                        <div
                          key={q.id}
                          onClick={() => toggleQuestionSelection(q.id)}
                          className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all hover:bg-slate-50 ${isSelected ? 'bg-blue-50/40' : ''}`}
                        >
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'bg-[#00A0E3] border-[#00A0E3]' : 'border-slate-300'}`}>
                            {isSelected && <Check size={12} className="text-white" />}
                          </div>
                          <span className="text-xs font-bold text-slate-400 w-5 text-center flex-shrink-0">{idx + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs md:text-sm font-medium text-slate-700 truncate">{q.text}</p>
                          </div>
                          <div className="flex gap-1.5 flex-shrink-0">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                              q.difficulty === 'EASY' ? 'bg-green-50 text-green-600' :
                              q.difficulty === 'MEDIUM' ? 'bg-yellow-50 text-yellow-600' :
                              'bg-red-50 text-red-600'
                            }`}>{q.difficulty}</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase bg-slate-100 text-slate-500">{q.type}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Start Button */}
                  <div className="px-4 py-3 border-t border-slate-100 bg-white">
                    <button
                      onClick={startSelectedQuestions}
                      disabled={selectedQuestionIds.size === 0}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#00A0E3] to-[#0060A9] text-white font-bold text-sm hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Rocket size={16} /> Start Practice ({selectedQuestionIds.size} question{selectedQuestionIds.size !== 1 ? 's' : ''})
                    </button>
                  </div>
                </div>
              </div>
            ) : (
             <div className="flex flex-col h-full md:h-auto max-w-5xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 mb-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-3 md:mb-4">
                   <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
                      <button onClick={closePracticeSession} className="bg-white p-2 rounded-lg border border-slate-100 text-slate-500 hover:text-[#00A0E3] hover:border-blue-100 shadow-sm transition-all flex-shrink-0">
                        <ArrowLeft size={16} />
                      </button>
                      <div className="min-w-0">
                        <h2 className="text-sm md:text-base font-bold text-slate-800 tracking-tight flex items-center gap-1.5 truncate">
                           <span className="truncate">{activePracticeQuestionId ? 'Solve Question' : 'Practice Arena'}</span>
                           {activePracticeQuestionId && <span className="text-[10px] md:text-xs font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded whitespace-nowrap">Q{practiceQuestions.findIndex(q => q.id === activePracticeQuestionId) + 1}</span>}
                        </h2>
                        <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{practiceConfig.domain} • {practiceConfig.proficiency}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
                      <div className="bg-white px-2.5 md:px-3 py-1.5 rounded-lg font-bold text-[10px] md:text-xs flex items-center gap-1.5 shadow-sm border border-slate-100 text-[#0060A9]">
                        <Timer size={13} /> <span className="font-mono text-xs">{formatTime(questionTimer)}</span>
                      </div>
                      <button className="bg-indigo-50 text-indigo-600 px-2.5 md:px-3 py-1.5 rounded-lg font-bold text-[10px] md:text-xs hover:bg-indigo-100 transition-colors flex items-center gap-1.5">
                        <HelpCircle size={13} /> Tutorial
                      </button>
                   </div>
                </div>
                {/* Practice Interface Implementation */}
                <div className="flex-1 md:flex-none bg-white rounded-xl md:rounded-2xl shadow-lg border border-slate-100 overflow-hidden flex flex-col relative md:min-h-[420px]">
                   {activePracticeQuestionId === null ? (
                      <div className="flex-1 overflow-y-auto p-3 md:p-5 scrollbar-hide">
                         <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-3 md:mb-4 gap-2">
                            <h3 className="font-bold text-xs md:text-sm text-slate-700">Question Queue ({practiceQuestions.length})</h3>
                            <div className="flex gap-1.5 self-start md:self-auto">
                               <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[9px] md:text-[10px] font-bold rounded-full border border-green-100">
                                 {Object.values(practiceAnswers).filter(a => practiceQuestions.find(q => q.id === parseInt(Object.keys(practiceAnswers).find(k => parseInt(k) === q.id) || "0"))?.correctAnswer === a).length} Correct
                               </span>
                               <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] md:text-[10px] font-bold rounded-full border border-slate-200">
                                 {Object.keys(practiceAnswers).length}/{practiceQuestions.length} Attempted
                               </span>
                            </div>
                         </div>
                         <div className="grid gap-2 md:gap-2.5">
                            {practiceQuestions.map((q, idx) => {
                               const status = getPracticeQuestionStatus(q.id);
                               const isCorrect = status === 'correct';
                               const isWrong = status === 'incorrect';
                               const aiResult = aiCorrectionResults[q.id];
                               return (
                                 <div key={q.id} onClick={() => setActivePracticeQuestionId(q.id)} className={`group p-2.5 md:p-3 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between hover:shadow-md hover:-translate-y-0.5 relative overflow-hidden bg-white ${isCorrect ? 'border-green-200 shadow-green-50/50' : isWrong ? 'border-red-200 shadow-red-50/50' : 'border-slate-100 hover:border-blue-200'}`}>
                                    <div className="absolute left-0 top-0 bottom-0 w-0.5 md:w-1 bg-[#00A0E3] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                                       <div className={`w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center font-bold text-[10px] md:text-xs shadow-sm border transition-colors flex-shrink-0 ${isCorrect ? 'bg-green-100 text-green-700 border-green-200' : isWrong ? 'bg-red-100 text-red-700 border-red-200' : 'bg-slate-50 text-slate-500 border-slate-200 group-hover:bg-[#00A0E3] group-hover:text-white group-hover:border-blue-400'}`}>{idx + 1}</div>
                                       <div className="min-w-0 flex-1">
                                          <h4 className={`font-semibold text-[11px] md:text-xs mb-0.5 truncate ${isCorrect ? 'text-green-800' : isWrong ? 'text-red-800' : 'text-slate-800 group-hover:text-[#00A0E3] transition-colors'}`}>{q.text}</h4>
                                          <div className="flex items-center gap-1.5">
                                             <span className={`text-[8px] px-1.5 py-0.5 rounded border font-bold uppercase tracking-wider ${q.difficulty === 'EASY' ? 'bg-green-50 text-green-600 border-green-100' : q.difficulty === 'MEDIUM' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' : 'bg-red-50 text-red-600 border-red-100'}`}>{q.difficulty}</span>
                                             {aiResult && !aiResult.loading && (
                                               <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${aiResult.isCorrect ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                 {aiResult.isCorrect ? 'AI: Correct' : 'AI: Incorrect'}
                                               </span>
                                             )}
                                          </div>
                                       </div>
                                    </div>
                                    <ChevronRight className="text-slate-300 group-hover:text-[#00A0E3] transition-colors flex-shrink-0 ml-1" size={14} />
                                 </div>
                               );
                            })}
                         </div>
                      </div>
                   ) : (
                      /* ACTIVE QUESTION VIEW CONTAINER - RESTORED FULL LOGIC */
                      <div className="flex-1 md:flex-none flex flex-col h-full md:h-auto overflow-hidden">
                         {(() => {
                           const activeQ = practiceQuestions.find(q => q.id === activePracticeQuestionId);
                           const activeIdx = practiceQuestions.findIndex(q => q.id === activePracticeQuestionId);
                           const currentAnswer = practiceAnswers[activeQ.id];
                           const isAnswered = currentAnswer !== undefined && currentAnswer !== null;

                           // --- RENDER DEDICATED VIEWS ---
                           if (activeDetailView === 'concepts') {
                             return (
                               <div className="flex-1 md:flex-none flex flex-col h-full md:h-auto bg-slate-50/50 animate-in fade-in slide-in-from-right-4 duration-300">
                                 <div className="p-4 md:p-6 border-b border-slate-100 bg-white">
                                    <button
                                      onClick={() => setActiveDetailView(null)}
                                      className="mb-3 flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#00A0E3] transition-colors"
                                    >
                                      <ArrowLeft size={14} /> Back to Question
                                    </button>
                                    <div className="flex items-center gap-2 mb-1">
                                       <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                                         <BrainCircuit size={16} />
                                       </div>
                                       <h2 className="text-sm md:text-base font-bold text-slate-800 tracking-tight">Concepts Required</h2>
                                    </div>
                                    <p className="text-[10px] md:text-xs text-slate-500 max-w-2xl">
                                      Master these fundamental concepts to verify your understanding.
                                    </p>
                                 </div>
                                 <div className="flex-1 md:flex-none overflow-y-auto md:overflow-visible p-4 md:p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 max-w-5xl mx-auto">
                                       {activeQ.concepts.map((concept: any, i: number) => (
                                          <div key={i} className="bg-white p-4 md:p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all group">
                                             <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 mb-3 group-hover:scale-110 transition-transform">
                                                <Lightbulb size={16} />
                                             </div>
                                             <h3 className="text-xs md:text-sm font-bold text-slate-800 mb-1.5 group-hover:text-indigo-600 transition-colors">
                                               {concept.title}
                                             </h3>
                                             <p className="text-[10px] md:text-xs text-slate-500 leading-relaxed">
                                               {concept.desc}
                                             </p>
                                          </div>
                                       ))}
                                    </div>
                                 </div>
                               </div>
                             );
                           }

                           if (activeDetailView === 'solution') {
                             return (
                               <div className="flex-1 md:flex-none flex flex-col h-full md:h-auto bg-slate-50/50 animate-in fade-in slide-in-from-right-4 duration-300">
                                 <div className="p-4 md:p-6 border-b border-slate-100 bg-white">
                                    <button
                                      onClick={() => setActiveDetailView(null)}
                                      className="mb-3 flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#00A0E3] transition-colors"
                                    >
                                      <ArrowLeft size={14} /> Back to Question
                                    </button>
                                    <div className="flex items-center gap-2 mb-1">
                                       <div className="p-1.5 bg-teal-100 text-teal-600 rounded-lg">
                                         <CheckCircle2 size={16} />
                                       </div>
                                       <h2 className="text-sm md:text-base font-bold text-slate-800 tracking-tight">AI Solution</h2>
                                    </div>
                                    <p className="text-[10px] md:text-xs text-slate-500 max-w-2xl">
                                      A detailed breakdown of the correct answer and reasoning.
                                    </p>
                                 </div>
                                 <div className="flex-1 md:flex-none overflow-y-auto md:overflow-visible p-4 md:p-6">
                                    <div className="max-w-4xl mx-auto bg-white p-4 md:p-8 rounded-xl shadow-lg border border-slate-100">
                                       <div className="prose prose-slate max-w-none">
                                          <div className="text-[11px] md:text-xs text-slate-700 leading-relaxed whitespace-pre-line font-medium">
                                            <RichTextRenderer text={activeQ.solution} />
                                          </div>
                                       </div>
                                    </div>
                                 </div>
                               </div>
                             );
                           }

                           const aiResult = aiCorrectionResults[activeQ.id];
                           const isLastQuestion = activeIdx === practiceQuestions.length - 1;

                           return (
                             <div className="flex flex-col h-full md:h-auto animate-in fade-in duration-300">
                                {/* Question Header Area */}
                                <div className="p-3 md:p-5 border-b border-slate-100 bg-slate-50/30 relative">
                                   <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-50 to-transparent rounded-bl-full opacity-50 pointer-events-none"></div>

                                   <div className="relative z-10">
                                      <div className="flex justify-between items-start mb-2 md:mb-3">
                                         <div className="flex gap-1.5">
                                            <span className={`text-[8px] md:text-[10px] font-bold px-1.5 py-0.5 md:px-2 rounded uppercase tracking-wide border
                                               ${activeQ.difficulty === 'EASY' ? 'bg-green-50 text-green-700 border-green-200' :
                                                 activeQ.difficulty === 'MEDIUM' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                 'bg-red-50 text-red-700 border-red-200'}`}>
                                               {activeQ.difficulty}
                                            </span>
                                            <span className="text-[8px] md:text-[10px] font-bold px-1.5 py-0.5 md:px-2 bg-slate-100 text-slate-500 border border-slate-200 rounded uppercase tracking-wide">
                                               {activeQ.type}
                                            </span>
                                         </div>
                                         <div className="flex items-center gap-1.5 text-[9px] md:text-[10px] font-bold text-slate-400">
                                            <Timer size={12} /> {formatTime(questionTimer)}
                                         </div>
                                      </div>

                                      <h2 className="text-xs md:text-sm font-semibold text-slate-900 leading-relaxed">
                                        {activeQ.text}
                                      </h2>
                                   </div>
                                </div>

                                {/* Answer & Interaction Area */}
                                <div className="flex-1 md:flex-none overflow-y-auto md:overflow-visible p-3 md:p-5 bg-white">
                                   {activeQ.type === 'MCQ' ? (
                                     <div className="grid gap-2 md:gap-2.5 max-w-3xl">
                                       {activeQ.options.map((opt: string, optIdx: number) => {
                                         const isSelected = currentAnswer === optIdx;
                                         const isCorrectOption = activeQ.correctAnswer === optIdx;

                                         let btnClass = "border-slate-200 hover:border-blue-300 hover:bg-slate-50";
                                         let icon = <span className="text-[10px] md:text-xs font-bold text-slate-400">{String.fromCharCode(65 + optIdx)}</span>;

                                         if (isAnswered && aiResult && !aiResult.loading) {
                                            if (isSelected && isCorrectOption) {
                                               btnClass = "border-green-500 bg-green-50 ring-1 ring-green-500";
                                               icon = <Check size={12} className="text-green-600" />;
                                            } else if (isSelected && !isCorrectOption) {
                                               btnClass = "border-red-500 bg-red-50 ring-1 ring-red-500";
                                               icon = <X size={12} className="text-red-600" />;
                                            } else if (!isSelected && isCorrectOption) {
                                               btnClass = "border-green-500 bg-green-50/50 border-dashed";
                                               icon = <Check size={12} className="text-green-600" />;
                                            } else {
                                               btnClass = "border-slate-100 opacity-50";
                                            }
                                         } else if (isSelected) {
                                            btnClass = "border-[#00A0E3] bg-blue-50 ring-1 ring-[#00A0E3]";
                                            icon = <div className="w-2 h-2 bg-[#00A0E3] rounded-full" />;
                                         }

                                         return (
                                           <button
                                             key={optIdx}
                                             onClick={() => !(isAnswered && aiResult && !aiResult.loading) && handlePracticeAnswer(activeQ.id, optIdx)}
                                             disabled={!!(isAnswered && aiResult && !aiResult.loading)}
                                             className={`w-full p-2.5 md:p-3 rounded-xl border-2 text-left transition-all duration-200 flex items-center gap-2.5 md:gap-3 group ${btnClass}`}
                                           >
                                              <div className={`w-6 h-6 md:w-7 md:h-7 rounded-lg bg-white border flex items-center justify-center shadow-sm flex-shrink-0
                                                ${isAnswered && aiResult && !aiResult.loading && (isSelected || isCorrectOption) ? 'border-transparent' : 'border-slate-200'}`}>
                                                 {icon}
                                              </div>
                                              <span className={`font-medium text-[11px] md:text-xs ${isAnswered && aiResult && !aiResult.loading && (isSelected || isCorrectOption) ? 'text-slate-900' : 'text-slate-600'}`}>
                                                {opt}
                                              </span>
                                           </button>
                                         );
                                       })}
                                     </div>
                                   ) : (
                                     <div className="space-y-4 max-w-4xl">
                                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                           <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-3">
                                              <ImageIcon size={14} className="text-slate-400" />
                                              Add Solution Images
                                           </label>
                                           <div className="flex gap-3">
                                              <button className="flex flex-col items-center justify-center gap-1.5 w-20 h-20 md:w-24 md:h-24 border-2 border-dashed border-blue-200 bg-blue-50 rounded-xl text-blue-500 hover:bg-blue-100 transition-colors">
                                                <Camera size={18} />
                                                <span className="text-[10px] font-bold">Camera</span>
                                              </button>
                                              <button className="flex flex-col items-center justify-center gap-1.5 w-20 h-20 md:w-24 md:h-24 border-2 border-dashed border-slate-300 bg-white rounded-xl text-slate-400 hover:border-blue-300 hover:text-blue-500 transition-colors">
                                                <ImageIcon size={18} />
                                                <span className="text-[10px] font-bold">Gallery</span>
                                              </button>
                                           </div>
                                        </div>
                                        <div className="relative">
                                           <textarea
                                             className="w-full h-32 md:h-40 p-3 md:p-4 rounded-xl bg-white border-2 border-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-[#00A0E3] resize-none font-medium text-slate-700 text-xs md:text-sm leading-relaxed placeholder-slate-300"
                                             placeholder="Type your detailed solution here..."
                                           ></textarea>
                                           <button className="absolute bottom-3 right-3 p-2 bg-[#00A0E3] text-white rounded-lg hover:bg-[#008bc5] transition-colors shadow-md">
                                              <Send size={14} />
                                           </button>
                                        </div>
                                     </div>
                                   )}

                                   {/* AI Correction Result - Inline */}
                                   {aiResult && (
                                     <div className={`mt-3 p-3 rounded-xl border text-xs leading-relaxed animate-in fade-in duration-300 ${
                                       aiResult.loading ? 'bg-purple-50 border-purple-100 text-purple-600' :
                                       aiResult.isCorrect ? 'bg-green-50 border-green-200 text-green-800' :
                                       'bg-red-50 border-red-200 text-red-800'
                                     }`}>
                                       {aiResult.loading ? (
                                         <div className="flex items-center gap-2">
                                           <Loader2 size={14} className="animate-spin" />
                                           <span className="font-medium">AI is analyzing your answer...</span>
                                         </div>
                                       ) : (
                                         <div>
                                           <div className="flex items-center gap-1.5 mb-1.5 font-bold text-[11px]">
                                             {aiResult.isCorrect ? <CheckCircle2 size={14} className="text-green-600" /> : <X size={14} className="text-red-600" />}
                                             {aiResult.isCorrect ? 'Correct Answer!' : 'Incorrect Answer'}
                                           </div>
                                           <p className="text-[11px] leading-relaxed font-medium">{aiResult.result}</p>
                                         </div>
                                       )}
                                     </div>
                                   )}
                                </div>

                                {/* Bottom Toolbar */}
                                <div className="p-2.5 md:p-3.5 bg-white border-t border-slate-100 flex flex-wrap items-center gap-2 justify-between sticky bottom-0 z-20">
                                   <div className="flex flex-wrap gap-1.5 md:gap-2 w-full md:w-auto">
                                      <button
                                        onClick={() => setActivePracticeQuestionId(null)}
                                        className="flex-1 md:flex-none px-3 md:px-4 py-1.5 md:py-2 rounded-lg font-bold text-[10px] md:text-xs text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors whitespace-nowrap"
                                      >
                                        Back to List
                                      </button>

                                      <button
                                        onClick={() => setActiveDetailView('concepts')}
                                        className="flex-1 md:flex-none px-3 md:px-4 py-1.5 md:py-2 rounded-lg font-bold text-[10px] md:text-xs bg-white border border-indigo-100 text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm whitespace-nowrap"
                                      >
                                        Concepts
                                      </button>

                                      <button
                                        onClick={() => setActiveDetailView('solution')}
                                        className="flex-1 md:flex-none px-3 md:px-4 py-1.5 md:py-2 rounded-lg font-bold text-[10px] md:text-xs bg-white border border-teal-100 text-teal-600 hover:bg-teal-50 transition-all shadow-sm whitespace-nowrap"
                                      >
                                        Solution
                                      </button>
                                   </div>

                                   <div className="flex gap-1.5 md:gap-2 w-full md:w-auto mt-1.5 md:mt-0">
                                      <button
                                        onClick={() => aiCorrectQuestion(activeQ.id)}
                                        disabled={!isAnswered || (aiResult && aiResult.loading)}
                                        className="flex-1 md:flex-none px-3 md:px-5 py-1.5 md:py-2 rounded-lg font-bold text-[10px] md:text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md shadow-purple-200 hover:opacity-90 hover:scale-105 transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                                      >
                                        {aiResult?.loading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                        AI Correct
                                      </button>

                                      {isLastQuestion ? (
                                        <button
                                          onClick={aiCorrectAllQuestions}
                                          disabled={isSubmittingAll}
                                          className="flex-1 md:flex-none px-3 md:px-5 py-1.5 md:py-2 rounded-lg font-bold text-[10px] md:text-xs bg-gradient-to-r from-[#00A0E3] to-[#0060A9] text-white shadow-md shadow-blue-200 hover:opacity-90 transition-all whitespace-nowrap disabled:opacity-60 flex items-center justify-center gap-1.5"
                                        >
                                          {isSubmittingAll ? <Loader2 size={12} className="animate-spin" /> : <ClipboardCheck size={12} />}
                                          Submit All for AI Correct
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => {
                                             if (activeIdx < practiceQuestions.length - 1) setActivePracticeQuestionId(practiceQuestions[activeIdx + 1].id);
                                          }}
                                          className="flex-1 md:flex-none px-3 md:px-5 py-1.5 md:py-2 rounded-lg font-bold text-[10px] md:text-xs bg-[#00A0E3] text-white hover:bg-[#008bc5] shadow-md shadow-blue-200 transition-all whitespace-nowrap"
                                        >
                                          Next
                                        </button>
                                      )}
                                   </div>
                                </div>
                             </div>
                           );
                         })()}
                      </div>
                   )}
                </div>
             </div>
            )
          ) : (
            <>
              {activeTab === 'overview' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  {/* Progress Banner & Practice Config - Kept same as previous */}
                  <div className="bg-gradient-to-r from-[#0060A9] to-[#00A0E3] rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl shadow-blue-200 group">
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                           <span className="px-3 py-1 bg-white/20 rounded-lg text-xs font-bold backdrop-blur-md border border-white/10 shadow-sm">Week 2 in progress</span>
                           <div className="animate-bounce"><Sparkles size={16} className="text-yellow-300 fill-yellow-300" /></div>
                        </div>
                        <h3 className="text-4xl font-black mb-3 tracking-tight">Resume Week 2</h3>
                        <p className="text-blue-50 mb-8 max-w-lg leading-relaxed text-lg font-light">Master Zero-shot and Few-shot prompting techniques.</p>
                        <button onClick={() => setActiveTab('curriculum')} className="bg-white text-[#0060A9] px-8 py-3.5 rounded-2xl font-bold text-sm hover:bg-blue-50 hover:shadow-xl hover:-translate-y-1 transition-all shadow-lg flex items-center gap-2 group">
                          <PlayCircle size={20} className="group-hover:scale-110 transition-transform" /> Continue Learning
                        </button>
                      </div>
                      <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 min-w-[240px] shadow-xl">
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-4xl font-black tracking-tight">28%</span>
                          <span className="text-xs font-bold text-blue-100 mb-1 uppercase tracking-wider">Completed</span>
                        </div>
                        <div className="w-full bg-black/20 h-2.5 rounded-full overflow-hidden mb-4">
                          <div className="bg-white h-full rounded-full w-[28%] shadow-[0_0_15px_rgba(255,255,255,0.8)] relative overflow-hidden">
                            <div className="absolute inset-0 bg-white/30 animate-[shimmer_2s_infinite] skew-x-12"></div>
                          </div>
                        </div>
                        <div className="flex justify-between text-xs font-medium text-blue-100">
                           <span>12 Hours Done</span>
                           <span>35 Hours Total</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                      <div className="flex items-center justify-between mb-4">
                          <div>
                              <h3 className="text-base font-bold text-slate-800">AI Skill Practice</h3>
                              <p className="text-slate-400 text-xs font-medium">Customize your training session</p>
                          </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                          <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"><BarChart size={11} /> Level</label>
                              <div className="relative">
                                   <select value={practiceConfig.proficiency} onChange={(e) => setPracticeConfig({...practiceConfig, proficiency: e.target.value})} className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium cursor-pointer">
                                      <option>Beginner (Foundations)</option>
                                      <option>Intermediate (Applied)</option>
                                      <option>Advanced (Research)</option>
                                   </select>
                                   <ChevronRight className="absolute right-2.5 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" size={12} />
                              </div>
                          </div>
                          <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"><Database size={11} /> Domain</label>
                              <div className="relative">
                                   <select value={practiceConfig.domain} onChange={(e) => setPracticeConfig({...practiceConfig, domain: e.target.value, topic: 'All Topics'})} className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium cursor-pointer">
                                      {practiceDomains.map((domain, i) => (<option key={i} value={domain}>{domain}</option>))}
                                   </select>
                                   <ChevronRight className="absolute right-2.5 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" size={12} />
                              </div>
                          </div>
                          <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"><Layers size={11} /> Topics</label>
                              <div className="relative">
                                 <select value={practiceConfig.topic} onChange={(e) => setPracticeConfig({...practiceConfig, topic: e.target.value})} className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium cursor-pointer">
                                    <option>All Topics</option>
                                    {practiceTopics.map((topic, i) => (<option key={i} value={topic}>{topic}</option>))}
                                 </select>
                                 <ChevronRight className="absolute right-2.5 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" size={12} />
                              </div>
                          </div>
                          <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"><HelpCircle size={11} /> Mode</label>
                              <div className="relative">
                                   <select value={practiceConfig.mode} onChange={(e) => setPracticeConfig({...practiceConfig, mode: e.target.value})} className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium cursor-pointer">
                                      <option>Multiple Choice Quiz</option>
                                      <option>Code Challenge</option>
                                      <option>Scenario Analysis</option>
                                      <option>Prompt Engineering Drill</option>
                                   </select>
                                   <ChevronRight className="absolute right-2.5 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" size={12} />
                              </div>
                          </div>
                      </div>
                      <div className="flex justify-center">
                          <button onClick={startPracticeSession} className="bg-gradient-to-r from-[#00A0E3] to-[#0060A9] text-white px-8 py-2.5 rounded-xl font-bold text-xs hover:shadow-lg hover:-translate-y-0.5 transition-all shadow-md shadow-blue-200 flex items-center gap-2">
                              <Rocket size={16} /> LET'S BEGIN
                          </button>
                      </div>
                  </div>
                </div>
              )}
              {activeTab === 'curriculum' && (
                <Curriculum weeks={courseData.weeks} setActiveVideo={setActiveVideo!} />
              )}
              {activeTab === 'ailab' && (
                <AILab />
              )}
              {activeTab === 'projects' && (
                <Projects projects={courseData.projects} selectedProject={selectedProject} setSelectedProject={setSelectedProject} />
              )}
              {activeTab === 'assessments' && (
                <Assessments />
              )}
              {activeTab === 'exammode' && (
                <ExamMode />
              )}
              {activeTab === 'orcaai' && (
                <OrcaAIPage />
              )}
              {activeTab === 'progress' && (
                <Progress />
              )}
              {activeTab === 'certificates' && (
                <Certificates onResumeLearning={() => setActiveTab('curriculum')} />
              )}
            </>
          )}
        </main>
      </div>

      {/* OrcaAI Chatbot - Hidden during Exam Mode */}
      {activeTab !== 'exammode' && <OrcaAI />}
    </div>
  );
};

export default Dashboard;