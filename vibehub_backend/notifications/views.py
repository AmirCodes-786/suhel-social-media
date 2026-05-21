from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from notifications.models import Notification
from notifications.serializers import NotificationSerializer

class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.notifications.all().select_related('sender', 'sender__profile', 'post')

    # POST to mark all as read
    def post(self, request, *args, **kwargs):
        unread_notifications = request.user.notifications.filter(is_read=False)
        count = unread_notifications.count()
        unread_notifications.update(is_read=True)
        return Response({'success': True, 'marked_read_count': count})


class MarkNotificationReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        notification = get_object_or_404(request.user.notifications.all(), pk=pk)
        notification.is_read = True
        notification.save()
        return Response({'success': True})


class UnreadNotificationCountView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        count = request.user.notifications.filter(is_read=False).count()
        return Response({'unread_count': count})
