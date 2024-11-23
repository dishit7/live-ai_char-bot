"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  LiveKitRoom,
  useVoiceAssistant,
  BarVisualizer,
  RoomAudioRenderer,
  VoiceAssistantControlBar,
  AgentState,
  DisconnectButton,
} from "@livekit/components-react";
import { useCallback, useEffect, useState } from "react";
import { MediaDeviceFailure } from "livekit-client";
import { NoAgentNotification } from "@/components/NoAgentNotification";
import { CloseIcon } from "@/components/CloseIcon";
import { useKrispNoiseFilter } from "@livekit/components-react/krisp";
import { ConnectionDetails } from "./api/connection-details/route";
import VideoConferenceRenderer from "@/components/vid-render";

export default function Page() {
  const [connectionDetails, updateConnectionDetails] = useState<ConnectionDetails | undefined>(undefined);
  const [agentState, setAgentState] = useState<AgentState>("disconnected");
  const [isAISpeaking, setIsAISpeaking] = useState(false);

  const onConnectButtonClicked = useCallback(async () => {
    const url = new URL(
      process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ?? "/api/connection-details",
      window.location.origin
    );
    const response = await fetch(url.toString());
    const connectionDetailsData = await response.json();
    updateConnectionDetails(connectionDetailsData);
  }, []);

  return (
    <main data-lk-theme="default" className="h-full grid content-center bg-[var(--lk-bg)]">
      <LiveKitRoom
        token={connectionDetails?.participantToken}
        serverUrl={connectionDetails?.serverUrl}
        connect={connectionDetails !== undefined}
        audio={true}
        video={true}
        onMediaDeviceFailure={(error) => {
          console.error('Media device failure:', error);
          onDeviceFailure(error);
        }}
        onConnected={() => {
          console.log('Connected to LiveKit room');
        }}
        onDisconnected={() => {
          console.log('Disconnected from LiveKit room');
          updateConnectionDetails(undefined);
        }}
        className="grid grid-rows-[2fr_1fr] items-center " // Add h-screen
      >
        <div className="grid grid-rows-[1fr_1fr] gap-4 "> {/* Add h-full */}
          <VideoConferenceRenderer isAISpeaking={isAISpeaking} />
          <SimpleVoiceAssistant 
            onStateChange={setAgentState} 
            onSpeakingChange={(speaking) => {
              console.log('AI speaking state:', speaking);
              setIsAISpeaking(speaking);
            }} 
          />
        </div>

        <ControlBar 
          onConnectButtonClicked={() => {
            console.log('Connect button clicked');
            onConnectButtonClicked();
          }} 
          agentState={agentState} 
        />
        <RoomAudioRenderer />
        <NoAgentNotification state={agentState} />
      </LiveKitRoom>
    </main>
  );

}

function SimpleVoiceAssistant(props: {
  onStateChange: (state: AgentState) => void;
  onSpeakingChange?: (isSpeaking: boolean) => void;
}) {
  const { state, audioTrack } = useVoiceAssistant();
  
  // Monitor audio levels to detect speaking
  useEffect(() => {
    // Check if audioTrack and its publication exist
    if (!audioTrack?.publication?.track) return;
    
    const mediaStream = new MediaStream([audioTrack.publication.track.mediaStreamTrack]);
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(mediaStream);
    source.connect(analyser);
    
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    const checkAudioLevel = () => {
      analyser.getByteFrequencyData(dataArray);
      const audioLevel = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
      const isSpeaking = audioLevel > 30; // Adjust threshold as needed
      props.onSpeakingChange?.(isSpeaking);
      requestAnimationFrame(checkAudioLevel);
    };
    
    checkAudioLevel();
    
    return () => {
      source.disconnect();
      audioContext.close();
    };
  }, [audioTrack, props.onSpeakingChange]);

  useEffect(() => {
    props.onStateChange(state);
  }, [props, state]);

  return (
    <div className="h-[300px] max-w-[90vw] mx-auto">
      <BarVisualizer
        state={state}
        barCount={5}
        trackRef={audioTrack}
        className="agent-visualizer"
        options={{ minHeight: 24 }}
      />
    </div>
  );
}

function ControlBar(props: { onConnectButtonClicked: () => void; agentState: AgentState }) {
  const krisp = useKrispNoiseFilter();
  useEffect(() => {
    krisp.setNoiseFilterEnabled(true);
  }, []);

  return (
    <div className="relative h-[100px]">
      <AnimatePresence>
        {props.agentState === "disconnected" && (
          <motion.button
            initial={{ opacity: 0, top: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, top: "-10px" }}
            transition={{ duration: 1, ease: [0.09, 1.04, 0.245, 1.055] }}
            className="uppercase absolute left-1/2 -translate-x-1/2 px-4 py-2 bg-white text-black rounded-md"
            onClick={() => props.onConnectButtonClicked()}
          >
            Start a conversation
          </motion.button>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {props.agentState !== "disconnected" && props.agentState !== "connecting" && (
          <motion.div
            initial={{ opacity: 0, top: "10px" }}
            animate={{ opacity: 1, top: 0 }}
            exit={{ opacity: 0, top: "-10px" }}
            transition={{ duration: 0.4, ease: [0.09, 1.04, 0.245, 1.055] }}
            className="flex h-8 absolute left-1/2 -translate-x-1/2  justify-center"
          >
            <VoiceAssistantControlBar controls={{ leave: false }} />
            <DisconnectButton>
              <CloseIcon />
            </DisconnectButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function onDeviceFailure(error?: MediaDeviceFailure) {
  console.error(error);
  alert(
    "Error acquiring camera or microphone permissions. Please make sure you grant the necessary permissions in your browser and reload the tab"
  );
}
