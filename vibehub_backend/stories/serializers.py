from rest_framework import serializers
from django.contrib.auth import get_user_model
from stories.models import Story, StoryViewer
from users.serializers import UserSerializer

User = get_user_model()

class StorySerializer(serializers.ModelSerializer):
    author_detail = UserSerializer(source='author', read_only=True)
    viewers_count = serializers.SerializerMethodField()
    is_viewed = serializers.SerializerMethodField()
    media = serializers.FileField(required=True)

    class Meta:
        model = Story
        fields = ['id', 'author', 'author_detail', 'media', 'media_type', 'viewers_count', 'is_viewed', 'created_at', 'expires_at']
        read_only_fields = ['author', 'expires_at', 'created_at']

    def get_viewers_count(self, obj):
        return obj.viewers.count()

    def get_is_viewed(self, obj):
        request = self.context.get('request')
        if not request or request.user.is_anonymous:
            return False
        return StoryViewer.objects.filter(story=obj, viewer=request.user).exists()
