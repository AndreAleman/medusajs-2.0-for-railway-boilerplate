// youtubePreview.tsx
import type { PreviewProps } from 'sanity';
import { Flex, Text } from '@sanity/ui';
import ReactPlayer from 'react-player'; // Use the main ReactPlayer import

export function YouTubePreview(props: PreviewProps) {
  const { title: url } = props;

  return (
    <Flex padding={3} align="center" justify="center">
      {typeof url === 'string' && url.includes('youtube.com') ? ( // Check if it's a YouTube URL
        <ReactPlayer src={url} />
      ) : (
        <Text>Add a valid YouTube URL</Text>
      )}
    </Flex>
  );
}