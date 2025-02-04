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

## Development Progress

### Current Branch: feature/video-feed
- Implemented core video feed functionality
- Added video playback controls
- Optimized scroll performance and video loading
- Fixed layout issues with status bar and tab bar

## Next Steps
- Implement video upload functionality
- Add user authentication
- Implement comments and likes
- Add user profiles

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
