import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Play, Pause, Send, AlertCircle } from 'lucide-react';

interface VoiceRecorderProps {
  onSendVoice: (audioBlob: Blob, durationSeconds: number) => void;
  onCancel: () => void;
  maxDurationSeconds?: number;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onSendVoice,
  onCancel,
  maxDurationSeconds = 180,
}) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const recordedBlobRef = useRef<Blob | null>(null);

  useEffect(() => {
    startRecording();
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
  };

  const startRecording = async () => {
    try {
      setPermissionError(null);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setPermissionError('Audio recording is not supported in this browser environment.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      // Prefer standard webm audio or mp4
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/ogg';
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        recordedBlobRef.current = audioBlob;
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setIsRecording(false);
      };

      recorder.start(100);
      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          if (prev + 1 >= maxDurationSeconds) {
            stopRecording();
            return maxDurationSeconds;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      console.error('Microphone access denied:', err);
      setPermissionError('Microphone permission was denied or microphone is not available.');
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
  };

  const togglePlayback = () => {
    if (!audioPlayerRef.current || !audioUrl) return;

    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const handleSend = () => {
    if (recordedBlobRef.current && duration > 0) {
      onSendVoice(recordedBlobRef.current, duration);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  if (permissionError) {
    return (
      <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-red-600 dark:text-red-400 text-sm">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{permissionError}</span>
        </div>
        <button
          onClick={onCancel}
          className="px-3 py-1 text-xs font-semibold bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 transition"
        >
          Dismiss
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 animate-fadeIn">
      {isRecording ? (
        <>
          <div className="flex items-center gap-2 px-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="font-mono text-sm font-semibold text-red-600 dark:text-red-400">
              {formatTime(duration)}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              (max {Math.floor(maxDurationSeconds / 60)}m)
            </span>
          </div>

          <div className="flex-1 flex items-center gap-1 h-5 overflow-hidden">
            {[40, 75, 30, 90, 50, 100, 65, 45, 80, 55, 90, 40].map((h, i) => (
              <span
                key={i}
                className="w-1 bg-red-500/70 rounded-full animate-pulse"
                style={{
                  height: `${h}%`,
                  animationDelay: `${i * 80}ms`,
                  animationDuration: '600ms'
                }}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={stopRecording}
            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition shadow-sm"
            title="Stop & Preview"
          >
            <Square className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition"
            title="Cancel"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </>
      ) : (
        <>
          {audioUrl && (
            <audio
              ref={audioPlayerRef}
              src={audioUrl}
              onEnded={handleAudioEnded}
              className="hidden"
            />
          )}

          <button
            type="button"
            onClick={togglePlayback}
            className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-sm"
            title={isPlaying ? 'Pause' : 'Play Preview'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          <div className="flex-1">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Voice Note ({formatTime(duration)})
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Ready to send</p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="p-2 text-slate-500 hover:text-red-500 transition"
            title="Discard"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleSend}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Voice</span>
          </button>
        </>
      )}
    </div>
  );
};
