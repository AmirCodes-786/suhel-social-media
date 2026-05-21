from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Conversation(models.Model):
    participants = models.ManyToManyField(User, related_name='conversations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        participants_list = ", ".join([user.username for user in self.participants.all()[:3]])
        return f"Conversation {self.id} between [{participants_list}]"


class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField(blank=True, default='')
    media = models.FileField(upload_to='chat/media/', blank=True, null=True)
    media_type = models.CharField(max_length=10, choices=[('text', 'Text'), ('image', 'Image')], default='text')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Update conversation's updated_at field when a new message is saved
        self.conversation.updated_at = self.created_at or models.functions.Now()
        self.conversation.save(update_fields=['updated_at'])

    def __str__(self):
        return f"Message {self.id} by {self.sender.username} in Conv {self.conversation.id}"
