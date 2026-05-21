from django.urls import path
from notifications.views import (
    NotificationListView,
    MarkNotificationReadView,
    UnreadNotificationCountView
)

urlpatterns = [
    path('', NotificationListView.as_view(), name='notification_list'),
    path('unread-count/', UnreadNotificationCountView.as_view(), name='unread_count'),
    path('<int:pk>/read/', MarkNotificationReadView.as_view(), name='mark_read'),
]
