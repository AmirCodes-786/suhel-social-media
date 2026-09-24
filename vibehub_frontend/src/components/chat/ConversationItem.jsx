import { memo } from 'react'

const ConversationItem = ({
  conv,
  isSelected,
  partner,
  onSelect
}) => {
  const avatar =
    partner?.profile?.profile_picture ||
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'

  return (
    <div
      onClick={() => onSelect(conv)}
      className={`flex items-center gap-3.5 p-3.5 rounded-2xl cursor-pointer transition-all border ${
        isSelected
          ? 'bg-indigo-50 dark:bg-indigo-950/50 border-transparent text-indigo-900 dark:text-indigo-200 font-semibold'
          : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300'
      }`}
    >
      <div className="relative shrink-0">
        <img
          src={avatar}
          alt={partner?.username || 'User'}
          className="h-10 w-10 rounded-full border border-slate-100 dark:border-slate-800 object-cover"
          loading="lazy"
        />
        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"></span>
      </div>

      <div className="flex-1 min-w-0 text-left">
        <div className="flex justify-between items-baseline mb-0.5">
          <span className="text-xs font-bold truncate leading-tight text-slate-800 dark:text-slate-100">
            {partner?.username}
          </span>
          <span className="text-[8px] text-slate-400 dark:text-slate-500 font-light">
            {conv.last_message
              ? new Date(conv.last_message.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : ''}
          </span>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate leading-snug">
          {conv.last_message?.content ||
            (conv.last_message?.media ? 'Sent a photo' : 'No messages')}
        </p>
      </div>

      {conv.unread_count > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[9px] font-bold text-white shrink-0">
          {conv.unread_count}
        </span>
      )}
    </div>
  )
}

export default memo(ConversationItem)
