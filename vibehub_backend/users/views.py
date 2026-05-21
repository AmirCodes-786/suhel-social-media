import logging

from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.db.models import Q
from users.models import Profile, Follow
from users.serializers import UserSerializer, ProfileSerializer

logger = logging.getLogger(__name__)
User = get_user_model()

class CurrentUserView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        
        # Update user standard fields
        username = request.data.get('username')
        if username and username != user.username:
            if User.objects.filter(username=username).exclude(id=user.id).exists():
                return Response({'error': 'Username already taken'}, status=status.HTTP_400_BAD_REQUEST)
            user.username = username
        
        user.first_name = request.data.get('first_name', user.first_name)
        user.last_name = request.data.get('last_name', user.last_name)
        user.save()

        # Update profile fields
        profile, _ = Profile.objects.get_or_create(user=user)
        profile_serializer = ProfileSerializer(profile, data=request.data, partial=True)
        if profile_serializer.is_valid():
            profile_serializer.save()
            return Response(UserSerializer(user, context={'request': request}).data)
        return Response(profile_serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([AllowAny])
def me(request):
    print('ME VIEW HIT')
    return Response({
        "success": True,
        "message": "Django API working",
        "user": str(request.user),
        "authenticated": request.user.is_authenticated,
    })


class UserProfileView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = User.objects.all()
    lookup_field = 'username'


class FollowUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, username):
        user_to_follow = get_object_or_404(User, username=username)
        if user_to_follow == request.user:
            return Response({'error': 'You cannot follow yourself'}, status=status.HTTP_400_BAD_REQUEST)

        follow_relation = Follow.objects.filter(follower=request.user, following=user_to_follow)

        if follow_relation.exists():
            follow_relation.delete()
            
            # Delete notifications if any
            try:
                from notifications.models import Notification
                Notification.objects.filter(
                    recipient=user_to_follow,
                    sender=request.user,
                    type='follow'
                ).delete()
            except Exception:
                pass

            return Response({'is_following': False, 'message': f'Unfollowed {username}'})

        Follow.objects.create(follower=request.user, following=user_to_follow)

        # Trigger follow notification
        try:
            from notifications.models import Notification
            Notification.objects.create(
                recipient=user_to_follow,
                sender=request.user,
                type='follow'
            )
        except Exception:
            pass

        return Response({'is_following': True, 'message': f'Followed {username}'})


class FollowersListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        username = self.kwargs.get('username')
        user = get_object_or_404(User, username=username)
        return User.objects.filter(following__following=user)


class FollowingListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        username = self.kwargs.get('username')
        user = get_object_or_404(User, username=username)
        return User.objects.filter(followers__follower=user)


class UserSearchView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        query = self.request.query_params.get('q', '')
        if not query:
            return User.objects.none()
        return User.objects.filter(
            Q(username__icontains=query) |
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query)
        ).distinct()


class CreatorSuggestionsView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        followed_users = Follow.objects.filter(follower=user).values_list('following_id', flat=True)
        # Suggest users who are not followed and not self
        return User.objects.exclude(
            Q(id=user.id) | Q(id__in=followed_users)
        ).order_by('?')[:5]
