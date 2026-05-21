from rest_framework import serializers
from django.contrib.auth import get_user_model
from chat.models import Conversation, Message
from users.serializers import UserSerializer

User = get_user_model()

class MessageSerializer(serializers.ModelSerializer):
    sender_detail = UserSerializer(source='sender', read_only=True)
    media = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'sender_detail', 'content', 'media', 'media_type', 'is_read', 'created_at']
        read_only_fields = ['sender', 'is_read', 'created_at']


class ConversationSerializer(serializers.ModelSerializer):
    participants_detail = UserSerializer(source='participants', many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ['id', 'participants', 'participants_detail', 'unread_count', 'last_message', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def get_last_message(self, obj):
        last_msg = obj.messages.order_by('-created_at').first()
        if last_msg:
            # Avoid infinite serialization loop by using a simplified representation or fresh context
            return MessageSerializer(last_msg, context=self.context).data
        return None

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if not request or request.user.is_anonymous:
            return 0
        # Count messages in this conversation where sender is not current user and is_read is False
        return obj.messages.filter(is_read=False).exclude(sender=request.user).count()
