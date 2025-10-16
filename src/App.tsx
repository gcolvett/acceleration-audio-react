import { Pause, Play, SkipBack, SkipForward, StepBack, StepForward } from "lucide-react";
import { useState, useEffect, useRef } from "react";

// Track list
type Track = {
  file: string;
  songTitle: string;
  albumArt: string;
};

const trackList: Track[] = [
  { file: "Better Days - LAKEY INSPIRED.mp3", songTitle: "Better Days", albumArt: "Better Days.jpg" },
  { file: "autumn_sun.mp3", songTitle: "Autumn Sun", albumArt: "autumn_sun.png" },
  { file: "Polarity.mp3", songTitle: "Polarity", albumArt: "Polarity.jpg" },
  { file: "best_part_of_me.mp3", songTitle: "Best Part of Me", albumArt: "BestPart.jpg" },
  { file: "just_relax.mp3", songTitle: "Just Relax", albumArt: "justRelax_img.jpeg" },
  { file: "paranormal-is-real-leonell-cassio.mp3", songTitle: "Paranormal is Real", albumArt: "paranormal_real_500.jpg" },
  { file: "Aidan.mp3", songTitle: "Aidan", albumArt: "Aidan.jpg" },
];

const AcceleratingMusicPlayer = () => {
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [startSpeed, setStartSpeed] = useState(1.0);
  const [maxSpeed, setMaxSpeed] = useState(5.0);
  const [acceleration, setAcceleration] = useState(0.5);

  // const audioRef = useRef(null);
  // const speedIntervalRef = useRef(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speedIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const track = trackList[currentTrack];

  // Start speed acceleration interval
  useEffect(() => {
    if (isPlaying) {
      // Clear any existing interval first
      if (speedIntervalRef.current) {
        clearInterval(speedIntervalRef.current);
      }

      speedIntervalRef.current = setInterval(() => {
        if (!audioRef.current || !audioRef.current.duration) return;

        const currentProgress =
          audioRef.current.currentTime / audioRef.current.duration;
        const speedRange = maxSpeed - startSpeed;
        const accelerationCurve = Math.pow(currentProgress, 1 / acceleration);
        const newSpeed = startSpeed + speedRange * accelerationCurve;
        const clampedSpeed = Math.min(maxSpeed, Math.max(startSpeed, newSpeed));

        audioRef.current.playbackRate = clampedSpeed;
        setPlaybackSpeed(clampedSpeed);
      }, 500);
    } else {
      if (speedIntervalRef.current) {
        clearInterval(speedIntervalRef.current);
      }
    }

    return () => {
      if (speedIntervalRef.current) {
        clearInterval(speedIntervalRef.current);
      }
    };
  }, [isPlaying, startSpeed, maxSpeed, acceleration]);

  // Handle play/pause
  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // Seek backward/forward
  const seekBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, currentTime - 10);
    }
  };

  const seekForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(duration, currentTime + 10);
    }
  };

  const skipForward = () => {
    const nextTrack = (currentTrack + 1) % trackList.length;
    setCurrentTrack(nextTrack);
    setCurrentTime(0)
    setPlaybackSpeed(startSpeed)

    if (isPlaying) {
      setTimeout(() => audioRef.current?.play(), 100);
    }
  };

  const skipBackward = () => {
    if (!audioRef.current) return;

    // If paused and at start, go to previous track
    if (!isPlaying && audioRef.current.currentTime <= 1) {
      const previousTrack = currentTrack === 0 ? trackList.length - 1 : currentTrack - 1;
      setCurrentTrack(previousTrack);
      setCurrentTime(0);
      setPlaybackSpeed(startSpeed);
      return;

    // otherwise, restart the song and pause
    } else {
      audioRef.current.currentTime = 0;
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Format time display
  const formatTime = (seconds) => {
    if (isNaN(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Audio event handlers
  const handleLoadedMetadata = () => {
    setDuration(audioRef.current.duration);
    audioRef.current.playbackRate = startSpeed;
    setPlaybackSpeed(startSpeed);
  };

  const handleTimeUpdate = () => {
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    audioRef.current.playbackRate = startSpeed;
    setPlaybackSpeed(startSpeed);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key.toLowerCase()) {
        case "m":
          event.preventDefault();
          if (audioRef.current) {
            audioRef.current.muted = !audioRef.current.muted;
          }
          break;
        case " ":
          event.preventDefault();
          togglePlay();
          break;
        case "arrowright":
          event.preventDefault();
          if (audioRef.current) {
            audioRef.current.currentTime = Math.min(
              audioRef.current.currentTime + 10,
              audioRef.current.duration
            );
          }
          break;
        case "arrowleft":
          event.preventDefault();
          if (audioRef.current) {
            audioRef.current.currentTime = Math.max(
              audioRef.current.currentTime - 10,
              0
            );
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying]);

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-black py-5 h-[80px]">
        <h1 className="text-white text-3xl font-black text-center uppercase tracking-wider">Acceleration Audio</h1>
      </div>

      <div className="w-full px-[15%]">

        <div className="pt-10 pb-3 text-center text-white">
          <img id="albumArt" src={`/albumArt/${track.albumArt}`} alt="" className="w-70 h-70 m-auto rounded-2xl"/>
          <p className="pt-6">
            <span id="songTitle" className="text-3xl font-black">{track.songTitle}</span>
          </p>
          <p className="pt-3">
            <span id="currentSpeed" className="text-2xl font-black left-[45%] right-[45%]">{playbackSpeed.toFixed(1)}x</span>
          </p>
        </div>

        <div className="text-center items-center">
          <button id="skipBackward" className="pr-3" onClick={skipBackward}>
            <SkipBack className="text-white fill-white w-[40px] h-[40px] active:text-highlight active:fill-highlight"/>
          </button>
          <button id="backButton" className="pr-3" onClick={seekBackward}>
            <StepBack className="text-white fill-white w-[30px] h-[30px] relative top-[-5px] active:text-highlight active:fill-highlight"/>
          </button>
          <button id="playButton" onClick={togglePlay} className={`${
            isPlaying ? "" : ""}`}>
            {isPlaying ? (
              <Pause className="text-white fill-white w-[60px] h-[60px] relative top-[7px] active:text-highlight active:fill-highlight" />
            ) : (
              <Play className="text-white fill-white w-[60px] h-[60px] relative top-[7px] active:text-highlight active:fill-highlight" />
            )}
          </button>
          <button id="skipButton" className="pl-3" onClick={seekForward}>
            <StepForward className="text-white fill-white w-[30px] h-[30px] relative top-[-5px] active:text-highlight active:fill-highlight"/>
          </button>
          <button id="skipForward" className="pl-3" onClick={skipForward}>
            <SkipForward className="text-white fill-white w-[40px] h-[40px] active:text-highlight active:fill-highlight"/>
          </button>
        </div>

        <div className="py-7">
          <p>
            <progress value={progress} max={100} className="w-[300px] block m-auto rounded-full h-10"></progress>
            <div className="flex justify-between w-[300px] m-auto text-sm pt-1">
            </div>
          </p>
        </div>
        
        <audio
          ref={audioRef}
          src={`/songs/${track.file}`}
          id="audioPlayer"
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          preload="auto"/>
      </div>
    </div>
  );
};

export default AcceleratingMusicPlayer;