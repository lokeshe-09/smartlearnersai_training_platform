from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import login, logout
from django.views.decorators.csrf import csrf_exempt
from .serializers import SignupSerializer, LoginSerializer, UserSerializer
from .models import User, LabSubmission, AssessmentResult, ExamSession


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def signup_view(request):
    """
    Handle user registration.

    POST /api/auth/signup/
    {
        "username": "string",
        "email": "string",
        "password": "string",
        "confirm_password": "string",
        "first_name": "string" (optional),
        "last_name": "string" (optional)
    }
    """
    serializer = SignupSerializer(data=request.data)

    if serializer.is_valid():
        user = serializer.save()

        # Auto-login after signup
        login(request, user)

        return Response({
            'success': True,
            'message': 'Account created successfully!',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)

    # Format error messages for frontend
    errors = serializer.errors
    error_message = ''
    for field, messages in errors.items():
        if isinstance(messages, list):
            error_message = messages[0]
        else:
            error_message = str(messages)
        break

    return Response({
        'success': False,
        'message': error_message,
        'errors': errors
    }, status=status.HTTP_400_BAD_REQUEST)


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Handle user authentication.

    POST /api/auth/login/
    {
        "username": "string",  # Can be username or email
        "password": "string"
    }
    """
    serializer = LoginSerializer(data=request.data)

    if serializer.is_valid():
        user = serializer.validated_data['user']
        login(request, user)

        return Response({
            'success': True,
            'message': 'Login successful!',
            'user': UserSerializer(user).data
        }, status=status.HTTP_200_OK)

    # Format error messages
    errors = serializer.errors
    error_message = 'Invalid credentials. Please try again.'

    if 'non_field_errors' in errors:
        error_message = errors['non_field_errors'][0]
    elif errors:
        for field, messages in errors.items():
            if isinstance(messages, list):
                error_message = messages[0]
            else:
                error_message = str(messages)
            break

    return Response({
        'success': False,
        'message': error_message,
        'errors': errors
    }, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    Handle user logout.

    POST /api/auth/logout/
    """
    logout(request)
    return Response({
        'success': True,
        'message': 'Logged out successfully!'
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile_view(request):
    """
    Get current authenticated user's profile.

    GET /api/auth/profile/
    """
    return Response({
        'success': True,
        'user': UserSerializer(request.user).data
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def check_auth_view(request):
    """
    Check if user is authenticated.

    GET /api/auth/check/
    """
    if request.user.is_authenticated:
        return Response({
            'authenticated': True,
            'user': UserSerializer(request.user).data
        }, status=status.HTTP_200_OK)

    return Response({
        'authenticated': False,
        'user': None
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    API health check endpoint.

    GET /api/auth/health/
    """
    return Response({
        'status': 'healthy',
        'message': 'Smart Learners AI Backend is running!'
    }, status=status.HTTP_200_OK)


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def ai_grade_submission(request):
    """
    AI-powered code grading endpoint.
    Saves results to database if user is authenticated.

    POST /api/ai/grade/
    {
        "lab_id": "string",  // Required for saving
        "lab_info": {
            "title": "string",
            "category": "string",
            "description": "string",
            "requirements": ["string"]
        },
        "code_content": "string",
        "file_name": "string",  // Optional
        "cells_info": [  // Optional, for notebooks
            {
                "index": number,
                "type": "code" | "markdown",
                "source": "string",
                "outputs": [...]
            }
        ]
    }
    """
    try:
        # Import the grading function
        from .ai_grading import grade_submission

        # Extract data from request
        data = request.data
        lab_id = data.get('lab_id', '')
        lab_info = data.get('lab_info', {})
        code_content = data.get('code_content', '')
        file_name = data.get('file_name', '')
        cells_info = data.get('cells_info', None)

        # Validate required fields
        if not lab_info:
            return Response({
                'success': False,
                'message': 'Lab information is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        if not code_content:
            return Response({
                'success': False,
                'message': 'Code content is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Perform AI grading
        result = grade_submission(lab_info, code_content, cells_info)

        # Save to database if user is authenticated and lab_id provided
        saved_to_db = False
        if request.user.is_authenticated and lab_id:
            try:
                # Update or create submission (replaces on resubmit)
                submission, created = LabSubmission.objects.update_or_create(
                    user=request.user,
                    lab_id=lab_id,
                    defaults={
                        'lab_title': lab_info.get('title', ''),
                        'lab_category': lab_info.get('category', ''),
                        'overall_score': result.get('overall_score', 0),
                        'code_quality': result.get('code_quality', 0),
                        'accuracy': result.get('accuracy', 0),
                        'efficiency': result.get('efficiency', 0),
                        'grading_result': result,
                        'code_content': code_content[:10000],  # Limit stored code
                        'file_name': file_name,
                    }
                )
                saved_to_db = True
            except Exception as db_error:
                print(f"Database save error: {db_error}")

        if result.get('success', False):
            return Response({
                'success': True,
                'message': 'Grading completed successfully',
                'grading_result': result,
                'saved_to_db': saved_to_db
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'success': False,
                'message': result.get('error', 'Grading failed'),
                'grading_result': result,
                'saved_to_db': saved_to_db
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    except Exception as e:
        return Response({
            'success': False,
            'message': f'An error occurred: {str(e)}',
            'grading_result': None
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_submissions(request):
    """
    Get all lab submissions for the authenticated user.

    GET /api/ai/submissions/
    """
    submissions = LabSubmission.objects.filter(user=request.user)
    data = []
    for sub in submissions:
        data.append({
            'lab_id': sub.lab_id,
            'lab_title': sub.lab_title,
            'lab_category': sub.lab_category,
            'overall_score': sub.overall_score,
            'code_quality': sub.code_quality,
            'accuracy': sub.accuracy,
            'efficiency': sub.efficiency,
            'file_name': sub.file_name,
            'code_content': sub.code_content,
            'submitted_at': sub.submitted_at.isoformat(),
            'grading_result': sub.grading_result,
        })

    return Response({
        'success': True,
        'submissions': data
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_submission_by_lab(request, lab_id):
    """
    Get a specific lab submission for the authenticated user.

    GET /api/ai/submissions/<lab_id>/
    """
    try:
        submission = LabSubmission.objects.get(user=request.user, lab_id=lab_id)
        return Response({
            'success': True,
            'submission': {
                'lab_id': submission.lab_id,
                'lab_title': submission.lab_title,
                'lab_category': submission.lab_category,
                'overall_score': submission.overall_score,
                'code_quality': submission.code_quality,
                'accuracy': submission.accuracy,
                'efficiency': submission.efficiency,
                'file_name': submission.file_name,
                'code_content': submission.code_content,
                'submitted_at': submission.submitted_at.isoformat(),
                'grading_result': submission.grading_result,
            }
        }, status=status.HTTP_200_OK)
    except LabSubmission.DoesNotExist:
        return Response({
            'success': False,
            'message': 'No submission found for this lab',
            'submission': None
        }, status=status.HTTP_404_NOT_FOUND)


# ============================================
# ASSESSMENT API ENDPOINTS
# ============================================

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def submit_assessment(request):
    """
    Submit assessment result. Updates existing result on retake.

    POST /api/ai/assessment/submit/
    {
        "assessment_id": number,
        "assessment_title": "string",
        "score": number,
        "total_questions": number,
        "correct_answers": number,
        "passing_score": number
    }
    """
    try:
        data = request.data
        assessment_id = data.get('assessment_id')
        assessment_title = data.get('assessment_title', '')
        score = data.get('score', 0)
        total_questions = data.get('total_questions', 0)
        correct_answers = data.get('correct_answers', 0)
        passing_score = data.get('passing_score', 80)

        if not assessment_id:
            return Response({
                'success': False,
                'message': 'Assessment ID is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Determine if passed
        passed = score >= passing_score

        # Save to database if user is authenticated
        saved_to_db = False
        if request.user.is_authenticated:
            try:
                result, created = AssessmentResult.objects.update_or_create(
                    user=request.user,
                    assessment_id=assessment_id,
                    defaults={
                        'assessment_title': assessment_title,
                        'score': score,
                        'total_questions': total_questions,
                        'correct_answers': correct_answers,
                        'passing_score': passing_score,
                        'passed': passed,
                    }
                )
                saved_to_db = True
            except Exception as db_error:
                print(f"Database save error: {db_error}")

        return Response({
            'success': True,
            'message': 'Assessment submitted successfully',
            'saved_to_db': saved_to_db,
            'result': {
                'assessment_id': assessment_id,
                'score': score,
                'passed': passed,
                'is_retake': not created if saved_to_db else False
            }
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            'success': False,
            'message': f'An error occurred: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_assessment_results(request):
    """
    Get all assessment results for the authenticated user.

    GET /api/ai/assessment/results/
    """
    if not request.user.is_authenticated:
        return Response({
            'success': True,
            'results': []
        }, status=status.HTTP_200_OK)

    results = AssessmentResult.objects.filter(user=request.user)
    data = []
    for result in results:
        data.append({
            'assessment_id': result.assessment_id,
            'assessment_title': result.assessment_title,
            'score': result.score,
            'total_questions': result.total_questions,
            'correct_answers': result.correct_answers,
            'passing_score': result.passing_score,
            'passed': result.passed,
            'completed_at': result.completed_at.isoformat(),
        })

    return Response({
        'success': True,
        'results': data
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_assessment_result_by_id(request, assessment_id):
    """
    Get a specific assessment result for the authenticated user.

    GET /api/ai/assessment/results/<assessment_id>/
    """
    try:
        result = AssessmentResult.objects.get(user=request.user, assessment_id=assessment_id)
        return Response({
            'success': True,
            'result': {
                'assessment_id': result.assessment_id,
                'assessment_title': result.assessment_title,
                'score': result.score,
                'total_questions': result.total_questions,
                'correct_answers': result.correct_answers,
                'passing_score': result.passing_score,
                'passed': result.passed,
                'completed_at': result.completed_at.isoformat(),
            }
        }, status=status.HTTP_200_OK)
    except AssessmentResult.DoesNotExist:
        return Response({
            'success': False,
            'message': 'No result found for this assessment',
            'result': None
        }, status=status.HTTP_404_NOT_FOUND)


# ============================================
# ORCA AI CHATBOT ENDPOINT
# ============================================

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def orca_chat(request):
    """
    OrcaAI chatbot endpoint.

    POST /api/ai/chat/
    {
        "message": "string",
        "history": [
            {"role": "user", "content": "..."},
            {"role": "assistant", "content": "..."}
        ]
    }
    """
    try:
        from .ai_grading import chat_with_orca

        data = request.data
        user_message = data.get('message', '')
        history = data.get('history', [])

        if not user_message.strip():
            return Response({
                'success': False,
                'message': 'Message cannot be empty',
                'response': None
            }, status=status.HTTP_400_BAD_REQUEST)

        # Call OrcaAI
        result = chat_with_orca(history, user_message)

        if result.get('success'):
            return Response({
                'success': True,
                'message': 'Response generated',
                'response': result.get('response', '')
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'success': False,
                'message': result.get('error', 'Failed to generate response'),
                'response': result.get('response', 'Sorry, I could not process your request.')
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    except Exception as e:
        return Response({
            'success': False,
            'message': f'An error occurred: {str(e)}',
            'response': None
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================
# EXAM MODE ENDPOINTS
# ============================================

@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_exam(request):
    """
    Generate AI exam questions and create an exam session.

    POST /api/ai/exam/generate/
    {
        "difficulty": "easy" | "medium" | "hard",
        "duration_minutes": 30
    }
    """
    try:
        from .ai_grading import generate_exam_questions

        data = request.data
        difficulty = data.get('difficulty', 'medium')
        duration_minutes = int(data.get('duration_minutes', 30))

        if difficulty not in ('easy', 'medium', 'hard'):
            return Response({
                'success': False,
                'message': 'Invalid difficulty level'
            }, status=status.HTTP_400_BAD_REQUEST)

        question_counts = {'easy': 10, 'medium': 15, 'hard': 20}
        num_questions = question_counts.get(difficulty, 15)

        result = generate_exam_questions(difficulty, num_questions)

        if not result.get('success') or not result.get('questions'):
            return Response({
                'success': False,
                'message': result.get('error', 'Failed to generate questions')
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        questions = result['questions']

        exam = ExamSession.objects.create(
            user=request.user,
            difficulty=difficulty,
            duration_minutes=duration_minutes,
            total_questions=len(questions),
            questions=questions,
        )

        # Return questions WITHOUT correct answers or explanations
        safe_questions = []
        for q in questions:
            safe_questions.append({
                'id': q['id'],
                'question': q['question'],
                'options': q['options'],
                'topic': q.get('topic', ''),
            })

        return Response({
            'success': True,
            'exam_id': exam.id,
            'questions': safe_questions,
            'total_questions': len(safe_questions),
            'difficulty': difficulty,
            'duration_minutes': duration_minutes,
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({
            'success': False,
            'message': f'An error occurred: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_exam(request):
    """
    Submit exam answers for grading.

    POST /api/ai/exam/submit/
    {
        "exam_id": number,
        "answers": {"1": 2, "2": 0, ...}
    }
    """
    try:
        from .ai_grading import grade_exam
        from django.utils import timezone

        data = request.data
        exam_id = data.get('exam_id')
        answers = data.get('answers', {})

        if not exam_id:
            return Response({
                'success': False,
                'message': 'Exam ID is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            exam = ExamSession.objects.get(id=exam_id, user=request.user)
        except ExamSession.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Exam session not found'
            }, status=status.HTTP_404_NOT_FOUND)

        if exam.is_completed:
            return Response({
                'success': False,
                'message': 'This exam has already been submitted'
            }, status=status.HTTP_400_BAD_REQUEST)

        grading = grade_exam(exam.questions, answers)

        exam.student_answers = answers
        exam.results = grading.get('results', [])
        exam.score = grading.get('score', 0)
        exam.correct_count = grading.get('correct_count', 0)
        exam.is_completed = True
        exam.completed_at = timezone.now()
        exam.save()

        return Response({
            'success': True,
            'message': 'Exam graded successfully',
            'score': grading['score'],
            'correct_count': grading['correct_count'],
            'total_questions': grading['total_questions'],
            'results': grading['results'],
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            'success': False,
            'message': f'An error occurred: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_exam_history(request):
    """
    Get all completed exam sessions for the authenticated user.

    GET /api/ai/exam/history/
    """
    exams = ExamSession.objects.filter(user=request.user, is_completed=True)
    data = []
    for exam in exams:
        data.append({
            'id': exam.id,
            'difficulty': exam.difficulty,
            'duration_minutes': exam.duration_minutes,
            'total_questions': exam.total_questions,
            'score': exam.score,
            'correct_count': exam.correct_count,
            'created_at': exam.created_at.isoformat(),
            'completed_at': exam.completed_at.isoformat() if exam.completed_at else None,
        })

    return Response({
        'success': True,
        'exams': data
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_exam_detail(request, exam_id):
    """
    Get a specific exam session with full details including solutions.

    GET /api/ai/exam/<exam_id>/
    """
    try:
        exam = ExamSession.objects.get(id=exam_id, user=request.user)

        return Response({
            'success': True,
            'exam': {
                'id': exam.id,
                'difficulty': exam.difficulty,
                'duration_minutes': exam.duration_minutes,
                'total_questions': exam.total_questions,
                'score': exam.score,
                'correct_count': exam.correct_count,
                'questions': exam.questions,
                'student_answers': exam.student_answers,
                'results': exam.results,
                'is_completed': exam.is_completed,
                'created_at': exam.created_at.isoformat(),
                'completed_at': exam.completed_at.isoformat() if exam.completed_at else None,
            }
        }, status=status.HTTP_200_OK)
    except ExamSession.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Exam not found',
        }, status=status.HTTP_404_NOT_FOUND)


# ============================================
# PROJECT EVALUATION
# ============================================

@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def evaluate_project(request):
    """
    Evaluate project files using AI.

    POST /api/ai/project/evaluate/
    {
        "project_info": {"title": "", "description": "", "tech_stack": [], "steps": []},
        "files_content": [{"file_name": "", "content": ""}]
    }
    """
    project_info = request.data.get('project_info')
    files_content = request.data.get('files_content', [])

    if not project_info or not files_content:
        return Response({
            'success': False,
            'message': 'Project info and files are required',
        }, status=status.HTTP_400_BAD_REQUEST)

    from .ai_grading import evaluate_project_files
    result = evaluate_project_files(project_info, files_content)

    return Response({
        'success': result.get('success', False),
        'message': 'Project evaluated successfully' if result.get('success') else result.get('error', 'Evaluation failed'),
        'result': result,
    })
