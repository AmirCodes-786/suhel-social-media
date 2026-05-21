from rest_framework import serializers
from django.contrib.auth import get_user_model
from posts.models import Post, Like, Comment, SavedPost
from users.serializers import UserSerializer

User = get_user_model()

class CommentSerializer(serializers.ModelSerializer):
    author_detail = UserSerializer(source='author', read_only=True)
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'post', 'author', 'author_detail', 'content', 'parent', 'replies', 'created_at']
        read_only_fields = ['author']

    def get_replies(self, obj):
        # Prevent infinite recursion by only returning replies for root comments
        if obj.parent is not None:
            return []
        replies = obj.replies.all()
        # Pass context down to support things like 'is_following' inside nested comments
        return CommentSerializer(replies, many=True, context=self.context).data


class PostSerializer(serializers.ModelSerializer):
    author_detail = UserSerializer(source='author', read_only=True)
    likes_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    is_saved = serializers.SerializerMethodField()
    media = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model = Post
        fields = ['id', 'author', 'author_detail', 'content', 'media', 'media_type', 'likes_count', 'comments_count', 'is_liked', 'is_saved', 'created_at', 'updated_at']
        read_only_fields = ['author', 'created_at', 'updated_at']

    def get_likes_count(self, obj):
        return obj.likes.count()

    def get_comments_count(self, obj):
        return obj.comments.count()

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if not request or request.user.is_anonymous:
            return False
        return Like.objects.filter(user=request.user, post=obj).exists()

    def get_is_saved(self, obj):
        request = self.context.get('request')
        if not request or request.user.is_anonymous:
            return False
        return SavedPost.objects.filter(user=request.user, post=obj).exists()
