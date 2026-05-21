import React from 'react'
import { Plus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const StoriesBar = ({ groupedStories = [], onStoryClick, onAddStoryClick }) => {
  const { user } = useAuth()

  const currentUserStoriesGroup = groupedStories.find(g => g.user.id === user?.id)
  const hasOwnStory = currentUserStoriesGroup && currentUserStoriesGroup.stories.length > 0

  return (
    <div className="flex gap-4.5 p-4 bg-white border border-slate-100 rounded-2xl overflow-x-auto no-scrollbar shadow-sm mb-6 font-outfit">
      {/* Create Story Button / Own Story */}
      <div 
        className="flex flex-col items-center shrink-0 cursor-pointer group" 
        onClick={() => {
          if (hasOwnStory) {
            onStoryClick(currentUserStoriesGroup)
          } else {
            onAddStoryClick()
          }
        }}
      >
        <div className="relative mb-1">
          {/* Green gradient ring when you have active stories */}
          <div className={`p-[2.5px] rounded-full transition-transform group-hover:scale-105 ${
            hasOwnStory 
              ? 'bg-gradient-to-tr from-emerald-400 via-green-500 to-emerald-600' 
              : 'bg-transparent'
          }`}>
            <div className={`rounded-full ${hasOwnStory ? 'bg-white p-[1.5px]' : ''}`}>
              <img
                src={user?.profile?.profile_picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                alt="Your profile"
                className={`rounded-full border object-cover ${
                  hasOwnStory 
                    ? 'h-[42px] w-[42px] border-transparent' 
                    : 'h-12 w-12 border-slate-200'
                }`}
              />
            </div>
          </div>
          {/* Plus badge overlay */}
          <div className="absolute bottom-0 right-0 h-4.5 w-4.5 rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center text-white group-hover:bg-indigo-700 transition-colors">
            <Plus className="h-2.5 w-2.5 stroke-[3px]" />
          </div>
        </div>
        <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-700 transition-colors">
          Your Story
        </span>
      </div>

      {/* Grouped Stories */}
      {groupedStories.map((group) => {
        if (group.user.id === user?.id) return null

        const allViewed = group.stories.every(story => story.is_viewed)

        return (
          <div 
            key={group.user.id} 
            className="flex flex-col items-center shrink-0 cursor-pointer group"
            onClick={() => onStoryClick(group)}
          >
            <div className={`p-[2px] rounded-full mb-1 transition-transform group-hover:scale-105 ${
              allViewed 
                ? 'bg-slate-200' 
                : 'bg-gradient-to-tr from-emerald-400 via-green-500 to-emerald-600'
            }`}>
              <div className="bg-white p-[1.5px] rounded-full">
                <img
                  src={group.user.profile?.profile_picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                  alt={group.user.username}
                  className="h-10.5 w-10.5 rounded-full object-cover"
                />
              </div>
            </div>
            <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-700 transition-colors max-w-[60px] truncate">
              {group.user.username}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default StoriesBar
