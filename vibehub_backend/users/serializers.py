from rest_framework import serializers
from django.contrib.auth import get_user_model
from users.models import Profile, Follow

User = get_user_model()

class ProfileSerializer(serializers.ModelSerializer):
    profile_picture = serializers.ImageField(required=False, allow_null=True)
    cover_picture = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Profile
        fields = ['bio', 'profile_picture', 'cover_picture', 'website', 'location', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    posts_count = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile', 'followers_count', 'following_count', 'posts_count', 'is_following']
        read_only_fields = ['id', 'email']

    def get_followers_count(self, obj):
        return obj.followers.count()

    def get_following_count(self, obj):
        return obj.following.count()

    def get_posts_count(self, obj):
        # Prevent circular dependency by importing inside method
        return obj.posts.count() if hasattr(obj, 'posts') else 0

    def get_is_following(self, obj):
        request = self.context.get('request')
        if not request or request.user.is_anonymous:
            return False
        # Avoid checking self-follow
        if request.user.id == obj.id:
            return False
        return Follow.objects.filter(follower=request.user, following=obj).exists()
