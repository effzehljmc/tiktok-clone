import { supabase } from './supabase';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export async function generateThumbnail(videoUri: string): Promise<string> {
  try {
    // Generate thumbnail at 0.1 seconds
    const { uri: thumbnailUri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
      time: 100,
      quality: 0.7
    });

    // Optimize thumbnail size
    const optimizedThumbnail = await manipulateAsync(
      thumbnailUri,
      [{ resize: { width: 400 } }],
      { compress: 0.8, format: SaveFormat.JPEG }
    );

    return optimizedThumbnail.uri;
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    throw error;
  }
}

export async function uploadVideo(
  videoUri: string,
  userId: string,
  title: string,
  description?: string
) {
  try {
    // Generate video ID
    const videoId = crypto.randomUUID();
    
    // Generate thumbnail first
    const thumbnailUri = await generateThumbnail(videoUri);
    
    // Upload thumbnail using FormData
    const thumbnailPath = `thumbnails/${videoId}.jpg`;
    const thumbnailFormData = new FormData();
    thumbnailFormData.append('file', {
      uri: thumbnailUri,
      type: 'image/jpeg',
      name: `${videoId}.jpg`
    } as any);
    
    const { error: thumbnailError } = await supabase.storage
      .from('videos')
      .upload(thumbnailPath, thumbnailFormData, {
        contentType: 'multipart/form-data',
        cacheControl: '3600'
      });

    if (thumbnailError) throw thumbnailError;

    // Get thumbnail URL
    const { data: { publicUrl: thumbnailUrl } } = supabase.storage
      .from('videos')
      .getPublicUrl(thumbnailPath);

    // Upload video using FormData
    const videoPath = `videos/${videoId}.mp4`;
    const videoFormData = new FormData();
    videoFormData.append('file', {
      uri: videoUri,
      type: 'video/mp4',
      name: `${videoId}.mp4`
    } as any);

    const { error: videoError } = await supabase.storage
      .from('videos')
      .upload(videoPath, videoFormData, {
        contentType: 'multipart/form-data',
        cacheControl: '3600'
      });

    if (videoError) throw videoError;

    // Get video URL
    const { data: { publicUrl: videoUrl } } = supabase.storage
      .from('videos')
      .getPublicUrl(videoPath);

    // Create video record in database
    const { error: dbError } = await supabase
      .from('videos')
      .insert([
        {
          id: videoId,
          title,
          description,
          video_url: videoUrl,
          thumbnail_url: thumbnailUrl,
          creator_id: userId,
          status: 'PUBLISHED'
        }
      ]);

    if (dbError) throw dbError;

    return { videoId, videoUrl, thumbnailUrl };
  } catch (error) {
    console.error('Error uploading video:', error);
    throw error;
  }
} 