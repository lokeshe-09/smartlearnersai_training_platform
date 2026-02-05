import React, { useState, useEffect } from 'react';
import {
  FileCode,
  Upload,
  CheckCircle,
  Cpu,
  BrainCircuit,
  Code,
  ListOrdered,
  X,
  Eye,
  Copy,
  Check,
  ChevronRight,
  Play,
  FileJson,
  ArrowLeft,
  Download,
  AlertTriangle,
  Lightbulb,
  Target,
  TrendingUp,
  BookOpen,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Sparkles,
  Loader2
} from 'lucide-react';
import { aiAPI, GradingResult, RequirementAnalysis } from '../services/api';

// ============================================
// TYPE DEFINITIONS
// ============================================
interface LabAssignment {
  id: number;
  title: string;
  category: 'Basic ML' | 'GenAI' | 'Time Series';
  description: string;
  requirements: string[];
  status: 'Pending' | 'Analyzing' | 'Completed';
  score?: number;
  gradingResult?: GradingResult;
  submittedCode?: string;
  submittedFileName?: string;
  submittedAt?: string;
}

interface NotebookCell {
  index: number;
  type: 'code' | 'markdown' | 'raw';
  source: string;
  executionCount: number | null;
  outputs: CellOutput[];
}

interface CellOutput {
  outputType: string;
  content: OutputContent[];
}

interface OutputContent {
  type: 'stream' | 'text' | 'image' | 'html' | 'error';
  text?: string;
  html?: string;
  data?: string;
  mimeType?: string;
  ename?: string;
  evalue?: string;
  traceback?: string[];
}

interface ExtractedFile {
  fileName: string;
  fileType: 'py' | 'ipynb';
  fileSize: number;
  rawContent: string;
  cells?: NotebookCell[];
  notebookInfo?: {
    totalCells: number;
    codeCells: number;
    markdownCells: number;
  };
}

// ============================================
// FILE EXTRACTION FUNCTIONS
// ============================================
const extractPyContent = async (file: File): Promise<ExtractedFile> => {
  const content = await file.text();
  return {
    fileName: file.name,
    fileType: 'py',
    fileSize: file.size,
    rawContent: content
  };
};

const extractIpynbContent = async (file: File): Promise<ExtractedFile> => {
  const text = await file.text();
  const notebook = JSON.parse(text);

  let rawContent = '';
  const cells: NotebookCell[] = [];
  let codeCells = 0;
  let markdownCells = 0;

  for (let idx = 0; idx < (notebook.cells || []).length; idx++) {
    const cell = notebook.cells[idx];
    const cellType = cell.cell_type || 'unknown';
    const executionCount = cell.execution_count || null;

    let source = cell.source || '';
    if (Array.isArray(source)) {
      source = source.join('');
    }

    if (cellType === 'code') codeCells++;
    if (cellType === 'markdown') markdownCells++;

    rawContent += source;
    if (source && !source.endsWith('\n')) {
      rawContent += '\n';
    }

    const outputs: CellOutput[] = [];

    for (const output of (cell.outputs || [])) {
      const outputType = output.output_type || 'unknown';
      const content: OutputContent[] = [];

      if (outputType === 'stream') {
        let textOut = output.text || '';
        if (Array.isArray(textOut)) {
          textOut = textOut.join('');
        }
        content.push({ type: 'stream', text: textOut });
        rawContent += textOut;
      }
      else if (outputType === 'execute_result' || outputType === 'display_data') {
        const data = output.data || {};

        for (const mimeType of ['image/png', 'image/jpeg', 'image/gif', 'image/svg+xml']) {
          if (data[mimeType]) {
            let imgData = data[mimeType];
            if (Array.isArray(imgData)) {
              imgData = imgData.join('');
            }
            content.push({ type: 'image', data: imgData, mimeType });
          }
        }

        if (data['text/plain']) {
          let plain = data['text/plain'];
          if (Array.isArray(plain)) {
            plain = plain.join('');
          }
          content.push({ type: 'text', text: plain });
          rawContent += plain + '\n';
        }

        if (data['text/html']) {
          let html = data['text/html'];
          if (Array.isArray(html)) {
            html = html.join('');
          }
          content.push({ type: 'html', html });
        }
      }
      else if (outputType === 'error') {
        const ename = output.ename || '';
        const evalue = output.evalue || '';
        const traceback = (output.traceback || []).map((tb: string) =>
          tb.replace(/\x1b\[[0-9;]*m/g, '')
        );
        content.push({ type: 'error', ename, evalue, traceback });
        rawContent += traceback.join('\n') + '\n';
      }

      if (content.length > 0) {
        outputs.push({ outputType, content });
      }
    }

    cells.push({
      index: idx + 1,
      type: cellType as 'code' | 'markdown' | 'raw',
      source,
      executionCount,
      outputs
    });
  }

  return {
    fileName: file.name,
    fileType: 'ipynb',
    fileSize: file.size,
    rawContent,
    cells,
    notebookInfo: {
      totalCells: cells.length,
      codeCells,
      markdownCells
    }
  };
};

// ============================================
// CODE PREVIEW COMPONENT
// ============================================
interface CodePreviewProps {
  extractedFile: ExtractedFile;
  onClose: () => void;
  onSubmit: () => void;
  labTitle: string;
  isSubmitting: boolean;
}

const CodePreview: React.FC<CodePreviewProps> = ({ extractedFile, onClose, onSubmit, labTitle, isSubmitting }) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'raw'>('preview');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(extractedFile.rawContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([extractedFile.rawContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${extractedFile.fileName}_raw.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-6xl mx-4 h-[90vh] bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-200 p-6 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-500 hover:text-slate-700 disabled:opacity-50"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                {extractedFile.fileType === 'ipynb' ? <FileJson size={20} className="text-orange-500" /> : <FileCode size={20} className="text-blue-500" />}
                {extractedFile.fileName}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {extractedFile.fileType === 'ipynb'
                  ? `Jupyter Notebook • ${extractedFile.notebookInfo?.totalCells} cells (${extractedFile.notebookInfo?.codeCells} code, ${extractedFile.notebookInfo?.markdownCells} markdown)`
                  : `Python File • ${(extractedFile.fileSize / 1024).toFixed(1)} KB`
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold transition-colors disabled:opacity-50"
            >
              {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={handleDownload}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold transition-colors disabled:opacity-50"
            >
              <Download size={16} />
              Download
            </button>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600 disabled:opacity-50"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-white px-6 flex-shrink-0">
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-2 px-6 py-4 font-bold text-sm border-b-2 transition-colors ${
              activeTab === 'preview'
                ? 'text-[#00A0E3] border-[#00A0E3]'
                : 'text-slate-400 border-transparent hover:text-slate-600'
            }`}
          >
            <Eye size={18} />
            Preview
          </button>
          <button
            onClick={() => setActiveTab('raw')}
            className={`flex items-center gap-2 px-6 py-4 font-bold text-sm border-b-2 transition-colors ${
              activeTab === 'raw'
                ? 'text-[#00A0E3] border-[#00A0E3]'
                : 'text-slate-400 border-transparent hover:text-slate-600'
            }`}
          >
            <Code size={18} />
            Raw Code
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50">
          {activeTab === 'preview' ? (
            <div className="p-6 space-y-4">
              {extractedFile.fileType === 'py' ? (
                <div className="bg-slate-900 rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
                    <span className="text-slate-400 text-xs font-mono">{extractedFile.fileName}</span>
                    <span className="text-slate-500 text-xs">Python</span>
                  </div>
                  <pre className="p-6 overflow-x-auto text-sm">
                    <code className="text-slate-100 font-mono whitespace-pre-wrap">{extractedFile.rawContent}</code>
                  </pre>
                </div>
              ) : (
                extractedFile.cells?.map((cell, idx) => (
                  <div key={idx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          cell.type === 'code' ? 'bg-blue-100 text-blue-700' :
                          cell.type === 'markdown' ? 'bg-green-100 text-green-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {cell.type}
                        </span>
                        <span className="text-slate-400 text-xs">Cell {cell.index}</span>
                      </div>
                      {cell.executionCount && (
                        <span className="text-slate-400 text-xs font-mono">[{cell.executionCount}]</span>
                      )}
                    </div>
                    <div className="p-4">
                      {cell.type === 'code' ? (
                        <pre className="bg-slate-900 rounded-xl p-4 overflow-x-auto">
                          <code className="text-slate-100 font-mono text-sm whitespace-pre-wrap">{cell.source}</code>
                        </pre>
                      ) : cell.type === 'markdown' ? (
                        <div className="prose prose-slate prose-sm max-w-none">
                          <pre className="bg-slate-50 p-4 rounded-xl text-slate-700 whitespace-pre-wrap font-sans text-sm">{cell.source}</pre>
                        </div>
                      ) : (
                        <pre className="text-slate-600 text-sm whitespace-pre-wrap">{cell.source}</pre>
                      )}
                    </div>
                    {cell.outputs.length > 0 && (
                      <div className="border-t border-slate-200 bg-slate-50 p-4 space-y-3">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                          <ChevronRight size={14} />
                          Output
                        </div>
                        {cell.outputs.map((output, outIdx) => (
                          <div key={outIdx}>
                            {output.content.map((content, cIdx) => (
                              <div key={cIdx}>
                                {content.type === 'stream' || content.type === 'text' ? (
                                  <pre className="bg-white border border-slate-200 rounded-xl p-4 text-slate-700 text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                                    {content.text}
                                  </pre>
                                ) : content.type === 'image' && content.data ? (
                                  <div className="bg-white border border-slate-200 rounded-xl p-4">
                                    <img
                                      src={`data:${content.mimeType || 'image/png'};base64,${content.data}`}
                                      alt="Output"
                                      className="max-w-full rounded-lg"
                                    />
                                  </div>
                                ) : content.type === 'html' && content.html ? (
                                  <div
                                    className="bg-white border border-slate-200 rounded-xl p-4 overflow-x-auto"
                                    dangerouslySetInnerHTML={{ __html: content.html }}
                                  />
                                ) : content.type === 'error' ? (
                                  <pre className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                                    {content.ename}: {content.evalue}
                                    {'\n'}
                                    {content.traceback?.join('\n')}
                                  </pre>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="p-6">
              <div className="bg-slate-900 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
                  <span className="text-slate-400 text-xs font-mono">Raw Content</span>
                  <span className="text-slate-500 text-xs">{extractedFile.rawContent.split('\n').length} lines</span>
                </div>
                <pre className="p-6 overflow-x-auto max-h-[60vh]">
                  <code className="text-slate-100 font-mono text-sm whitespace-pre-wrap">{extractedFile.rawContent}</code>
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-slate-200 p-6 flex justify-between items-center flex-shrink-0">
          <div>
            <p className="text-sm text-slate-500">Submitting for: <span className="font-bold text-slate-700">{labTitle}</span></p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={isSubmitting}
              className="px-8 py-3 rounded-xl font-bold bg-gradient-to-r from-[#00A0E3] to-[#0060A9] text-white shadow-lg shadow-blue-200 hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Submit for AI Grading
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// SUBMITTED CODE VIEWER COMPONENT
// ============================================
interface SubmittedCodeViewerProps {
  code: string;
  fileName: string;
  submittedAt: string;
  labTitle: string;
  onClose: () => void;
}

const SubmittedCodeViewer: React.FC<SubmittedCodeViewerProps> = ({ code, fileName, submittedAt, labTitle, onClose }) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'raw'>('preview');
  const [copied, setCopied] = useState(false);

  const isNotebook = fileName.toLowerCase().endsWith('.ipynb');
  const formattedDate = new Date(submittedAt).toLocaleString();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-5xl mx-4 h-[85vh] bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 p-6 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-500 hover:text-slate-700"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                {isNotebook ? <FileJson size={20} className="text-orange-500" /> : <FileCode size={20} className="text-blue-500" />}
                {fileName}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Submitted for <span className="text-slate-700">{labTitle}</span> • {formattedDate}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold transition-colors"
            >
              {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold transition-colors"
            >
              <Download size={16} />
              Download
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-white px-6 flex-shrink-0">
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-2 px-6 py-4 font-bold text-sm border-b-2 transition-colors ${
              activeTab === 'preview'
                ? 'text-[#00A0E3] border-[#00A0E3]'
                : 'text-slate-400 border-transparent hover:text-slate-600'
            }`}
          >
            <Eye size={18} />
            Preview
          </button>
          <button
            onClick={() => setActiveTab('raw')}
            className={`flex items-center gap-2 px-6 py-4 font-bold text-sm border-b-2 transition-colors ${
              activeTab === 'raw'
                ? 'text-[#00A0E3] border-[#00A0E3]'
                : 'text-slate-400 border-transparent hover:text-slate-600'
            }`}
          >
            <Code size={18} />
            Raw Code
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
          {activeTab === 'preview' ? (
            <div className="bg-slate-900 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
                <span className="text-slate-400 text-xs font-mono">{fileName}</span>
                <span className="text-slate-500 text-xs">{isNotebook ? 'Jupyter Notebook' : 'Python'}</span>
              </div>
              <pre className="p-6 overflow-x-auto max-h-[calc(85vh-250px)]">
                <code className="text-slate-100 font-mono text-sm whitespace-pre-wrap">{code}</code>
              </pre>
            </div>
          ) : (
            <div className="bg-slate-900 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
                <span className="text-slate-400 text-xs font-mono">Raw Content</span>
                <span className="text-slate-500 text-xs">{code.split('\n').length} lines</span>
              </div>
              <pre className="p-6 overflow-x-auto max-h-[calc(85vh-250px)]">
                <code className="text-slate-100 font-mono text-sm whitespace-pre-wrap">{code}</code>
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-slate-200 p-4 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// REQUIREMENT STATUS ICON COMPONENT
// ============================================
const RequirementStatusIcon: React.FC<{ status: string }> = ({ status }) => {
  if (status === 'met') {
    return <CheckCircle2 size={18} className="text-green-500" />;
  } else if (status === 'partial') {
    return <MinusCircle size={18} className="text-yellow-500" />;
  } else {
    return <XCircle size={18} className="text-red-500" />;
  }
};

// ============================================
// DEFAULT ASSIGNMENTS DATA
// ============================================
const defaultAssignments: LabAssignment[] = [
    {
      id: 1,
      title: "Iris Flower Classification",
      category: "Basic ML",
      description: "Build a multi-class classification model using Scikit-Learn to classify Iris flowers into three species (Setosa, Versicolor, Virginica) based on sepal and petal measurements.",
      requirements: [
        "Load Iris dataset and perform exploratory data analysis",
        "Split data into training and testing sets (70/30)",
        "Train at least two classifiers (e.g., Logistic Regression, Decision Tree, or SVM)",
        "Compare model performance using accuracy, precision, recall, and confusion matrix"
      ],
      status: "Pending"
    },
    {
      id: 2,
      title: "Predicting Housing Prices",
      category: "Basic ML",
      description: "Implement a Linear Regression model to predict housing prices based on square footage and number of bedrooms. You must use Scikit-Learn.",
      requirements: [
        "Load the provided dataset",
        "Perform 80/20 train-test split",
        "Calculate RMSE and R² score",
        "Visualize the regression line"
      ],
      status: "Pending"
    },
    {
      id: 3,
      title: "Stock Price Forecasting",
      category: "Time Series",
      description: "Use an LSTM (Long Short-Term Memory) network to forecast the next day's closing price of a stock using historical data.",
      requirements: [
        "Preprocess data using MinMaxScaler",
        "Create sequences for time series input",
        "Build an LSTM model with Keras",
        "Visualize predicted vs actual prices"
      ],
      status: "Pending"
    },
    {
      id: 4,
      title: "Build a PDF Chatbot",
      category: "GenAI",
      description: "Create a simple RAG application that can answer questions from a provided PDF document using LangChain and OpenAI/Gemini.",
      requirements: [
        "Extract text from PDF",
        "Split text into chunks",
        "Create embeddings and store in vector store",
        "Implement retrieval chain"
      ],
      status: "Pending"
    },
    {
      id: 5,
      title: "Sentiment Analysis on Movie Reviews",
      category: "Basic ML",
      description: "Train a Naive Bayes classifier to categorize movie reviews as positive or negative using the IMDB dataset.",
      requirements: [
        "Text preprocessing (tokenization, stop words)",
        "Convert text to TF-IDF vectors",
        "Train MultinomialNB model",
        "Report confusion matrix and F1-score"
      ],
      status: "Pending"
    },
    {
      id: 6,
      title: "Fine-tune a Small Language Model",
      category: "GenAI",
      description: "Fine-tune a small open-source model (like TinyLlama or GPT-2) on a specific dataset of quotes or jokes.",
      requirements: [
        "Prepare dataset in JSONL format",
        "Use Hugging Face Trainer API",
        "Implement LoRA (Low-Rank Adaptation)",
        "Generate sample outputs from tuned model"
      ],
      status: "Pending"
    },
    {
      id: 7,
      title: "AI Ethics Analyzer",
      category: "GenAI",
      description: "Build a script that evaluates a prompt for potential bias or toxicity using a safety classifier model.",
      requirements: [
        "Input various test prompts",
        "Classify toxicity levels",
        "Flag high-risk content",
        "Generate a safety report"
      ],
      status: "Pending"
    },
    {
      id: 8,
      title: "Weather Temperature Forecasting",
      category: "Time Series",
      description: "Predict daily maximum temperatures for the next 7 days using historical weather data and ARIMA or Prophet models.",
      requirements: [
        "Analyze stationarity of the time series",
        "Decompose series into trend and seasonality",
        "Fit ARIMA or Facebook Prophet model",
        "Calculate MAPE (Mean Absolute Percentage Error)"
      ],
      status: "Pending"
    },
    {
      id: 9,
      title: "Prompt Engineering Playground",
      category: "GenAI",
      description: "Develop a script that automatically optimizes a user's prompt using iterative refinement techniques with an LLM.",
      requirements: [
        "Create a base prompt evaluation metric",
        "Implement a loop to rewrite prompts",
        "Compare outputs of original vs optimized prompt",
        "Store history of prompt versions"
      ],
      status: "Pending"
    },
    {
      id: 10,
      title: "Customer Churn Prediction",
      category: "Basic ML",
      description: "Build a classification model (Random Forest or XGBoost) to identify customers likely to cancel their subscription.",
      requirements: [
        "Handle imbalanced dataset (SMOTE)",
        "Perform feature engineering on customer logs",
        "Train XGBoost classifier",
        "Plot Feature Importance graph"
      ],
      status: "Pending"
    },
    {
      id: 11,
      title: "Simple Vector Search Engine",
      category: "GenAI",
      description: "Implement a semantic search engine from scratch using NumPy cosine similarity without external vector databases.",
      requirements: [
        "Generate embeddings for a list of sentences",
        "Implement cosine similarity function manually",
        "Return top-k most similar sentences for a query",
        "Benchmark speed against linear search"
      ],
      status: "Pending"
    }
];

// ============================================
// MAIN AI LAB COMPONENT
// ============================================
const AILab: React.FC = () => {
  const [selectedLab, setSelectedLab] = useState<LabAssignment | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [extractedFile, setExtractedFile] = useState<ExtractedFile | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(true);
  const [assignments, setAssignments] = useState<LabAssignment[]>(defaultAssignments);
  const [showSubmittedCode, setShowSubmittedCode] = useState(false);

  // Fetch saved submissions on component mount
  useEffect(() => {
    const loadSavedSubmissions = async () => {
      setIsLoadingSubmissions(true);
      try {
        const response = await aiAPI.getUserSubmissions();

        if (response.success && response.submissions && response.submissions.length > 0) {
          // Create a map of lab_id to submission data
          const submissionMap = new Map<string, any>();
          response.submissions.forEach(sub => {
            submissionMap.set(sub.lab_id, sub);
          });

          // Merge submissions with default assignments
          const updatedAssignments = defaultAssignments.map(assignment => {
            const labId = `lab_${assignment.id}`;
            const submission = submissionMap.get(labId);

            if (submission) {
              return {
                ...assignment,
                status: 'Completed' as const,
                score: submission.overall_score,
                gradingResult: submission.grading_result as GradingResult,
                submittedCode: submission.code_content,
                submittedFileName: submission.file_name,
                submittedAt: submission.submitted_at
              };
            }
            return assignment;
          });

          setAssignments(updatedAssignments);

          // Update selectedLab if it was previously selected and has submission data
          if (selectedLab) {
            const updatedSelectedLab = updatedAssignments.find(a => a.id === selectedLab.id);
            if (updatedSelectedLab) {
              setSelectedLab(updatedSelectedLab);
            }
          }
        }
      } catch (error) {
        console.error('Error loading saved submissions:', error);
      } finally {
        setIsLoadingSubmissions(false);
      }
    };

    loadSavedSubmissions();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedLab || !e.target.files?.length) return;

    const file = e.target.files[0];
    const fileName = file.name.toLowerCase();

    if (!fileName.endsWith('.py') && !fileName.endsWith('.ipynb')) {
      setUploadError('Only .py and .ipynb files are accepted');
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      let extracted: ExtractedFile;

      if (fileName.endsWith('.ipynb')) {
        extracted = await extractIpynbContent(file);
      } else {
        extracted = await extractPyContent(file);
      }

      setExtractedFile(extracted);
      setShowPreview(true);
    } catch (error) {
      console.error('Error extracting file:', error);
      setUploadError('Failed to parse the file. Please ensure it is a valid Python or Jupyter Notebook file.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmitForGrading = async () => {
    if (!selectedLab || !extractedFile) return;

    setIsSubmitting(true);

    // Prepare cells info for API
    const cellsInfo = extractedFile.cells?.map(cell => ({
      index: cell.index,
      type: cell.type,
      source: cell.source,
      executionCount: cell.executionCount,
      outputs: cell.outputs
    })) || undefined;

    // Generate unique lab_id for database storage
    const labId = `lab_${selectedLab.id}`;

    // Call AI grading API with lab_id and file_name
    const response = await aiAPI.gradeSubmission(
      labId,
      {
        title: selectedLab.title,
        category: selectedLab.category,
        description: selectedLab.description,
        requirements: selectedLab.requirements
      },
      extractedFile.rawContent,
      extractedFile.fileName,
      cellsInfo
    );

    setIsSubmitting(false);
    setShowPreview(false);

    if (response.success && response.grading_result) {
      const result = response.grading_result;

      const completedLab: LabAssignment = {
        ...selectedLab,
        status: 'Completed',
        score: result.overall_score,
        gradingResult: result,
        submittedCode: extractedFile.rawContent,
        submittedFileName: extractedFile.fileName,
        submittedAt: new Date().toISOString()
      };

      setAssignments(prev => prev.map(a => a.id === selectedLab.id ? completedLab : a));
      setSelectedLab(completedLab);
    } else {
      // Handle error - show with mock grading as fallback
      const completedLab: LabAssignment = {
        ...selectedLab,
        status: 'Completed',
        score: 0,
        gradingResult: {
          success: false,
          overall_score: 0,
          code_quality: 0,
          accuracy: 0,
          efficiency: 0,
          requirements_analysis: [],
          strengths: [],
          areas_for_improvement: ['Unable to complete AI analysis'],
          detailed_feedback: response.message || 'An error occurred during grading. Please try again.',
          code_suggestions: [],
          learning_resources: [],
          error: response.message
        },
        submittedCode: extractedFile.rawContent,
        submittedFileName: extractedFile.fileName,
        submittedAt: new Date().toISOString()
      };

      setAssignments(prev => prev.map(a => a.id === selectedLab.id ? completedLab : a));
      setSelectedLab(completedLab);
    }

    setExtractedFile(null);
  };

  const closePreview = () => {
    if (!isSubmitting) {
      setShowPreview(false);
      setExtractedFile(null);
    }
  };

  return (
    <div className="h-full animate-in fade-in slide-in-from-bottom-4 duration-700 flex flex-col">
      {/* Preview Modal */}
      {showPreview && extractedFile && selectedLab && (
        <CodePreview
          extractedFile={extractedFile}
          onClose={closePreview}
          onSubmit={handleSubmitForGrading}
          labTitle={selectedLab.title}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Submitted Code Viewer Modal */}
      {showSubmittedCode && selectedLab?.submittedCode && selectedLab?.submittedFileName && (
        <SubmittedCodeViewer
          code={selectedLab.submittedCode}
          fileName={selectedLab.submittedFileName}
          submittedAt={selectedLab.submittedAt || new Date().toISOString()}
          labTitle={selectedLab.title}
          onClose={() => setShowSubmittedCode(false)}
        />
      )}

      <div className="mb-8 flex-shrink-0">
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">AI Lab</h2>
        <p className="text-slate-500 font-medium">Hands-on coding challenges with automated AI grading</p>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
        {/* Assignment List */}
        <div className="lg:w-1/3 overflow-y-auto space-y-4 pr-2 pb-10">
          {isLoadingSubmissions ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <Loader2 size={32} className="text-[#00A0E3] animate-spin" />
                <p className="text-slate-500 text-sm font-medium">Loading your submissions...</p>
              </div>
            </div>
          ) : assignments.map(lab => (
            <button
              key={lab.id}
              onClick={() => setSelectedLab(lab)}
              className={`w-full text-left p-6 rounded-3xl border transition-all duration-300 relative overflow-hidden group
                ${selectedLab?.id === lab.id
                  ? 'bg-slate-800 text-white border-slate-800 shadow-xl scale-[1.02]'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:shadow-md'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border
                  ${selectedLab?.id === lab.id ? 'bg-white/20 text-white border-white/20' :
                    lab.category === 'GenAI' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                    lab.category === 'Time Series' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                    'bg-blue-50 text-blue-600 border-blue-100'}`}>
                  {lab.category === 'Basic ML' ? 'ML' : lab.category}
                </span>
                {lab.status === 'Completed' && (
                  <div className="bg-green-500 text-white p-1 rounded-full">
                    <CheckCircle size={14} />
                  </div>
                )}
              </div>
              <h3 className="font-bold text-lg mb-2 leading-tight">{lab.title}</h3>
              <p className={`text-xs font-medium ${selectedLab?.id === lab.id ? 'text-slate-400' : 'text-slate-400'}`}>
                {lab.status === 'Completed' ? `Score: ${lab.score}/100` : 'Not Attempted'}
              </p>
            </button>
          ))}
        </div>

        {/* Detail View */}
        <div className="lg:w-2/3 bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden flex flex-col relative">
          {selectedLab ? (
            selectedLab.status === 'Analyzing' ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <div className="relative mb-8">
                  <div className="w-24 h-24 rounded-full border-4 border-slate-100 border-t-[#00A0E3] animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Cpu size={32} className="text-[#00A0E3] animate-pulse" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">AI Analysis in Progress</h3>
                <p className="text-slate-500 max-w-sm">
                  Our AI engine is evaluating your code structure, output accuracy, and efficiency metrics.
                </p>
              </div>
            ) : selectedLab.status === 'Completed' && selectedLab.gradingResult ? (
              // AI Grading Results View
              <div className="flex-1 overflow-y-auto p-8 lg:p-10 animate-in fade-in slide-in-from-right-8 duration-500">
                {/* Assignment Question Section */}
                <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-2xl p-6 mb-8 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border
                      ${selectedLab.category === 'GenAI' ? 'bg-purple-50 text-purple-600 border-purple-200' :
                        selectedLab.category === 'Time Series' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                        'bg-blue-50 text-blue-600 border-blue-200'}`}>
                      {selectedLab.category === 'Basic ML' ? 'ML' : selectedLab.category}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">Assignment</span>
                  </div>
                  <h2 className="text-xl font-black text-slate-800 mb-3">{selectedLab.title}</h2>
                  <p className="text-slate-600 text-sm leading-relaxed mb-4">{selectedLab.description}</p>

                  <div className="border-t border-slate-200 pt-4">
                    <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2 text-sm">
                      <ListOrdered size={16} className="text-slate-400" /> Requirements
                    </h4>
                    <ul className="space-y-2">
                      {selectedLab.requirements.map((req, i) => (
                        <li key={i} className="flex items-start gap-2 text-slate-600 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#00A0E3] mt-1.5 flex-shrink-0"></div>
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Score Header */}
                <div className="flex items-center gap-6 mb-8">
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg ${
                    selectedLab.score && selectedLab.score >= 80 ? 'bg-gradient-to-br from-green-400 to-green-600' :
                    selectedLab.score && selectedLab.score >= 60 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                    'bg-gradient-to-br from-red-400 to-red-600'
                  }`}>
                    <span className="text-3xl font-black text-white">{selectedLab.score}</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wide">Overall Score</h3>
                    <div className="text-2xl font-black text-slate-800">Grading Results</div>
                  </div>
                </div>

                {/* Score Breakdown */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-2xl border border-blue-200 text-center">
                    <div className="text-xs font-bold text-blue-500 uppercase mb-1">Code Quality</div>
                    <div className="text-2xl font-black text-blue-700">{selectedLab.gradingResult.code_quality}%</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-2xl border border-purple-200 text-center">
                    <div className="text-xs font-bold text-purple-500 uppercase mb-1">Accuracy</div>
                    <div className="text-2xl font-black text-purple-700">{selectedLab.gradingResult.accuracy}%</div>
                  </div>
                  <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-4 rounded-2xl border border-teal-200 text-center">
                    <div className="text-xs font-bold text-teal-500 uppercase mb-1">Efficiency</div>
                    <div className="text-2xl font-black text-teal-700">{selectedLab.gradingResult.efficiency}%</div>
                  </div>
                </div>

                {/* AI Feedback */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-2xl border border-slate-200 mb-6">
                  <h4 className="font-bold text-slate-800 mb-3">
                    AI Feedback
                  </h4>
                  <p className="text-slate-600 leading-relaxed">
                    {selectedLab.gradingResult.detailed_feedback}
                  </p>
                </div>

                {/* Requirements Analysis */}
                {selectedLab.gradingResult.requirements_analysis && selectedLab.gradingResult.requirements_analysis.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Target size={20} className="text-slate-400" /> Requirements Analysis
                    </h4>
                    <div className="space-y-3">
                      {selectedLab.gradingResult.requirements_analysis.map((req, idx) => (
                        <div key={idx} className={`p-4 rounded-xl border ${
                          req.status === 'met' ? 'bg-green-50 border-green-200' :
                          req.status === 'partial' ? 'bg-yellow-50 border-yellow-200' :
                          'bg-red-50 border-red-200'
                        }`}>
                          <div className="flex items-start gap-3">
                            <RequirementStatusIcon status={req.status} />
                            <div className="flex-1">
                              <p className={`font-bold text-sm ${
                                req.status === 'met' ? 'text-green-800' :
                                req.status === 'partial' ? 'text-yellow-800' :
                                'text-red-800'
                              }`}>
                                {req.requirement}
                              </p>
                              <p className={`text-xs mt-1 ${
                                req.status === 'met' ? 'text-green-600' :
                                req.status === 'partial' ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {req.explanation}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Strengths & Improvements */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {/* Strengths */}
                  {selectedLab.gradingResult.strengths && selectedLab.gradingResult.strengths.length > 0 && (
                    <div className="bg-green-50 p-5 rounded-2xl border border-green-200">
                      <h4 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                        <TrendingUp size={18} /> Strengths
                      </h4>
                      <ul className="space-y-2">
                        {selectedLab.gradingResult.strengths.map((strength, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-green-700">
                            <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" />
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Areas for Improvement */}
                  {selectedLab.gradingResult.areas_for_improvement && selectedLab.gradingResult.areas_for_improvement.length > 0 && (
                    <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200">
                      <h4 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
                        <AlertTriangle size={18} /> Areas to Improve
                      </h4>
                      <ul className="space-y-2">
                        {selectedLab.gradingResult.areas_for_improvement.map((area, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-amber-700">
                            <MinusCircle size={14} className="mt-0.5 flex-shrink-0" />
                            {area}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Code Suggestions */}
                {selectedLab.gradingResult.code_suggestions && selectedLab.gradingResult.code_suggestions.length > 0 && (
                  <div className="bg-blue-50 p-5 rounded-2xl border border-blue-200 mb-6">
                    <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                      <Lightbulb size={18} /> Code Suggestions
                    </h4>
                    <ul className="space-y-2">
                      {selectedLab.gradingResult.code_suggestions.map((suggestion, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-blue-700">
                          <Code size={14} className="mt-0.5 flex-shrink-0" />
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Learning Resources */}
                {selectedLab.gradingResult.learning_resources && selectedLab.gradingResult.learning_resources.length > 0 && (
                  <div className="bg-purple-50 p-5 rounded-2xl border border-purple-200 mb-6">
                    <h4 className="font-bold text-purple-800 mb-3 flex items-center gap-2">
                      <BookOpen size={18} /> Recommended Learning
                    </h4>
                    <ul className="space-y-2">
                      {selectedLab.gradingResult.learning_resources.map((resource, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-purple-700">
                          <ChevronRight size={14} className="mt-0.5 flex-shrink-0" />
                          {resource}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  {/* View Submitted Code Button */}
                  {selectedLab.submittedCode && (
                    <button
                      onClick={() => setShowSubmittedCode(true)}
                      className="flex-1 py-4 rounded-xl bg-gradient-to-r from-[#00A0E3] to-[#0060A9] text-white font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <Eye size={18} />
                      View Submitted Code
                    </button>
                  )}

                  {/* Resubmit Button */}
                  <button
                    onClick={() => setSelectedLab({...selectedLab, status: 'Pending', gradingResult: undefined, score: undefined, submittedCode: undefined, submittedFileName: undefined})}
                    className="flex-1 py-4 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors"
                  >
                    Resubmit Assignment
                  </button>
                </div>
              </div>
            ) : (
              // Pending View - Assignment Details
              <div className="flex-1 overflow-y-auto p-8 lg:p-12">
                <div className="mb-8">
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border inline-block mb-4
                    ${selectedLab.category === 'GenAI' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                      selectedLab.category === 'Time Series' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                      'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                    {selectedLab.category === 'Basic ML' ? 'ML' : selectedLab.category}
                  </span>
                  <h2 className="text-3xl font-black text-slate-800 mb-4">{selectedLab.title}</h2>
                  <p className="text-slate-600 leading-relaxed text-lg">{selectedLab.description}</p>
                </div>

                <div className="mb-8">
                  <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <ListOrdered size={20} className="text-slate-400" /> Requirements
                  </h4>
                  <ul className="space-y-3">
                    {selectedLab.requirements.map((req, i) => (
                      <li key={i} className="flex items-center gap-3 text-slate-600 font-medium">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#00A0E3]"></div>
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-slate-100 pt-8">
                  <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Upload size={20} className="text-slate-400" /> Submission
                  </h4>

                  {uploadError && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium flex items-center gap-2">
                      <X size={18} />
                      {uploadError}
                    </div>
                  )}

                  <div className={`border-2 border-dashed rounded-2xl bg-slate-50 p-8 text-center transition-all group relative
                    ${isUploading ? 'border-[#00A0E3] bg-blue-50' : 'border-slate-200 hover:border-[#00A0E3] hover:bg-blue-50/50'}`}>
                    <input
                      type="file"
                      accept=".py,.ipynb"
                      onChange={handleUpload}
                      disabled={isUploading}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                    />
                    {isUploading ? (
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <div className="w-12 h-12 border-4 border-slate-200 border-t-[#00A0E3] rounded-full animate-spin"></div>
                        </div>
                        <p className="text-slate-700 font-bold mb-1">Processing file...</p>
                        <p className="text-slate-400 text-sm">Extracting content</p>
                      </div>
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-sm mx-auto mb-4 group-hover:text-[#00A0E3] transition-colors">
                          <FileCode size={32} />
                        </div>
                        <p className="text-slate-700 font-bold mb-1">Click to upload or drag and drop</p>
                        <p className="text-slate-400 text-sm">Python (.py) or Jupyter Notebook (.ipynb) only</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <Code size={48} className="mb-4 opacity-50" />
              <p className="font-bold text-lg">Select a lab assignment to begin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AILab;
