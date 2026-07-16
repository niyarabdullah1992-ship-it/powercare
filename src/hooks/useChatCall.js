import { useCallback, useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";

const ICE = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }] };

export default function useChatCall({ activeChat, selectedStation, contacts, currentUser, company }) {
  const [call, setCall] = useState(null), [incoming, setIncoming] = useState(null), [localStream, setLocalStream] = useState(null), [remoteStreams, setRemoteStreams] = useState([]), [mediaError, setMediaError] = useState("");
  const peers = useRef(new Map()), queuedIce = useRef(new Map()), seen = useRef(new Set()), callRef = useRef(null), streamRef = useRef(null);
  useEffect(() => { callRef.current = call; }, [call]);
  useEffect(() => { streamRef.current = localStream; }, [localStream]);
  const payload = useCallback(() => ({ companyId: company?.id, userId: currentUser?.id, chatType: activeChat?.type, roomId: selectedStation, otherUserId: activeChat?.userId }), [activeChat, company?.id, currentUser?.id, selectedStation]);
  const signal = useCallback((callId, to, type, data = null) => base44.functions.invoke("supabaseTargets", { action: "sendCallSignal", ...payload(), callId, to, type, data }), [payload]);
  const clear = useCallback(() => { peers.current.forEach((pc) => pc.close()); peers.current.clear(); queuedIce.current.clear(); streamRef.current?.getTracks().forEach((t) => t.stop()); setCall(null); setIncoming(null); setLocalStream(null); setRemoteStreams([]); }, []);
  const addPeer = useCallback(async (target, initiator, sessionId, stream) => {
    if (peers.current.has(target)) return peers.current.get(target);
    const pc = new RTCPeerConnection(ICE); peers.current.set(target, pc);
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    pc.ontrack = (event) => setRemoteStreams((old) => old.some((s) => s.id === event.streams[0].id) ? old : [...old, event.streams[0]]);
    pc.onicecandidate = (event) => { if (event.candidate) signal(sessionId, target, "candidate", event.candidate.toJSON()); };
    if (initiator) { const offer = await pc.createOffer(); await pc.setLocalDescription(offer); await signal(sessionId, target, "offer", offer); }
    return pc;
  }, [signal]);
  const requestStream = useCallback(async (mode) => {
    setMediaError("");
    if (!navigator.mediaDevices?.getUserMedia) { setMediaError("unsupported"); return null; }
    try { return await navigator.mediaDevices.getUserMedia({ audio: true, video: mode === "video" }); }
    catch (error) { setMediaError(error?.name === "NotAllowedError" ? "permission" : error?.name === "NotFoundError" ? "device" : "failed"); return null; }
  }, []);
  const activate = useCallback(async (session, stream) => { seen.current.clear(); setLocalStream(stream); setCall(session); setIncoming(null); await signal(session.id, null, "join"); }, [signal]);
  const join = useCallback(async (session) => { const stream = await requestStream(session.mode); if (stream) await activate(session, stream); }, [activate, requestStream]);
  const start = useCallback(async (mode) => {
    if (!activeChat) return; const stream = await requestStream(mode); if (!stream) return;
    try { const participantIds = activeChat.type === "dm" ? [currentUser.id, activeChat.userId] : [currentUser.id, ...contacts.map((c) => c.id)]; const res = await base44.functions.invoke("supabaseTargets", { action: "createCallSession", ...payload(), mode, participantIds, initiatorName: currentUser.name }); await activate(res.data.call, stream); }
    catch { stream.getTracks().forEach((t) => t.stop()); setMediaError("connection"); }
  }, [activeChat, activate, contacts, currentUser, payload, requestStream]);
  const end = useCallback(async () => { if (callRef.current) await base44.functions.invoke("supabaseTargets", { action: "endCallSession", ...payload(), callId: callRef.current.id }).catch(() => {}); clear(); }, [clear, payload]);
  useEffect(() => {
    if (!activeChat) return; let stopped = false;
    const poll = async () => { const res = await base44.functions.invoke("supabaseTargets", { action: "listCallSessions", ...payload() }).catch(() => null); if (stopped) return; const active = res?.data?.calls?.[0]; if (!callRef.current) { setIncoming(active && active.initiatorId !== currentUser.id ? active : null); return; } if (!active) { clear(); return; }
      for (const item of active.signals || []) { if (seen.current.has(item.id) || item.from === currentUser.id || (item.to && item.to !== currentUser.id)) continue; seen.current.add(item.id); const stream = streamRef.current; if (!stream) continue;
        if (item.type === "join") await addPeer(item.from, true, active.id, stream);
        if (item.type === "offer") { const pc = await addPeer(item.from, false, active.id, stream); await pc.setRemoteDescription(item.data); const answer = await pc.createAnswer(); await pc.setLocalDescription(answer); await signal(active.id, item.from, "answer", answer); for (const ice of queuedIce.current.get(item.from) || []) await pc.addIceCandidate(ice).catch(() => {}); queuedIce.current.delete(item.from); }
        if (item.type === "answer") { const pc = peers.current.get(item.from); if (pc) { await pc.setRemoteDescription(item.data); for (const ice of queuedIce.current.get(item.from) || []) await pc.addIceCandidate(ice).catch(() => {}); queuedIce.current.delete(item.from); } }
        if (item.type === "candidate") { const pc = peers.current.get(item.from); if (pc?.remoteDescription) await pc.addIceCandidate(item.data).catch(() => {}); else queuedIce.current.set(item.from, [...(queuedIce.current.get(item.from) || []), item.data]); }
      }
    }; poll(); const timer = setInterval(poll, 1500); return () => { stopped = true; clearInterval(timer); };
  }, [activeChat, addPeer, clear, currentUser.id, payload, signal]);
  useEffect(() => clear, [clear]);
  return { call, incoming, localStream, remoteStreams, mediaError, start, accept: join, dismiss: () => setIncoming(null), end };
}