from rest_framework.authentication import SessionAuthentication


class CsrfExemptSessionAuthentication(SessionAuthentication):
    """
    Custom session authentication class that doesn't enforce CSRF.
    Use this for API endpoints that need to be accessed from frontend on different origin.
    """

    def enforce_csrf(self, request):
        # Skip CSRF check
        return
