import React from 'react'

export const PostCardSkeleton = () => (
  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 mb-6 shadow-xs shimmer-loader font-outfit">
    {/* Author Header */}
    <div className="flex items-center gap-3 pb-3.5">
      <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 w-28 bg-slate-200 dark:bg-slate-800 rounded-full" />
        <div className="h-2.5 w-20 bg-slate-100 dark:bg-slate-800/60 rounded-full" />
      </div>
    </div>

    {/* Post text placeholder */}
    <div className="space-y-2 mb-3">
      <div className="h-3 w-full bg-slate-100 dark:bg-slate-800/60 rounded-full" />
      <div className="h-3 w-4/5 bg-slate-100 dark:bg-slate-800/60 rounded-full" />
    </div>

    {/* Media placeholder */}
    <div className="w-full h-64 bg-slate-100 dark:bg-slate-800/60 rounded-xl mb-3" />

    {/* Actions */}
    <div className="flex items-center justify-between pt-1">
      <div className="flex items-center gap-5">
        <div className="h-5 w-10 bg-slate-100 dark:bg-slate-800/60 rounded-full" />
        <div className="h-5 w-10 bg-slate-100 dark:bg-slate-800/60 rounded-full" />
        <div className="h-5 w-6 bg-slate-100 dark:bg-slate-800/60 rounded-full" />
      </div>
      <div className="h-5 w-6 bg-slate-100 dark:bg-slate-800/60 rounded-full" />
    </div>
  </div>
)

export const StoriesSkeleton = () => (
  <div className="flex gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xs mb-6 overflow-hidden shimmer-loader">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="flex flex-col items-center shrink-0 space-y-1.5">
        <div className="h-12 w-12 rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="h-2 w-10 bg-slate-100 dark:bg-slate-800/60 rounded-full" />
      </div>
    ))}
  </div>
)

const FeedSkeleton = () => (
  <div className="w-full">
    <StoriesSkeleton />
    <PostCardSkeleton />
    <PostCardSkeleton />
  </div>
)

export default FeedSkeleton
