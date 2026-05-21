from django.urls import path
from posts.views import (
    PostListCreateView,
    PostDetailView,
    FollowingFeedView,
    TrendingFeedView,
    LikePostView,
    SavePostView,
    SavedPostsListView,
    UserPostsListView,
    CommentListCreateView
)

urlpatterns = [
    path('', PostListCreateView.as_view(), name='post_list_create'),
    path('feed/', FollowingFeedView.as_view(), name='following_feed'),
    path('trending/', TrendingFeedView.as_view(), name='trending_feed'),
    path('saved/', SavedPostsListView.as_view(), name='saved_posts'),
    path('user/<str:username>/', UserPostsListView.as_view(), name='user_posts'),
    path('<int:pk>/', PostDetailView.as_view(), name='post_detail'),
    path('<int:pk>/like/', LikePostView.as_view(), name='like_post'),
    path('<int:pk>/save/', SavePostView.as_view(), name='save_post'),
    path('<int:post_id>/comments/', CommentListCreateView.as_view(), name='comment_list_create'),
]
