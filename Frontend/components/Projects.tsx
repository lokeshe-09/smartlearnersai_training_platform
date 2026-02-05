import React, { useState, useRef } from 'react';
import {
  Layers,
  Clock,
  BarChart,
  Cpu,
  BrainCircuit,
  ListOrdered,
  Upload,
  X,
  FileCode,
  Loader2,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  ArrowLeft,
  Eye,
  Copy,
  Check,
  Download,
  FileJson,
  Code,
  Sparkles
} from 'lucide-react';
import { projectAPI } from '../services/api';

// Technical Definitions for the Interactive Architecture view
const techDefinitions: Record<string, string> = {
  "LLM": "Large Language Model: A deep learning algorithm that can recognize, summarize, translate, predict, and generate content.",
  "Gemini 1.5 Flash": "Google's lightweight, fast, and cost-efficient multimodal AI model.",
  "Gemini Pro": "Google's mid-sized multimodal model optimized for scaling across a wide range of tasks.",
  "REST API": "Representational State Transfer: A standard architectural style for communication between computer systems on the web.",
  "API": "Application Programming Interface: A set of rules allowing different software applications to communicate.",
  "Google Cloud": "A suite of cloud computing services offered by Google.",
  "Vertex AI": "Google Cloud's fully managed machine learning platform for building, deploying, and scaling models.",
  "RAG": "Retrieval-Augmented Generation: A technique optimizing LLM output by referencing an authoritative knowledge base.",
  "Embeddings": "Numerical representations of text, images, or audio that capture semantic meaning.",
  "Vector Database": "A specialized database designed to store and query high-dimensional vector embeddings.",
  "Pinecone": "A managed vector database infrastructure for building high-performance vector search applications.",
  "Agentic Workflow": "A system where AI agents autonomously plan, execute tools, and iterate to achieve goals.",
  "ReAct": "Reasoning + Acting: A prompting strategy enabling LLMs to generate reasoning traces and task-specific actions.",
  "Function Calling": "A capability allowing LLMs to interact with external code, databases, and APIs.",
  "Cosine similarity": "A mathematical metric used to measure how similar two vectors (and their underlying data) are."
};

const InteractiveArchitecture = ({ text }: { text: string }) => {
  const sortedKeys = Object.keys(techDefinitions).sort((a, b) => b.length - a.length);
  let parts: (string | React.ReactNode)[] = [text];
  sortedKeys.forEach(key => {
    const newParts: (string | React.ReactNode)[] = [];
    parts.forEach(part => {
      if (typeof part === 'string') {
        const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedKey})`, 'g');
        const split = part.split(regex);
        for (let i = 0; i < split.length; i++) {
           if (split[i] === key) {
             newParts.push(
               <span key={`${key}-${newParts.length}`} className="relative group inline-block cursor-help font-bold text-[#00A0E3] border-b-2 border-dotted border-[#00A0E3]/40 hover:border-[#00A0E3] transition-colors mx-0.5">
                  {split[i]}
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 p-3 bg-slate-800 text-white text-[10px] md:text-xs font-normal rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-2xl z-50 pointer-events-none text-center leading-relaxed transform group-hover:-translate-y-1">
                     <span className="block font-bold mb-0.5 text-[#00A0E3] text-xs">{key}</span>
                     {techDefinitions[key]}
                     <span className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800"></span>
                  </span>
               </span>
             );
           } else if (split[i]) {
             newParts.push(split[i]);
           }
        }
      } else {
        newParts.push(part);
      }
    });
    parts = newParts;
  });
  return <p className="text-slate-600 leading-relaxed text-xs md:text-sm">{parts}</p>;
};

interface Project {
  id: number;
  title: string;
  type: string;
  difficulty: string;
  estimatedTime: string;
  techStack: string[];
  desc: string;
  color: string;
  lightColor: string;
  architecture: string;
  steps: string[];
}

// ============================================
// NOTEBOOK TYPES (same as AI Lab)
// ============================================
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
const extractPyFile = (name: string, fileContent: string, size: number): ExtractedFile => ({
  fileName: name,
  fileType: 'py',
  fileSize: size,
  rawContent: fileContent,
});

const extractIpynbFile = (name: string, fileContent: string, size: number): ExtractedFile => {
  const notebook = JSON.parse(fileContent);
  let rawContent = '';
  const cells: NotebookCell[] = [];
  let codeCells = 0;
  let markdownCells = 0;

  for (let idx = 0; idx < (notebook.cells || []).length; idx++) {
    const cell = notebook.cells[idx];
    const cellType = cell.cell_type || 'unknown';
    const executionCount = cell.execution_count || null;

    let source = cell.source || '';
    if (Array.isArray(source)) source = source.join('');

    if (cellType === 'code') codeCells++;
    if (cellType === 'markdown') markdownCells++;

    rawContent += source;
    if (source && !source.endsWith('\n')) rawContent += '\n';

    const outputs: CellOutput[] = [];

    for (const output of (cell.outputs || [])) {
      const outputType = output.output_type || 'unknown';
      const oc: OutputContent[] = [];

      if (outputType === 'stream') {
        let textOut = output.text || '';
        if (Array.isArray(textOut)) textOut = textOut.join('');
        oc.push({ type: 'stream', text: textOut });
        rawContent += textOut;
      } else if (outputType === 'execute_result' || outputType === 'display_data') {
        const data = output.data || {};
        for (const mimeType of ['image/png', 'image/jpeg', 'image/gif', 'image/svg+xml']) {
          if (data[mimeType]) {
            let imgData = data[mimeType];
            if (Array.isArray(imgData)) imgData = imgData.join('');
            oc.push({ type: 'image', data: imgData, mimeType });
          }
        }
        if (data['text/plain']) {
          let plain = data['text/plain'];
          if (Array.isArray(plain)) plain = plain.join('');
          oc.push({ type: 'text', text: plain });
          rawContent += plain + '\n';
        }
        if (data['text/html']) {
          let html = data['text/html'];
          if (Array.isArray(html)) html = html.join('');
          oc.push({ type: 'html', html });
        }
      } else if (outputType === 'error') {
        const ename = output.ename || '';
        const evalue = output.evalue || '';
        const traceback = (output.traceback || []).map((tb: string) =>
          tb.replace(/\x1b\[[0-9;]*m/g, '')
        );
        oc.push({ type: 'error', ename, evalue, traceback });
        rawContent += traceback.join('\n') + '\n';
      }

      if (oc.length > 0) {
        outputs.push({ outputType, content: oc });
      }
    }

    cells.push({
      index: idx + 1,
      type: cellType as 'code' | 'markdown' | 'raw',
      source,
      executionCount,
      outputs,
    });
  }

  return {
    fileName: name,
    fileType: 'ipynb',
    fileSize: size,
    rawContent,
    cells,
    notebookInfo: { totalCells: cells.length, codeCells, markdownCells },
  };
};

/** Build flat content string for AI evaluation */
const extractForEval = (file: ExtractedFile): string => {
  if (file.fileType === 'py') return file.rawContent;
  if (!file.cells || file.cells.length === 0) return file.rawContent;
  return file.cells
    .filter(c => c.type === 'code')
    .map((c, i) => {
      let text = `# ── Cell ${i + 1} ──────────────────────────\n${c.source}`;
      const outParts: string[] = [];
      for (const out of c.outputs) {
        for (const ct of out.content) {
          if (ct.type === 'stream' || ct.type === 'text') outParts.push(ct.text || '');
          else if (ct.type === 'error') outParts.push(`${ct.ename}: ${ct.evalue}`);
        }
      }
      if (outParts.length > 0) text += `\n\n# Output:\n${outParts.join('\n')}`;
      return text;
    })
    .join('\n\n');
};

// ============================================
// FILE PREVIEW MODAL (same as AI Lab CodePreview)
// ============================================
interface FilePreviewModalProps {
  extractedFile: ExtractedFile;
  projectTitle: string;
  onClose: () => void;
  onEvaluate: () => void;
  isEvaluating: boolean;
}

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  extractedFile, projectTitle, onClose, onEvaluate, isEvaluating
}) => {
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
              disabled={isEvaluating}
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
              disabled={isEvaluating}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold transition-colors disabled:opacity-50"
            >
              {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={handleDownload}
              disabled={isEvaluating}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold transition-colors disabled:opacity-50"
            >
              <Download size={16} />
              Download
            </button>
            <button
              onClick={onClose}
              disabled={isEvaluating}
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
                            {output.content.map((ct, cIdx) => (
                              <div key={cIdx}>
                                {ct.type === 'stream' || ct.type === 'text' ? (
                                  <pre className="bg-white border border-slate-200 rounded-xl p-4 text-slate-700 text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                                    {ct.text}
                                  </pre>
                                ) : ct.type === 'image' && ct.data ? (
                                  <div className="bg-white border border-slate-200 rounded-xl p-4">
                                    <img
                                      src={`data:${ct.mimeType || 'image/png'};base64,${ct.data}`}
                                      alt="Output"
                                      className="max-w-full rounded-lg"
                                    />
                                  </div>
                                ) : ct.type === 'html' && ct.html ? (
                                  <div
                                    className="bg-white border border-slate-200 rounded-xl p-4 overflow-x-auto"
                                    dangerouslySetInnerHTML={{ __html: ct.html }}
                                  />
                                ) : ct.type === 'error' ? (
                                  <pre className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                                    {ct.ename}: {ct.evalue}
                                    {'\n'}
                                    {ct.traceback?.join('\n')}
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
            <p className="text-sm text-slate-500">Submitting for: <span className="font-bold text-slate-700">{projectTitle}</span></p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isEvaluating}
              className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onEvaluate}
              disabled={isEvaluating}
              className="px-8 py-3 rounded-xl font-bold bg-gradient-to-r from-[#00A0E3] to-[#0060A9] text-white shadow-lg shadow-blue-200 hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-70"
            >
              {isEvaluating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Evaluating...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Submit for Evaluation
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
// EVAL RESULT TYPES
// ============================================
interface FileReview {
  file_name: string;
  score: number;
  feedback: string;
}

interface EvalResult {
  overall_score: number;
  code_quality: number;
  completeness: number;
  technical_implementation: number;
  strengths: string[];
  areas_for_improvement: string[];
  detailed_feedback: string;
  file_reviews: FileReview[];
}

// ============================================
// MAIN PROJECTS COMPONENT
// ============================================
const Projects: React.FC<{
  projects: Project[];
  selectedProject: Project | null;
  setSelectedProject: (project: Project) => void;
}> = ({ projects, selectedProject, setSelectedProject }) => {
  const [uploadedFiles, setUploadedFiles] = useState<ExtractedFile[]>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<EvalResult | null>(null);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<ExtractedFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: ExtractedFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext !== 'py' && ext !== 'ipynb') continue;
      const content = await file.text();
      try {
        if (ext === 'ipynb') {
          newFiles.push(extractIpynbFile(file.name, content, file.size));
        } else {
          newFiles.push(extractPyFile(file.name, content, file.size));
        }
      } catch {
        // Skip invalid files
      }
    }

    setUploadedFiles(prev => [...prev, ...newFiles]);
    setEvalResult(null);
    setEvalError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (fileName: string) => {
    setUploadedFiles(prev => prev.filter(f => f.fileName !== fileName));
    if (previewFile?.fileName === fileName) setPreviewFile(null);
    setEvalResult(null);
    setEvalError(null);
  };

  const handleEvaluate = async () => {
    if (!selectedProject || uploadedFiles.length === 0) return;

    setIsEvaluating(true);
    setEvalResult(null);
    setEvalError(null);

    try {
      const filesForEval = uploadedFiles.map(f => ({
        file_name: f.fileName,
        content: extractForEval(f).slice(0, 15000),
      }));

      const response = await projectAPI.evaluateProject(
        {
          title: selectedProject.title,
          description: selectedProject.desc,
          tech_stack: selectedProject.techStack,
          steps: selectedProject.steps,
        },
        filesForEval
      );

      if (response.success && response.result) {
        setEvalResult(response.result);
      } else {
        setEvalError(response.message || 'Evaluation failed. Please try again.');
      }
    } catch (err: any) {
      setEvalError(err?.message || 'Failed to connect to evaluation service. Please ensure the backend server is running.');
    } finally {
      setIsEvaluating(false);
      setPreviewFile(null);
    }
  };

  const resetUpload = () => {
    setUploadedFiles([]);
    setEvalResult(null);
    setEvalError(null);
    setPreviewFile(null);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-100';
    if (score >= 60) return 'bg-amber-50 border-amber-100';
    return 'bg-red-50 border-red-100';
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 h-full">
      {/* File Preview Modal */}
      {previewFile && selectedProject && (
        <FilePreviewModal
          extractedFile={previewFile}
          projectTitle={selectedProject.title}
          onClose={() => setPreviewFile(null)}
          onEvaluate={handleEvaluate}
          isEvaluating={isEvaluating}
        />
      )}

      <div className="h-full flex flex-col">
        <div className="flex justify-between items-end mb-5 flex-shrink-0">
          <div>
            <h2 className="text-lg md:text-xl font-black text-slate-800 tracking-tight">Capstone Projects</h2>
            <p className="text-xs md:text-sm text-slate-500 font-medium">Build real-world AI applications</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 space-y-4 pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Project List */}
              <div className="lg:col-span-4 space-y-3">
                {projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => { setSelectedProject(project); resetUpload(); }}
                      className={`w-full text-left p-4 rounded-xl border transition-all duration-300 relative overflow-hidden group
                        ${selectedProject?.id === project.id
                          ? 'bg-slate-800 text-white border-slate-800 shadow-xl scale-[1.02]'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:shadow-md'}`}
                    >
                      <div className={`absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity`}>
                          <Layers size={48} />
                      </div>
                      <div className="relative z-10">
                          <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md mb-1.5 inline-block
                            ${selectedProject?.id === project.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                            {project.type}
                          </span>
                          <h3 className="font-bold text-sm md:text-base mb-1">{project.title}</h3>
                          <div className="flex items-center gap-3 text-[10px] md:text-xs font-medium opacity-80">
                            <span className="flex items-center gap-1"><Clock size={11} /> {project.estimatedTime}</span>
                            <span className="flex items-center gap-1"><BarChart size={11} /> {project.difficulty}</span>
                          </div>
                      </div>
                    </button>
                ))}
              </div>

              {/* Project Detail View */}
              <div className="lg:col-span-8">
                {selectedProject ? (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
                      <div className={`h-24 md:h-28 bg-gradient-to-r ${selectedProject.color} relative p-5 md:p-6`}>
                          <div className="absolute right-6 top-5 text-white/20">
                            <Layers size={56} />
                          </div>
                          <div className="relative z-10 text-white">
                            <h2 className="text-base md:text-lg font-black">{selectedProject.title}</h2>
                            <p className="text-xs md:text-sm font-medium opacity-90 mt-0.5">{selectedProject.desc}</p>
                          </div>
                      </div>

                      <div className="p-5 md:p-6 space-y-5">
                          {/* Tech Stack */}
                          <div>
                            <h4 className="font-bold text-slate-800 text-xs md:text-sm mb-2 flex items-center gap-1.5">
                                <Cpu size={14} className="text-blue-500" /> Tech Stack
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                                {selectedProject.techStack.map((tech, i) => (
                                  <span key={i} className="px-2 py-1 rounded-md bg-slate-50 border border-slate-100 text-slate-600 text-[10px] md:text-xs font-bold font-mono">
                                      {tech}
                                  </span>
                                ))}
                            </div>
                          </div>

                          {/* Architecture */}
                          <div>
                            <h4 className="font-bold text-slate-800 text-xs md:text-sm mb-2 flex items-center gap-1.5">
                                <BrainCircuit size={14} className="text-purple-500" /> Architecture
                            </h4>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <InteractiveArchitecture text={selectedProject.architecture} />
                            </div>
                          </div>

                          {/* Implementation Steps */}
                          <div>
                            <h4 className="font-bold text-slate-800 text-xs md:text-sm mb-2 flex items-center gap-1.5">
                                <ListOrdered size={14} className="text-green-500" /> Implementation Roadmap
                            </h4>
                            <div className="space-y-2">
                                {selectedProject.steps.map((step, i) => (
                                  <div key={i} className="flex gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                      <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                                        {i + 1}
                                      </div>
                                      <p className="text-xs text-slate-600 leading-relaxed font-medium">{step}</p>
                                  </div>
                                ))}
                            </div>
                          </div>

                          {/* File Upload Section */}
                          <div className="pt-4 border-t border-slate-100">
                            <h4 className="font-bold text-slate-800 text-xs md:text-sm mb-3 flex items-center gap-1.5">
                                <Upload size={14} className="text-[#00A0E3]" /> Submit for Evaluation
                            </h4>

                            {/* Dropzone */}
                            <div
                              onClick={() => fileInputRef.current?.click()}
                              className="border-2 border-dashed border-slate-200 hover:border-[#00A0E3] rounded-xl p-5 text-center cursor-pointer transition-all hover:bg-blue-50/30 group"
                            >
                              <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept=".py,.ipynb"
                                onChange={handleFileSelect}
                                className="hidden"
                              />
                              <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-[#00A0E3]/10 mx-auto flex items-center justify-center mb-2 transition-colors">
                                <FileCode size={20} className="text-slate-400 group-hover:text-[#00A0E3] transition-colors" />
                              </div>
                              <p className="text-xs font-bold text-slate-600">Click to upload files</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">.py and .ipynb files supported</p>
                            </div>

                            {/* Uploaded Files List */}
                            {uploadedFiles.length > 0 && (
                              <div className="mt-3 space-y-2">
                                {uploadedFiles.map((file) => (
                                  <div key={file.fileName} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                      {file.fileType === 'ipynb'
                                        ? <FileJson size={14} className="text-orange-500 flex-shrink-0" />
                                        : <FileCode size={14} className="text-blue-500 flex-shrink-0" />
                                      }
                                      <span className="text-xs font-medium text-slate-700 truncate">{file.fileName}</span>
                                      <span className="text-[10px] text-slate-400 flex-shrink-0">{formatSize(file.fileSize)}</span>
                                      {file.fileType === 'ipynb' && file.notebookInfo ? (
                                        <span className="text-[9px] bg-orange-100 text-orange-600 font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
                                          {file.notebookInfo.codeCells} code cells
                                        </span>
                                      ) : (
                                        <span className="text-[9px] bg-blue-100 text-blue-600 font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
                                          {file.rawContent.split('\n').length} lines
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                                      <button
                                        onClick={() => setPreviewFile(file)}
                                        className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-[#00A0E3] transition-colors"
                                        title="Preview file"
                                      >
                                        <Eye size={14} />
                                      </button>
                                      <button
                                        onClick={() => removeFile(file.fileName)}
                                        className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                                        title="Remove file"
                                      >
                                        <X size={12} />
                                      </button>
                                    </div>
                                  </div>
                                ))}

                                {/* Evaluate Button */}
                                <button
                                  onClick={handleEvaluate}
                                  disabled={isEvaluating}
                                  className="w-full mt-3 py-2.5 rounded-xl bg-gradient-to-r from-[#00A0E3] to-[#0060A9] text-white font-bold text-xs hover:shadow-lg hover:scale-[1.01] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                                >
                                  {isEvaluating ? (
                                    <>
                                      <Loader2 size={14} className="animate-spin" /> Evaluating with AI...
                                    </>
                                  ) : (
                                    <>
                                      <Upload size={14} /> Evaluate {uploadedFiles.length} file{uploadedFiles.length > 1 ? 's' : ''}
                                    </>
                                  )}
                                </button>
                              </div>
                            )}

                            {/* Error */}
                            {evalError && (
                              <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2">
                                <AlertTriangle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-xs font-bold text-red-600 mb-0.5">Evaluation Failed</p>
                                  <p className="text-[11px] text-red-500">{evalError}</p>
                                </div>
                              </div>
                            )}

                            {/* Evaluation Results */}
                            {evalResult && (
                              <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Score Overview */}
                                <div className={`rounded-xl p-4 border ${getScoreBg(evalResult.overall_score)}`}>
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <CheckCircle size={16} className={getScoreColor(evalResult.overall_score)} />
                                      <span className="text-xs font-bold text-slate-700">Evaluation Complete</span>
                                    </div>
                                    <span className={`text-2xl font-black ${getScoreColor(evalResult.overall_score)}`}>
                                      {evalResult.overall_score}%
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-3 gap-2">
                                    <div className="text-center p-2 bg-white/60 rounded-lg">
                                      <p className="text-[10px] text-slate-500 font-medium">Code Quality</p>
                                      <p className={`text-sm font-black ${getScoreColor(evalResult.code_quality)}`}>{evalResult.code_quality}%</p>
                                    </div>
                                    <div className="text-center p-2 bg-white/60 rounded-lg">
                                      <p className="text-[10px] text-slate-500 font-medium">Completeness</p>
                                      <p className={`text-sm font-black ${getScoreColor(evalResult.completeness)}`}>{evalResult.completeness}%</p>
                                    </div>
                                    <div className="text-center p-2 bg-white/60 rounded-lg">
                                      <p className="text-[10px] text-slate-500 font-medium">Technical</p>
                                      <p className={`text-sm font-black ${getScoreColor(evalResult.technical_implementation)}`}>{evalResult.technical_implementation}%</p>
                                    </div>
                                  </div>
                                </div>

                                {/* Feedback */}
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                  <p className="text-xs text-slate-600 leading-relaxed">{evalResult.detailed_feedback}</p>
                                </div>

                                {/* Strengths & Improvements */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {evalResult.strengths.length > 0 && (
                                    <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                                      <p className="text-[10px] font-bold text-green-700 uppercase mb-1.5">Strengths</p>
                                      <ul className="space-y-1">
                                        {evalResult.strengths.map((s, i) => (
                                          <li key={i} className="text-[11px] text-green-700 flex items-start gap-1.5">
                                            <span className="mt-1 w-1 h-1 rounded-full bg-green-500 flex-shrink-0" />
                                            {s}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {evalResult.areas_for_improvement.length > 0 && (
                                    <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                                      <p className="text-[10px] font-bold text-amber-700 uppercase mb-1.5">Improvements</p>
                                      <ul className="space-y-1">
                                        {evalResult.areas_for_improvement.map((s, i) => (
                                          <li key={i} className="text-[11px] text-amber-700 flex items-start gap-1.5">
                                            <span className="mt-1 w-1 h-1 rounded-full bg-amber-500 flex-shrink-0" />
                                            {s}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>

                                {/* Per-File Reviews */}
                                {evalResult.file_reviews.length > 0 && (
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">File Reviews</p>
                                    <div className="space-y-2">
                                      {evalResult.file_reviews.map((fr, i) => (
                                        <div key={i} className="p-2.5 bg-white rounded-lg border border-slate-100">
                                          <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2 min-w-0">
                                              <FileCode size={13} className="text-[#00A0E3] flex-shrink-0" />
                                              <span className="text-xs font-medium text-slate-700 truncate">{fr.file_name}</span>
                                            </div>
                                            <span className={`text-xs font-black ${getScoreColor(fr.score)}`}>{fr.score}%</span>
                                          </div>
                                          <p className="text-[11px] text-slate-500 pl-5">{fr.feedback}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Re-upload */}
                                <button
                                  onClick={resetUpload}
                                  className="text-xs font-bold text-[#00A0E3] hover:underline"
                                >
                                  Upload different files
                                </button>
                              </div>
                            )}
                          </div>
                      </div>
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-6 text-center text-slate-400">
                      <div>
                          <Layers size={36} className="mx-auto mb-3 opacity-50" />
                          <p className="font-bold text-xs">Select a project to view details</p>
                      </div>
                    </div>
                )}
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Projects;
