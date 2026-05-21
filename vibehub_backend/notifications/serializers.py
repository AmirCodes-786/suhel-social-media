from rest_framework import serializers
from notifications.models import Notification
from users.serializers import UserSerializer

class NotificationSerializer(serializers.ModelSerializer):
    sender_detail = UserSerializer(source='sender', read_only=True)
    post_content_preview = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ['id', 'recipient', 'sender', 'sender_detail', 'type', 'post', 'comment', 'post_content_preview', 'is_read', 'created_at']
        read_only_fields = ['recipient', 'sender', 'type', 'post', 'comment', 'created_at']

    def get_post_content_preview(self, obj):
        if obj.post:
            return obj.post.content[:40] + '...' if len(obj.post.content) > 40 else obj.post.content
        return None
