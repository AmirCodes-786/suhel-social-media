from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from chat.models import Conversation, Message
from chat.serializers import ConversationSerializer, MessageSerializer

User = get_user_model()

class ConversationListCreateView(generics.ListCreateAPIView):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.conversations.all().prefetch_related('participants', 'participants__profile')

    def create(self, request, *args, **kwargs):
        participant_ids = request.data.get('participants', [])
        
        # Parse inputs to array of IDs
        if isinstance(participant_ids, str) or isinstance(participant_ids, int):
            participant_ids = [participant_ids]
        
        # Ensure values are strings (Supabase UUIDs)
        participant_ids = [str(uid) for uid in participant_ids]
        
        if str(request.user.id) not in participant_ids:
            participant_ids.append(str(request.user.id))

        # Check if 1-on-1 conversation already exists to prevent duplicates
        if len(participant_ids) == 2:
            other_user_id = [uid for uid in participant_ids if uid != str(request.user.id)][0]
            existing_conv = Conversation.objects.filter(participants__id=request.user.id).filter(participants__id=other_user_id).first()
            if existing_conv:
                serializer = self.get_serializer(existing_conv)
                return Response(serializer.data)

        # Create new conversation
        conversation = Conversation.objects.create()
        users = User.objects.filter(id__in=participant_ids)
        conversation.participants.set(users)
        conversation.save()

        serializer = self.get_serializer(conversation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ConversationDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.conversations.all()


class MessageListCreateView(generics.ListCreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        conversation_id = self.kwargs.get('conversation_id')
        conversation = get_object_or_404(self.request.user.conversations.all(), id=conversation_id)
        return conversation.messages.all()

    def perform_create(self, serializer):
        conversation_id = self.kwargs.get('conversation_id')
        conversation = get_object_or_404(self.request.user.conversations.all(), id=conversation_id)
        
        media_file = self.request.FILES.get('media')
        media_type = self.request.data.get('media_type', 'text')
        
        if media_file and media_type == 'text':
            content_type = media_file.content_type
            if content_type and content_type.startswith('image/'):
                media_type = 'image'

        message = serializer.save(sender=self.request.user, conversation=conversation, media_type=media_type)

        # Trigger message notifications for other participants
        for participant in conversation.participants.exclude(id=self.request.user.id):
            try:
                from notifications.models import Notification
                Notification.objects.create(
                    recipient=participant,
                    sender=self.request.user,
                    type='message'
                )
            except Exception:
                pass


class MarkConversationReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, conversation_id):
        conversation = get_object_or_404(request.user.conversations.all(), id=conversation_id)
        unread_messages = conversation.messages.filter(is_read=False).exclude(sender=request.user)
        unread_count = unread_messages.count()
        unread_messages.update(is_read=True)
        return Response({'success': True, 'marked_read_count': unread_count})
