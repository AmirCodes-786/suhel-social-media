import { memo } from 'react'
import { Trash2 } from 'lucide-react'

const MessageBubble = ({
  msg,
  isMe,
  partner,
  onDelete,
  onViewMedia
}) => {
  const isOptimistic = msg.isOptimistic
  const isFailed = msg.failed

  const partnerAvatar =
    partner?.profile?.profile_picture ||
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'

  return (
    <div
      className={`flex items-end gap-2.5 ${isMe ? 'justify-end' : 'justify-start'} group`}
    >
      {!isMe && (
        <img
          src={partnerAvatar}
          alt={partner?.username || 'Partner'}
          className="h-7 w-7 rounded-full border border-slate-100 dark:border-slate-800 object-cover shrink-0 mb-1"
          loading="lazy"
        />
      )}

      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[82%] sm:max-w-[75%]`}>
        <div className="relative group/msg">
          {/* Media Attachment if present */}
          {msg.media && (
            <div className="mb-1 rounded-2xl overflow-hidden max-w-xs cursor-pointer shadow-sm">
              {msg.media_type === 'video' ? (
                <video
                  src={msg.media}
                  controls
                  playsInline
                  className="rounded-2xl max-h-60 w-full object-cover"
                />
              ) : (
                <img
                  src={msg.media}
                  alt="Attachment"
                  className="rounded-2xl max-h-60 w-full object-cover hover:opacity-95 transition-opacity"
                  onClick={() => onViewMedia({ url: msg.media, alt: 'Chat attachment' })}
                  loading="lazy"
                />
              )}
            </div>
          )}

          {/* Message bubble */}
          {msg.content && (
            <div
              className={`p-3 px-4 rounded-2xl text-xs leading-relaxed text-left break-words shadow-sm relative ${
                isMe
                  ? 'bg-indigo-600 text-white rounded-br-none'
                  : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none'
              } ${isOptimistic ? 'opacity-70' : ''} ${isFailed ? 'border-2 border-rose-500' : ''}`}
            >
              {msg.content}
            </div>
          )}

          {/* Delete message action (only for current user's sent message) */}
          {isMe && !isOptimistic && !isFailed && (
            <button
              onClick={() => onDelete(msg.id)}
              className="absolute -left-7 top-1/2 -translate-y-1/2 opacity-0 group-hover/msg:opacity-100 p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              title="Delete message"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Timestamp & Status */}
        <div className="flex items-center gap-1.5 mt-1 px-1">
          <span className="text-[8px] text-slate-400 dark:text-slate-500 font-light">
            {msg.created_at
              ? new Date(msg.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : ''}
          </span>
          {isMe && (
            <span className="text-[9px]">
              {isFailed ? (
                <span className="text-rose-500 font-bold">Failed</span>
              ) : isOptimistic ? (
                <span className="text-indigo-400 font-bold">Sending...</span>
              ) : (
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">✓</span>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default memo(MessageBubble)
