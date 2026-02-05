from django.urls import path
from . import views

urlpatterns = [
    path('signup/', views.signup_view, name='signup'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('profile/', views.user_profile_view, name='profile'),
    path('check/', views.check_auth_view, name='check_auth'),
    path('health/', views.health_check, name='health'),
]

# AI Grading URLs
ai_urlpatterns = [
    path('grade/', views.ai_grade_submission, name='ai_grade'),
    path('submissions/', views.get_user_submissions, name='user_submissions'),
    path('submissions/<str:lab_id>/', views.get_submission_by_lab, name='submission_by_lab'),
    # Assessment URLs
    path('assessment/submit/', views.submit_assessment, name='submit_assessment'),
    path('assessment/results/', views.get_assessment_results, name='assessment_results'),
    path('assessment/results/<int:assessment_id>/', views.get_assessment_result_by_id, name='assessment_result_by_id'),
    # OrcaAI Chat
    path('chat/', views.orca_chat, name='orca_chat'),
    # Exam Mode
    path('exam/generate/', views.generate_exam, name='generate_exam'),
    path('exam/submit/', views.submit_exam, name='submit_exam'),
    path('exam/history/', views.get_exam_history, name='exam_history'),
    path('exam/<int:exam_id>/', views.get_exam_detail, name='exam_detail'),
    # Project Evaluation
    path('project/evaluate/', views.evaluate_project, name='evaluate_project'),
]
