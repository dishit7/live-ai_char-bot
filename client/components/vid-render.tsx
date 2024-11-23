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

  // Debug video loading
  useEffect(() => {
    if (avatarVideoRef.current) {
      avatarVideoRef.current.addEventListener('loadeddata', () => {
        console.log('AI video loaded');
      });
      avatarVideoRef.current.addEventListener('error', (e) => {
        console.error('AI video error:', e);
      });
    }
  }, []);

  // Modify video handling
  useEffect(() => {
    const videoElement = avatarVideoRef.current;
    if (!videoElement) return;

    const playVideo = async () => {
      try {
        if (isAISpeaking) {
          await videoElement.play();
          console.log('Video playing');
        } else {
          videoElement.pause();
          videoElement.currentTime = 0;
          console.log('Video paused');
        }
      } catch (err) {
        console.error('Video playback error:', err);
      }
    };

    playVideo();
  }, [isAISpeaking]);

  return (
    <div className="grid grid-cols-2 gap-4 p-4 h-[400px]"> {/* Add fixed height */}
      {/* User's video */}
      <div className="relative h-1/2 mt-60 w-1/2"> {/* Add h-full */}
        {userTrackRef ? (
          <VideoTrack 
            trackRef={userTrackRef} 
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <div className="bg-gray-200 rounded-lg p-4  flex items-center justify-center h-1/2">
            Camera off
          </div>
        )}
      </div>

      {/* AI avatar video */}
      <div className="relative h-1/2 mt-60 w-1/2"> {/* Add h-full */}
        <video
          ref={avatarVideoRef}
          src="/ai-vid.mp4"
          className="w-full h-full object-cover rounded-lg"
          loop
          muted
          playsInline
          autoPlay  // Add autoPlay
          style={{ minHeight: '300px' }} // Add minimum height
        />
      </div>
    </div>
  );
}