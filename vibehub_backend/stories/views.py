from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q
from stories.models import Story, StoryViewer
from stories.serializers import StorySerializer
from users.models import Follow
from users.serializers import UserSerializer

class StoryFeedView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        now = timezone.now()
        followed_users = Follow.objects.filter(follower=request.user).values_list('following_id', flat=True)
        # Fetch stories that haven't expired from followed users + self
        stories = Story.objects.filter(
            expires_at__gt=now,
            author_id__in=list(followed_users) + [request.user.id]
        ).select_related('author', 'author__profile').order_by('created_at')

        # Group stories by author in a structured format
        grouped_stories = {}
        for story in stories:
            author_id = str(story.author.id)
            if author_id not in grouped_stories:
                user_data = UserSerializer(story.author, context={'request': request}).data
                grouped_stories[author_id] = {
                    'user': user_data,
                    'stories': []
                }
            grouped_stories[author_id]['stories'].append(
                StorySerializer(story, context={'request': request}).data
            )
        
        # Convert dictionary to list and place current user's stories first
        grouped_list = list(grouped_stories.values())
        # Stable sort: current user story first
        grouped_list.sort(key=lambda x: x['user']['id'] != str(request.user.id))

        return Response(grouped_list)

    def post(self, request):
        media_file = request.FILES.get('media')
        if not media_file:
            return Response({'error': 'Media file is required.'}, status=status.HTTP_400_BAD_REQUEST)

        media_type = request.data.get('media_type', 'image')
        content_type = media_file.content_type
        if content_type:
            if content_type.startswith('video/'):
                media_type = 'video'
            else:
                media_type = 'image'

        serializer = StorySerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(author=request.user, media_type=media_type)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MarkStoryViewedView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        story = get_object_or_404(Story, pk=pk)
        
        # Don't register views for own story (optional, standard social behavior)
        if story.author == request.user:
            return Response({'success': True, 'message': 'Owner view not registered'})

        StoryViewer.objects.get_or_create(
            story=story,
            viewer=request.user
        )
        return Response({'success': True})


class StoryViewersListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        story_id = self.kwargs.get('pk')
        story = get_object_or_404(Story, pk=story_id)
        
        # Only the author can see viewers
        if story.author != self.request.user:
            self.permission_denied(self.request, message="Only the story creator can view the viewer list.")
            
        # Get users who viewed this story
        return UserSerializer.Meta.model.objects.filter(story_views__story=story)
