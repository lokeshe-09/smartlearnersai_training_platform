from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom User model for Smart Learners AI platform.
    Extends Django's AbstractUser to allow future customization.
    """
    email = models.EmailField(unique=True, blank=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Additional fields for the learning platform
    profile_picture = models.URLField(blank=True, null=True)
    bio = models.TextField(blank=True, max_length=500)

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return self.username


class LabSubmission(models.Model):
    """
    Model to store AI grading results for lab submissions.
    Replaces existing submission on resubmit (unique per user + lab_id).
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='lab_submissions')
    lab_id = models.CharField(max_length=100)  # Unique identifier for the lab
    lab_title = models.CharField(max_length=255)
    lab_category = models.CharField(max_length=100, blank=True)

    # Score fields
    overall_score = models.IntegerField(default=0)
    code_quality = models.IntegerField(default=0)
    accuracy = models.IntegerField(default=0)
    efficiency = models.IntegerField(default=0)

    # Full grading result as JSON
    grading_result = models.JSONField(default=dict)

    # Submission details
    code_content = models.TextField(blank=True)
    file_name = models.CharField(max_length=255, blank=True)

    # Timestamps
    submitted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'lab_submissions'
        verbose_name = 'Lab Submission'
        verbose_name_plural = 'Lab Submissions'
        unique_together = ['user', 'lab_id']  # One submission per user per lab
        ordering = ['-submitted_at']

    def __str__(self):
        return f"{self.user.username} - {self.lab_title} ({self.overall_score}%)"


class AssessmentResult(models.Model):
    """
    Model to store assessment/quiz results for users.
    Replaces existing result on retake (unique per user + assessment_id).
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assessment_results')
    assessment_id = models.IntegerField()  # Assessment module ID (1, 2, 3, etc.)
    assessment_title = models.CharField(max_length=255)

    # Score fields
    score = models.IntegerField(default=0)  # Percentage score
    total_questions = models.IntegerField(default=0)
    correct_answers = models.IntegerField(default=0)
    passing_score = models.IntegerField(default=80)  # Passing threshold

    # Status
    passed = models.BooleanField(default=False)

    # Timestamps
    completed_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'assessment_results'
        verbose_name = 'Assessment Result'
        verbose_name_plural = 'Assessment Results'
        unique_together = ['user', 'assessment_id']  # One result per user per assessment
        ordering = ['-completed_at']

    def __str__(self):
        status = "Passed" if self.passed else "Failed"
        return f"{self.user.username} - {self.assessment_title} ({self.score}% - {status})"


class ExamSession(models.Model):
    """
    Model to store exam sessions for the Exam Mode feature.
    Each exam is a unique session with AI-generated questions.
    """
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='exam_sessions')
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES)
    duration_minutes = models.IntegerField(default=30)
    total_questions = models.IntegerField(default=10)
    score = models.FloatField(null=True, blank=True)
    correct_count = models.IntegerField(default=0)
    questions = models.JSONField(default=list)
    student_answers = models.JSONField(default=dict)
    results = models.JSONField(default=list)
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'exam_sessions'
        verbose_name = 'Exam Session'
        verbose_name_plural = 'Exam Sessions'
        ordering = ['-created_at']

    def __str__(self):
        status = f"{self.score:.0f}%" if self.score is not None else "In Progress"
        return f"{self.user.username} - {self.difficulty} ({status})"
