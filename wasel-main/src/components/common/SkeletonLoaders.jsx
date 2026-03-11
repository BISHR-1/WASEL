import React from 'react';
import { motion } from 'framer-motion';

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="relative aspect-square bg-gray-200 animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
        <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
        <div className="h-10 bg-gray-200 rounded-xl animate-pulse mt-4" />
      </div>
    </div>
  );
}

export function CategorySkeleton() {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-16 h-16 rounded-2xl bg-gray-200 animate-pulse" />
      <div className="h-3 w-12 bg-gray-200 rounded animate-pulse" />
    </div>
  );
}

export function BannerSkeleton() {
  return (
    <div className="w-full aspect-[2.5/1] rounded-2xl bg-gray-200 animate-pulse" />
  );
}

export function OrderCardSkeleton() {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-2 flex-1">
          <div className="h-5 bg-gray-200 rounded w-32 animate-pulse" />
          <div className="h-3 bg-gray-200 rounded w-48 animate-pulse" />
        </div>
        <div className="h-8 w-24 bg-gray-200 rounded-full animate-pulse" />
      </div>
      <div className="bg-gray-50 rounded-xl p-3 mb-4">
        <div className="h-4 bg-gray-200 rounded w-full animate-pulse mb-2" />
        <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
      </div>
      <div className="flex gap-2">
        <div className="flex-1 h-10 bg-gray-200 rounded-xl animate-pulse" />
        <div className="h-10 w-20 bg-gray-200 rounded-xl animate-pulse" />
      </div>
    </div>
  );
}

export function RestaurantCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
      <div className="relative h-72 bg-gray-200 animate-pulse" />
      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between">
          <div className="h-5 bg-gray-200 rounded w-32 animate-pulse" />
          <div className="h-6 w-20 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
        <div className="h-12 bg-gray-200 rounded-xl animate-pulse mt-4" />
      </div>
    </div>
  );
}

export function LoadingSpinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className={`${sizeClasses[size]} border-3 border-gray-200 border-t-yellow-400 rounded-full ${className}`}
    />
  );
}

export default {
  ProductCardSkeleton,
  CategorySkeleton,
  BannerSkeleton,
  OrderCardSkeleton,
  RestaurantCardSkeleton,
  LoadingSpinner
};
