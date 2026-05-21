from django.urls import path
from users.views import (
    CurrentUserView,
    UserProfileView,
    FollowUserView,
    FollowersListView,
    FollowingListView,
    UserSearchView,
    CreatorSuggestionsView,
)

urlpatterns = [
    path('me/', CurrentUserView.as_view(), name='current_user'),
    path('search/', UserSearchView.as_view(), name='user_search'),
    path('suggestions/', CreatorSuggestionsView.as_view(), name='creator_suggestions'),
    path('<str:username>/', UserProfileView.as_view(), name='user_profile'),
    path('<str:username>/follow/', FollowUserView.as_view(), name='follow_user'),
    path('<str:username>/followers/', FollowersListView.as_view(), name='user_followers'),
    path('<str:username>/following/', FollowingListView.as_view(), name='user_following'),
]

