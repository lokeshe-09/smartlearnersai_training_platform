"""
AI Grading Service using Gemini API
Analyzes code submissions against lab requirements
"""

import os
import json
import re
from google import genai
from google.genai import types

# Get API key from environment or use default
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
MODEL_NAME = "gemini-2.5-flash"


def create_grading_prompt(lab_info: dict, code_content: str, cells_info: list = None) -> str:
    """
    Create a comprehensive prompt for AI grading with strict evaluation
    """

    prompt = f"""You are a STRICT AI code grader. Evaluate the student's submission against the lab requirements.

## CRITICAL RULE - WRONG SUBMISSION = ZERO SCORE
If the submitted code is for a DIFFERENT project/task than what was assigned:
- Set overall_score to 0
- Set code_quality, accuracy, efficiency all to 0
- Mark ALL requirements as "not_met"
- Clearly state in feedback that wrong code was submitted

## LAB ASSIGNMENT

**Title:** {lab_info.get('title', 'Unknown')}
**Category:** {lab_info.get('category', 'Unknown')}
**Description:** {lab_info.get('description', 'No description')}

**Requirements:**
"""

    requirements = lab_info.get('requirements', [])
    for i, req in enumerate(requirements, 1):
        prompt += f"{i}. {req}\n"

    prompt += f"""

## STUDENT'S CODE

```python
{code_content[:8000]}
```
"""

    if cells_info and len(cells_info) > 0:
        prompt += "\n## NOTEBOOK CELLS & OUTPUTS\n"
        for cell in cells_info[:15]:  # Limit cells
            cell_type = cell.get('type', 'unknown')
            source = cell.get('source', '')[:1000]
            prompt += f"\n[{cell_type.upper()}]\n```\n{source}\n```\n"
            for output in cell.get('outputs', [])[:2]:
                for content in output.get('content', [])[:1]:
                    if content.get('type') in ['stream', 'text']:
                        prompt += f"Output: {content.get('text', '')[:300]}\n"

    prompt += """

## EVALUATION CRITERIA

1. **RELEVANCE CHECK (MOST IMPORTANT)**
   - Does the code match the assignment topic?
   - Is it the correct type of ML/AI task?
   - If code is for different project → Score = 0

2. **Code Quality** - Structure, naming, comments, readability
3. **Accuracy** - Correct implementation, logic, outputs
4. **Efficiency** - Optimal algorithms, no redundancy

## RESPONSE FORMAT (JSON)

{
    "is_relevant": true/false,
    "relevance_issue": "null or brief reason why code doesn't match assignment",
    "overall_score": 0-100,
    "code_quality": 0-100,
    "accuracy": 0-100,
    "efficiency": 0-100,
    "requirements_analysis": [
        {"requirement": "req text", "status": "met/partial/not_met", "explanation": "10 words max"}
    ],
    "strengths": ["point 1", "point 2"],
    "areas_for_improvement": ["point 1", "point 2"],
    "detailed_feedback": "2-3 bullet points only, max 15 words each",
    "code_suggestions": ["short suggestion 1", "short suggestion 2"],
    "learning_resources": ["topic 1", "topic 2"]
}

## RULES FOR FEEDBACK
- All feedback must be SHORT bullet points (max 15 words each)
- Max 3 points per section
- Be direct and specific
- No lengthy paragraphs
- If wrong code submitted: overall_score = 0, explain briefly why

Return ONLY valid JSON, no markdown formatting.
"""

    return prompt


def grade_submission(lab_info: dict, code_content: str, cells_info: list = None) -> dict:
    """
    Grade a code submission using Gemini AI

    Args:
        lab_info: Dictionary containing lab title, description, requirements, category
        code_content: The raw code content from the submission
        cells_info: Optional list of notebook cells with their outputs

    Returns:
        Dictionary containing grading results
    """

    try:
        # Initialize Gemini client
        client = genai.Client(api_key=GEMINI_API_KEY)

        # Create the grading prompt
        prompt = create_grading_prompt(lab_info, code_content, cells_info)

        # Create content for API
        contents = [
            types.Content(
                role="user",
                parts=[
                    types.Part.from_text(text=prompt),
                ],
            ),
        ]

        # Configure generation
        generate_content_config = types.GenerateContentConfig(
            response_mime_type="application/json",
            thinking_config=types.ThinkingConfig(
                thinking_budget=-1,
            ),
        )

        # Generate response
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=contents,
            config=generate_content_config,
        )

        # Parse the JSON response
        response_text = response.text

        # Try to extract JSON from response
        try:
            result = json.loads(response_text)
        except json.JSONDecodeError:
            # Try to find JSON in the response
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if json_match:
                result = json.loads(json_match.group())
            else:
                raise ValueError("Could not parse JSON from response")

        # Check if submission is relevant
        is_relevant = result.get("is_relevant", True)
        relevance_issue = result.get("relevance_issue", None)

        # If not relevant, force score to 0
        if not is_relevant or relevance_issue:
            result["overall_score"] = 0
            result["code_quality"] = 0
            result["accuracy"] = 0
            result["efficiency"] = 0

        # Validate and sanitize the result
        validated_result = {
            "success": True,
            "is_relevant": is_relevant,
            "relevance_issue": relevance_issue,
            "overall_score": min(100, max(0, int(result.get("overall_score", 0)))),
            "code_quality": min(100, max(0, int(result.get("code_quality", 0)))),
            "accuracy": min(100, max(0, int(result.get("accuracy", 0)))),
            "efficiency": min(100, max(0, int(result.get("efficiency", 0)))),
            "requirements_analysis": result.get("requirements_analysis", [])[:6],
            "strengths": result.get("strengths", [])[:3],
            "areas_for_improvement": result.get("areas_for_improvement", [])[:3],
            "detailed_feedback": result.get("detailed_feedback", "Submission evaluated."),
            "code_suggestions": result.get("code_suggestions", [])[:3],
            "learning_resources": result.get("learning_resources", [])[:3],
        }

        return validated_result

    except Exception as e:
        # Return error response
        return {
            "success": False,
            "error": str(e),
            "is_relevant": False,
            "overall_score": 0,
            "code_quality": 0,
            "accuracy": 0,
            "efficiency": 0,
            "requirements_analysis": [],
            "strengths": [],
            "areas_for_improvement": ["Error during analysis"],
            "detailed_feedback": f"Analysis error: {str(e)[:100]}",
            "code_suggestions": [],
            "learning_resources": [],
        }


# ============================================
# ORCA AI CHATBOT
# ============================================

ORCA_SYSTEM_PROMPT = """You are OrcaAI, a friendly and knowledgeable AI learning assistant for the Smart Learners AI platform.

Your role is to:
1. Help students understand AI/ML concepts (machine learning, deep learning, NLP, computer vision, etc.)
2. Explain programming concepts in Python, data science libraries (NumPy, Pandas, Scikit-Learn, TensorFlow, PyTorch)
3. Guide students through their lab assignments and projects
4. Answer questions about the curriculum topics: LLMs, RAG, Prompt Engineering, Fine-tuning, AI Agents
5. Provide coding tips and best practices
6. Encourage and motivate learners

Guidelines:
- Be concise but helpful - keep responses under 200 words unless detailed explanation is needed
- Use simple language and examples
- When explaining code, use markdown code blocks
- Be encouraging and supportive
- If asked about topics outside AI/ML/programming, politely redirect to relevant topics
- Never provide harmful content or help with cheating

You have a friendly, professional tone with a touch of enthusiasm for AI!"""


def chat_with_orca(messages: list, user_message: str) -> dict:
    """
    Chat with OrcaAI using Gemini

    Args:
        messages: List of previous messages in the conversation
        user_message: The current user message

    Returns:
        Dictionary containing the AI response
    """

    try:
        # Initialize Gemini client
        client = genai.Client(api_key=GEMINI_API_KEY)

        # Build conversation contents
        contents = []

        # Add system instruction as first user message context
        system_context = types.Content(
            role="user",
            parts=[types.Part.from_text(text=f"[System Instructions - Follow these guidelines]\n{ORCA_SYSTEM_PROMPT}\n\n[End of System Instructions]")],
        )
        contents.append(system_context)

        # Add acknowledgment from model
        ack = types.Content(
            role="model",
            parts=[types.Part.from_text(text="I understand. I am OrcaAI, your AI learning assistant. I'll help you with AI, ML, and programming questions!")],
        )
        contents.append(ack)

        # Add conversation history (limit to last 10 messages to avoid token limits)
        for msg in messages[-10:]:
            role = "user" if msg.get("role") == "user" else "model"
            contents.append(
                types.Content(
                    role=role,
                    parts=[types.Part.from_text(text=msg.get("content", ""))],
                )
            )

        # Add current user message
        contents.append(
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=user_message)],
            )
        )

        # Configure generation (no JSON format for chat)
        generate_content_config = types.GenerateContentConfig(
            temperature=0.7,
            top_p=0.9,
            max_output_tokens=1024,
        )

        # Generate response
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=contents,
            config=generate_content_config,
        )

        return {
            "success": True,
            "response": response.text,
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "response": "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.",
        }


# ============================================
# EXAM MODE - QUESTION GENERATION & GRADING
# ============================================

CURRICULUM_TOPICS = """
Module 1: Foundations of Modern AI
- Evolution of AI vs ML vs Deep Learning
- High-level LLM Architecture (Tokens, Embeddings, Attention)
- Popular LLM Ecosystems (OpenAI GPT, Google Gemini, Meta Llama, Mistral)
- Transformer Architecture fundamentals
- Tokenization (BPE, WordPiece, SentencePiece)

Module 2: Prompt Engineering & Optimization
- Zero-shot & Few-shot prompting techniques
- Chain-of-thought (CoT) prompting
- Role prompting and system instructions
- Handling hallucinations and factuality
- Token limits and context window management
- Temperature, Top-p, and sampling strategies

Module 3: Retrieval-Augmented Generation (RAG)
- RAG Architecture and pipeline design
- Vector Databases (ChromaDB, Pinecone, FAISS)
- Document ingestion and chunking strategies
- Embedding models and vector representations
- Similarity Search (Cosine, Euclidean, Dot Product)

Module 4: Fine-Tuning, Agents & Workflows
- Full fine-tuning vs Parameter-Efficient Fine-Tuning (PEFT)
- LoRA and QLoRA techniques
- Instruction tuning and RLHF
- AI Agents and tool calling
- Function calling and execution
- Multi-step reasoning and agentic workflows

Module 5: Deployment & Responsible AI
- Model deployment and API integration
- Cost optimization and latency management
- AI Safety, Bias, and Ethics
- Model evaluation metrics (BLEU, ROUGE, Perplexity)
- Guardrails and content filtering
"""


def generate_exam_questions(difficulty: str, num_questions: int) -> dict:
    """
    Generate exam questions using Gemini AI based on curriculum topics.

    Args:
        difficulty: 'easy', 'medium', or 'hard'
        num_questions: Number of questions to generate

    Returns:
        Dictionary with list of questions including correct answers
    """
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)

        difficulty_guide = {
            'easy': "Basic definitions, recall, and foundational concepts. Straightforward questions.",
            'medium': "Application-based, comparisons, scenario analysis. Tests understanding beyond recall.",
            'hard': "Advanced scenarios, architecture decisions, edge cases, deep technical reasoning.",
        }

        prompt = f"""Generate exactly {num_questions} unique multiple-choice questions for an Applied AI exam.

DIFFICULTY: {difficulty.upper()}
GUIDELINES: {difficulty_guide.get(difficulty, difficulty_guide['medium'])}

CURRICULUM:
{CURRICULUM_TOPICS}

RULES:
1. Each question must test a DIFFERENT concept
2. Distribute questions across ALL 5 modules proportionally
3. Each question has exactly 4 options (A, B, C, D)
4. Exactly one correct answer per question
5. Include a concise educational explanation (2-3 sentences)
6. Tag each question with its module/topic

RETURN FORMAT (strict JSON only, no markdown):
{{
  "questions": [
    {{
      "id": 1,
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": 0,
      "explanation": "Correct answer is A because...",
      "topic": "Module 1: Foundations of Modern AI"
    }}
  ]
}}

IMPORTANT:
- correct_answer is 0-based index (0=A, 1=B, 2=C, 3=D)
- Generate EXACTLY {num_questions} questions
- Return ONLY valid JSON
- Make distractors plausible but clearly wrong to experts"""

        contents = [
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=prompt)],
            ),
        ]

        generate_content_config = types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.8,
            top_p=0.95,
        )

        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=contents,
            config=generate_content_config,
        )

        response_text = response.text
        try:
            result = json.loads(response_text)
        except json.JSONDecodeError:
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if json_match:
                result = json.loads(json_match.group())
            else:
                raise ValueError("Could not parse JSON from AI response")

        questions = result.get('questions', [])

        validated = []
        for i, q in enumerate(questions[:num_questions]):
            validated.append({
                'id': i + 1,
                'question': q.get('question', ''),
                'options': q.get('options', [])[:4],
                'correct_answer': min(max(int(q.get('correct_answer', 0)), 0), 3),
                'explanation': q.get('explanation', ''),
                'topic': q.get('topic', 'General'),
            })

        return {'success': True, 'questions': validated}

    except Exception as e:
        return {'success': False, 'error': str(e), 'questions': []}


def evaluate_project_files(project_info: dict, files_content: list) -> dict:
    """
    Evaluate project files using Gemini AI

    Args:
        project_info: Dict with title, description, tech_stack, steps
        files_content: List of dicts with file_name and content

    Returns:
        Dictionary with evaluation results
    """
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)

        prompt = f"""You are an AI project evaluator. Evaluate the student's project submission.

## PROJECT ASSIGNMENT
**Title:** {project_info.get('title', 'Unknown')}
**Description:** {project_info.get('description', '')}
**Tech Stack:** {', '.join(project_info.get('tech_stack', []))}

**Expected Steps:**
"""
        for i, step in enumerate(project_info.get('steps', []), 1):
            prompt += f"{i}. {step}\n"

        prompt += "\n## SUBMITTED FILES\n"
        for f in files_content:
            content = f.get('content', '')[:12000]
            prompt += f"\n### File: {f['file_name']}\n```python\n{content}\n```\n"

        prompt += """
## EVALUATION CRITERIA
1. **Relevance** - Does the code match the project assignment?
2. **Code Quality** - Structure, readability, best practices
3. **Completeness** - Are all project steps implemented?
4. **Technical Implementation** - Correct use of tech stack
5. **Innovation** - Creative solutions, extra features

## RESPONSE FORMAT (JSON)
{
    "overall_score": 0-100,
    "code_quality": 0-100,
    "completeness": 0-100,
    "technical_implementation": 0-100,
    "strengths": ["point 1", "point 2", "point 3"],
    "areas_for_improvement": ["point 1", "point 2"],
    "detailed_feedback": "Brief 2-3 sentence evaluation",
    "file_reviews": [
        {"file_name": "name.py", "score": 0-100, "feedback": "Brief feedback"}
    ]
}

RULES:
- All feedback must be concise (max 15 words per point)
- Max 3 strengths, 3 improvement areas
- If code doesn't match project, score = 0
- Return ONLY valid JSON
"""

        contents = [
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=prompt)],
            ),
        ]

        generate_content_config = types.GenerateContentConfig(
            response_mime_type="application/json",
            thinking_config=types.ThinkingConfig(
                thinking_budget=-1,
            ),
        )

        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=contents,
            config=generate_content_config,
        )

        response_text = response.text
        try:
            result = json.loads(response_text)
        except json.JSONDecodeError:
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if json_match:
                result = json.loads(json_match.group())
            else:
                raise ValueError("Could not parse JSON from response")

        return {
            "success": True,
            "overall_score": min(100, max(0, int(result.get("overall_score", 0)))),
            "code_quality": min(100, max(0, int(result.get("code_quality", 0)))),
            "completeness": min(100, max(0, int(result.get("completeness", 0)))),
            "technical_implementation": min(100, max(0, int(result.get("technical_implementation", 0)))),
            "strengths": result.get("strengths", [])[:3],
            "areas_for_improvement": result.get("areas_for_improvement", [])[:3],
            "detailed_feedback": result.get("detailed_feedback", "Submission evaluated."),
            "file_reviews": result.get("file_reviews", []),
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "overall_score": 0,
            "code_quality": 0,
            "completeness": 0,
            "technical_implementation": 0,
            "strengths": [],
            "areas_for_improvement": ["Error during evaluation"],
            "detailed_feedback": f"Evaluation error: {str(e)[:100]}",
            "file_reviews": [],
        }


def grade_exam(questions: list, student_answers: dict) -> dict:
    """
    Grade exam by comparing student answers with correct answers.

    Args:
        questions: List of questions with correct_answer field
        student_answers: Dict mapping question_id (str) to selected option index (int)

    Returns:
        Dictionary with results per question and total score
    """
    results = []
    correct_count = 0
    total = len(questions)

    for q in questions:
        qid = str(q['id'])
        student_ans = student_answers.get(qid)
        correct_ans = q['correct_answer']

        # Handle case where student didn't answer
        if student_ans is not None:
            student_ans = int(student_ans)
            is_correct = student_ans == correct_ans
        else:
            is_correct = False

        if is_correct:
            correct_count += 1

        results.append({
            'question_id': q['id'],
            'question': q['question'],
            'options': q['options'],
            'student_answer': student_ans,
            'correct_answer': correct_ans,
            'is_correct': is_correct,
            'explanation': q.get('explanation', ''),
            'topic': q.get('topic', ''),
        })

    score = round((correct_count / total) * 100, 1) if total > 0 else 0

    return {
        'success': True,
        'results': results,
        'score': score,
        'correct_count': correct_count,
        'total_questions': total,
    }
