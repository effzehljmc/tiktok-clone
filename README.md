import React from 'react';
# TikTok Clone

A modern TikTok clone built with Expo, React Native, and TypeScript.

## Features Implemented

### Video Feed
- ✅ Vertical scrolling video feed with snap functionality
- ✅ Auto-play videos when in view
- ✅ Custom play/pause controls
- ✅ Video descriptions and user information overlay
- ✅ Proper video state management (pause other videos when scrolling)
- ✅ Performance optimizations (video preloading, recycling)
- ✅ Header with contextual back button and search functionality
- ✅ Search overlay with modern UI

### Recipe Features
- ✅ Dedicated recipe feed with tab navigation
- ✅ Recipe metadata display (cooking time, servings, calories)
- ✅ Difficulty level badges (Beginner/Intermediate/Advanced)
- ✅ Recipe details modal with ingredients and steps
- ✅ Cuisine type indicators
- ✅ Dietary preference tags (Vegetarian, Vegan, etc.)
- ✅ Shopping list integration with ingredient management
- ✅ Recipe search functionality
- ✅ Recipe filtering by dietary preferences
- ⏳ Video timestamp jumping for recipe steps
- ✅ Recipe saving/bookmarking
- ✅ Recipe sharing functionality

### Shopping List
- ✅ Dedicated shopping list tab
- ✅ Add ingredients from recipes
- ✅ Check/uncheck items
- ✅ Delete individual items
- ✅ Clear checked items
- ✅ Share list functionality
- ✅ Quantity and unit parsing
- ✅ Empty state handling
- ✅ Toast notifications for actions
- ✅ Loading and error states

### Comments System
- ✅ Modal comments view with smooth animations
- ✅ Real-time comment updates
- ✅ Optimistic updates for better UX
- ✅ Comment count tracking
- ✅ Proper error handling and retry mechanisms
- ✅ Pull-to-refresh functionality
- ✅ Keyboard-aware input handling

### Creator Profiles
- ✅ Grid view of creator's videos
- ✅ Basic profile information display
- ✅ Video thumbnails with view counts
- ✅ Navigation to full video view
- ✅ Error handling and loading states
- ✅ Responsive grid layout

## Getting Started

1. Install dependencies
   ```bash
   npm install
   ```

2. Start the development server
   ```bash
   npx expo start
   ```

## Tech Stack
- Expo
- React Native
- TypeScript
- expo-av for video playback
- Supabase for backend and storage
- Prisma for database management
- React Query for data fetching
- React Native Reanimated for animations

## Development Progress

### Current Branch: fix/profile-thumbnails
- Removed on-the-fly thumbnail generation to improve stability
- Simplified creator profile screen implementation
- Fixed profile navigation crashes
- Enhanced error handling and user feedback
- Improved performance by removing heavy image processing

### Thumbnail Management
Video thumbnails are now managed manually through the database:
- Thumbnails are pre-generated and stored in Supabase storage
- Thumbnail URLs are stored in the videos table under `thumbnail_url`
- This approach provides better stability and performance
- Removes the need for client-side image processing

## Next Steps
- Set up automated thumbnail generation pipeline
- Implement video upload functionality
- Add user authentication
- Implement likes system
- Enhance user profiles

## Recent Updates

### Shopping List Integration (March 2024)
- Added dedicated shopping list tab with modern UI
- Implemented comprehensive shopping list management:
  - Add ingredients directly from recipes
  - Check/uncheck items for purchase tracking
  - Delete individual items or clear checked items
  - Share list via native share sheet
  - Smart quantity and unit parsing
- Enhanced UX with:
  - Toast notifications for all actions
  - Empty state messaging
  - Loading and error states
  - Safe area handling
  - Proper keyboard interaction

### Recipe Integration (March 2024)
- Added dedicated recipe feed with tab navigation
- Implemented recipe metadata system with:
  - Cooking time, servings, and calorie information
  - Difficulty level badges
  - Cuisine type indicators
  - Dietary preference tags
- Added recipe details modal showing:
  - Ingredient lists
  - Step-by-step instructions
  - Equipment needed
  - Timestamp markers for video steps
- Enhanced UI with consistent styling:
  - Semi-transparent overlays for better readability
  - Improved icon visibility and positioning
  - Smooth transitions between feeds

### Next Steps
- Complete recipe search implementation
- Add filtering system for dietary preferences
- Enable timestamp-based navigation in recipe videos
- Implement recipe saving and sharing
- Add social features (following, sharing)
- Enhance user profiles with saved recipes

## Contributing
1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License
MIT

## Video Metrics System

The app includes a comprehensive video metrics tracking system that collects engagement data for the recommendation algorithm:

### Tracked Metrics
- **Views**: Counts unique views per user session
- **Watch Time**: Tracks seconds watched per video
- **Completion Rate**: Marks videos as completed when 90% watched
- **Replay Count**: Tracks how many times a user replays a video
- **Average Watch Percentage**: Calculates the average percentage watched across replays
- **Last Position**: Stores the last playback position for resume functionality

### Technical Implementation
- Uses Prisma for database schema and migrations
- Implements RPC functions for atomic view counting
- Batches updates to reduce database load
- Includes retry logic for failed updates
- Maintains session-based view tracking

### Database Structure
```prisma
model VideoMetrics {
  id                   String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  videoId             String   @map("video_id") @db.Uuid
  userId              String   @map("user_id") @db.Uuid
  watchedSeconds      Int      @default(0)
  watchedAt           DateTime @default(now())
  lastPosition        Int      @default(0)
  completed           Boolean  @default(false)
  replayCount         Int      @default(0)
  averageWatchPercent Float    @default(0)
  // ... relations and indexes
}
```

### Usage
The metrics system automatically tracks user engagement through the `useVideoMetrics` hook:
```typescript
const { trackVideoMetrics } = useVideoMetrics();

// In video component
onPlaybackStatusUpdate={(status) => {
  trackVideoMetrics(videoId, status, prevStatus);
}}
```
