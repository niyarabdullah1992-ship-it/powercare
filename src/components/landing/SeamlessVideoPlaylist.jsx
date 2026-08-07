import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

const SeamlessVideoPlaylist = forwardRef(function SeamlessVideoPlaylist({ urls, playing, onClick, onPlaylistEnd }, ref) {
  const videos = useRef([]);
  const timer = useRef(null);
  const advancing = useRef(false);
  const ended = useRef(false);
  const [index, setIndex] = useState(0);
  const [incoming, setIncoming] = useState(null);

  const advance = async () => {
    if (advancing.current || index >= urls.length - 1) return;
    advancing.current = true;
    const next = index + 1;
    const nextVideo = videos.current[next];
    if (!nextVideo) { advancing.current = false; return; }
    await nextVideo.play();
    setIncoming(next);
    timer.current = window.setTimeout(() => {
      videos.current[index]?.pause();
      setIndex(next);
      setIncoming(null);
      advancing.current = false;
    }, 500);
  };

  useEffect(() => {
    if (playing) videos.current[index]?.play();
    else videos.current.forEach((video) => video?.pause());
  }, [playing, index]);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  useImperativeHandle(ref, () => ({
    play: () => videos.current[index]?.play(),
    pause: () => videos.current.forEach((video) => video?.pause()),
    reset: () => { window.clearTimeout(timer.current); videos.current.forEach((video) => { if (video) { video.pause(); video.currentTime = 0; } }); advancing.current = false; ended.current = false; setIncoming(null); setIndex(0); },
    replayLast: () => { const video = videos.current[urls.length - 1]; if (video) { ended.current = false; video.currentTime = 0; video.play(); } },
    remaining: () => videos.current.reduce((sum, video, i) => i < index ? sum : sum + (i === index ? Math.max(0, (video?.duration || 6) - (video?.currentTime || 0)) : (video?.duration || 6)), 0),
  }), [index, urls.length]);

  return <div onClick={onClick} className="relative aspect-video w-full cursor-pointer bg-landing-cinema">{urls.map((url, i) => <video key={url} ref={(node) => { videos.current[i] = node; }} src={url} muted playsInline preload="auto" onTimeUpdate={(event) => { if (i === index && event.currentTarget.duration - event.currentTarget.currentTime < .65) advance(); }} onEnded={() => { if (i < urls.length - 1) advance(); else { ended.current = true; onPlaylistEnd(); } }} className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${i === index || i === incoming ? "opacity-100" : "opacity-0"}`} />)}</div>;
});

export default SeamlessVideoPlaylist;