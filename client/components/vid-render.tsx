import { useEffect, useRef, useState } from "react";
import { useTracks, VideoTrack } from "@livekit/components-react";
import { Track } from "livekit-client";

interface VideoConferenceRendererProps {
  isAISpeaking: boolean;
}

export default function VideoConferenceRenderer({ isAISpeaking }: VideoConferenceRendererProps) {
  const trackRefs = useTracks([Track.Source.Camera]);
  const userTrackRef = trackRefs.find((trackRef) => trackRef.participant.isLocal);
  const avatarVideoRef = useRef<HTMLVideoElement>(null);
  const [isTestPlaying, setIsTestPlaying] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);

  // Handle video loading
  useEffect(() => {
    if (avatarVideoRef.current) {
      avatarVideoRef.current.addEventListener('loadeddata', () => {
        setIsVideoReady(true);
        console.log('Video loaded and ready');
      });
    }
  }, []);

  // Handle video playback
  useEffect(() => {
    const videoElement = avatarVideoRef.current;
    if (!videoElement || !isVideoReady) return;

    const playVideo = async () => {
      try {
        if (isAISpeaking || isTestPlaying) {
          if (videoElement.paused) {
            videoElement.currentTime = 0;
            await videoElement.play();
            console.log('Playing video');
          }
        } else {
          if (!videoElement.paused) {
            videoElement.pause();
            videoElement.currentTime = 0;
            console.log('Paused video');
          }
        }
      } catch (err) {
        console.error('Video playback error:', err);
      }
    };

    playVideo();
  }, [isAISpeaking, isTestPlaying, isVideoReady]);

  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      {/* User's video */}
      <div className="relative h-1/2 mt-60 w-1/2">
        {userTrackRef ? (
          <VideoTrack 
            trackRef={userTrackRef} 
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <div className="bg-gray-200 rounded-lg p-4 flex items-center justify-center">
            Camera off
          </div>
        )}
      </div>

      {/* AI avatar video */}
      <div className="relative h-1/2 mt-60 w-1/2">
        <video
          ref={avatarVideoRef}
          src="/ai-vid.mp4"
          className="w-full h-full object-cover rounded-lg"
          loop
          muted
          playsInline
        />
        
        {/* Debug information */}
        <div className="absolute top-2 left-2 text-white text-sm bg-black/50 p-1 rounded">
          {isAISpeaking ? 'AI Speaking' : 'AI Silent'}
        </div>
        
        <button
          onClick={() => setIsTestPlaying(!isTestPlaying)}
          className="absolute bottom-4 right-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          {isTestPlaying ? 'Stop Test' : 'Test Avatar'}
        </button>
      </div>
    </div>
  );
}
