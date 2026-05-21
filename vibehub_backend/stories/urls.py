from django.urls import path
from stories.views import (
    StoryFeedView,
    MarkStoryViewedView,
    StoryViewersListView
)

urlpatterns = [
    path('', StoryFeedView.as_view(), name='story_feed_create'),
    path('<int:pk>/view/', MarkStoryViewedView.as_view(), name='mark_story_viewed'),
    path('<int:pk>/viewers/', StoryViewersListView.as_view(), name='story_viewers'),
]
