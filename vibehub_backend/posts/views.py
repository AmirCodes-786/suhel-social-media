from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Count
from django.utils import timezone
from datetime import timedelta
from posts.models import Post, Like, Comment, SavedPost
from posts.serializers import PostSerializer, CommentSerializer
from users.models import Follow

class PostListCreateView(generics.ListCreateAPIView):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Post.objects.all().select_related('author', 'author__profile')

    def perform_create(self, serializer):
        media_file = self.request.FILES.get('media')
        media_type = self.request.data.get('media_type', 'text')
        
        if media_file and media_type == 'text':
            content_type = media_file.content_type
            if content_type and content_type.startswith('image/'):
                media_type = 'image'
            elif content_type and content_type.startswith('video/'):
                media_type = 'video'

        serializer.save(author=self.request.user, media_type=media_type)


class PostDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Post.objects.all()

    def get_object(self):
        obj = super().get_object()
        if self.request.method in ['PUT', 'PATCH', 'DELETE'] and obj.author != self.request.user:
            self.permission_denied(self.request, message="You are not the author of this post.")
        return obj


class FollowingFeedView(generics.ListAPIView):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        followed_users = Follow.objects.filter(follower=user).values_list('following_id', flat=True)
        # Return posts from followed users and self, ordered by created_at desc
        return Post.objects.filter(author_id__in=list(followed_users) + [user.id]).select_related('author', 'author__profile')


class TrendingFeedView(generics.ListAPIView):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Calculate trending posts based on engagement in last 7 days
        time_threshold = timezone.now() - timedelta(days=7)
        return Post.objects.filter(created_at__gte=time_threshold)\
            .annotate(score=Count('likes') + Count('comments'))\
            .order_by('-score', '-created_at')\
            .select_related('author', 'author__profile')


class LikePostView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        post = get_object_or_404(Post, pk=pk)
        like_relation = Like.objects.filter(user=request.user, post=post)

        if like_relation.exists():
            like_relation.delete()
            # Try deleting corresponding notification
            try:
                from notifications.models import Notification
                Notification.objects.filter(
                    recipient=post.author,
                    sender=request.user,
                    type='like',
                    post=post
                ).delete()
            except Exception:
                pass
            return Response({'is_liked': False, 'likes_count': post.likes.count()})

        Like.objects.create(user=request.user, post=post)
        
        # Trigger like notification (if not liking own post)
        if post.author != request.user:
            try:
                from notifications.models import Notification
                Notification.objects.create(
                    recipient=post.author,
                    sender=request.user,
                    type='like',
                    post=post
                )
            except Exception:
                pass

        return Response({'is_liked': True, 'likes_count': post.likes.count()})


class SavePostView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        post = get_object_or_404(Post, pk=pk)
        saved_relation = SavedPost.objects.filter(user=request.user, post=post)

        if saved_relation.exists():
            saved_relation.delete()
            return Response({'is_saved': False})

        SavedPost.objects.create(user=request.user, post=post)
        return Response({'is_saved': True})


class SavedPostsListView(generics.ListAPIView):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Post.objects.filter(saved_by__user=self.request.user).select_related('author', 'author__profile')


class UserPostsListView(generics.ListAPIView):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        username = self.kwargs.get('username')
        return Post.objects.filter(author__username=username).select_related('author', 'author__profile')


class CommentListCreateView(generics.ListCreateAPIView):
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        post_id = self.kwargs.get('post_id')
        # Only return top-level comments (replies are serialized recursively within root comments)
        return Comment.objects.filter(post_id=post_id, parent=None).select_related('author', 'author__profile')

    def perform_create(self, serializer):
        post_id = self.kwargs.get('post_id')
        post = get_object_or_404(Post, id=post_id)
        
        comment = serializer.save(author=self.request.user, post=post)

        # Trigger Comment notifications
        try:
            from notifications.models import Notification
            if comment.parent:
                # Reply case: Notify parent author if not self
                if comment.parent.author != self.request.user:
                    Notification.objects.create(
                        recipient=comment.parent.author,
                        sender=self.request.user,
                        type='comment',
                        post=post,
                        comment=comment
                    )
            elif post.author != self.request.user:
                # Root comment case: Notify post author if not self
                Notification.objects.create(
                    recipient=post.author,
                    sender=self.request.user,
                    type='comment',
                    post=post,
                    comment=comment
                )
        except Exception:
            pass
