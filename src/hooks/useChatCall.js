import { useCallback, useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";

const rtcConfig = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

export default function useChatCall({ activeChat, selectedStation, contacts, currentUser, company }) {
  const [call, setCall] = useState(null);
  const [incoming, setIncoming] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState([]);
  const [mediaError, setMediaError] = useState("");
  const peersRef = useRef(new Map());
  const seenRef = useRef(new Set());
  const joinedAtRef = useRef(0);
  const callRef = useRef(null);
  useEffect(() => { callRef.current = call; }, [call]);

  const payload = useCallback(() => ({ companyId: company?.id, userId: currentUser?.id, chatType: activeChat?.type, roomId: selectedStation, otherUserId: activeChat?.userId }), [activeChat, selectedStation, company?.id, currentUser?.id]);
  const signal = useCallback((callId, to, type, data = null) => base44.functions.invoke("supabaseTargets", { action: "sendCallSignal", companyId: company?.id, userId: currentUser?.id, callId, to, type, data }), [company?.id, currentUser?.id]);

  const createPeer = useCallback((peerId, session, offer) => {
    if (!peerId || peerId === currentUser.id || peersRef.current.has(peerId)) return peersRef.current.get(peerId);
    const pc = new RTCPeerConnection(rtcConfig);
    localStream?.getTracks().forEach((track) => pc.addTrack(track, localStream));
    pc.onicecandidate = (event) => { if (event.candidate) signal(session.id, peerId, "ice", event.candidate.toJSON()); };
    pc.ontrack = (event) => setRemoteStreams((prev) => prev.some((stream) => stream.id === event.streams[0].id) ? prev : [...prev, event.streams[0]]);
    peersRef.current.set(peerId, pc);
    if (offer) pc.createOffer().then((description) => pc.setLocalDescription(description).then(() => signal(session.id, peerId, "offer", description)));
    return pc;
  }, [currentUser?.id, localStream, signal]);

  const processSignals = useCallback(async (session) => {
    for (const item of session.signals || []) {
      if (seenRef.current.has(item.id) || new Date(item.createdAt).getTime() < joinedAtRef.current || (item.to && item.to !== currentUser.id) || item.from === currentUser.id) continue;
      seenRef.current.add(item.id);
      if (item.type === "join") createPeer(item.from, session, true);
      if (item.type === "offer") { const pc = createPeer(item.from, session, false); await pc.setRemoteDescription(item.data); const answer = await pc.createAnswer(); await pc.setLocalDescription(answer); await signal(session.id, item.from, "answer", answer); }
      if (item.type === "answer") await peersRef.current.get(item.from)?.setRemoteDescription(item.data);
      if (item.type === "ice") await peersRef.current.get(item.from)?.addIceCandidate(item.data).catch(() => {});
    }
  }, [createPeer, currentUser?.id, signal]);

  const requestStream = useCallback(async (mode) => {
    setMediaError("");
    if (!navigator.mediaDevices?.getUserMedia) { setMediaError("unsupported"); return null; }
    try {
      return await navigator.mediaDevices.getUserMedia({ audio: true, video: mode === "video" });
    } catch (error) {
      setMediaError(error?.name === "NotAllowedError" ? "permission" : error?.name === "NotFoundError" ? "device" : "failed");
      return null;
    }
  }, []);

  const activate = useCallback(async (session, stream) => {
    joinedAtRef.current = Date.now(); seenRef.current.clear(); setLocalStream(stream); setCall(session); setIncoming(null);
    await signal(session.id, null, "join");
  }, [signal]);

  const join = useCallback(async (session) => {
    const stream = await requestStream(session.mode);
    if (stream) await activate(session, stream);
  }, [activate, requestStream]);

  const start = useCallback(async (mode) => {
    if (!activeChat) return;
    const stream = await requestStream(mode);
    if (!stream) return;
    try {
      const participantIds = activeChat.type === "dm" ? [currentUser.id, activeChat.userId] : [currentUser.id, ...contacts.map((contact) => contact.id)];
      const response = await base44.functions.invoke("supabaseTargets", { action: "createCallSession", ...payload(), mode, participantIds, initiatorName: currentUser.name });
      await activate(response.data.call, stream);
    } catch {
      stream.getTracks().forEach((track) => track.stop());
      setMediaError("connection");
    }
  }, [activeChat, contacts, currentUser, activate, payload, requestStream]);

  const end = useCallback(async () => {
    const active = callRef.current;
    localStream?.getTracks().forEach((track) => track.stop());
    peersRef.current.forEach((pc) => pc.close()); peersRef.current.clear();
    setLocalStream(null); setRemoteStreams([]); setCall(null);
    if (active) await base44.functions.invoke("supabaseTargets", { action: "endCallSession", companyId: company?.id, userId: currentUser?.id, callId: active.id });
  }, [localStream, company?.id, currentUser?.id]);

  useEffect(() => {
    if (!activeChat) return;
    const poll = async () => {
      const response = await base44.functions.invoke("supabaseTargets", { action: "listCallSessions", ...payload() }).catch(() => null);
      const active = response?.data?.calls?.[0] || null;
      if (callRef.current) {
        if (!active || active.status === "ended") end(); else { setCall(active); processSignals(active); }
      } else setIncoming(active?.initiatorId !== currentUser.id ? active : null);
    };
    poll(); const timer = setInterval(poll, 1800); return () => clearInterval(timer);
  }, [activeChat, payload, processSignals, currentUser?.id]);

  useEffect(() => () => { localStream?.getTracks().forEach((track) => track.stop()); peersRef.current.forEach((pc) => pc.close()); }, [localStream]);
  return { call, incoming, localStream, remoteStreams, mediaError, start, accept: join, dismiss: () => setIncoming(null), end };
}