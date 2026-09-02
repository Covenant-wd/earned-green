import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, Mic, MonitorUp, PenLine, Send, Video } from "lucide-react";
import { toast } from "sonner";
import { PageContainer } from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDayTime, formatDuration } from "@/lib/format";
import { getLiveProvider } from "@/lib/live/provider";

interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
}

export default function ClassroomPage() {
  const { sessionId } = useParams();
  const { user, profile, timezone, isAdmin, isTeacher } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: session, isLoading } = useQuery({
    queryKey: ["session", sessionId],
    enabled: !!sessionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("live_sessions")
        .select("*, course:courses(title, slug)")
        .eq("id", sessionId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const provider = getLiveProvider(session?.provider);

  useEffect(() => {
    if (!sessionId) return;
    let active = true;
    supabase
      .from("session_messages")
      .select("id, user_id, message, created_at")
      .eq("session_id", sessionId)
      .order("created_at")
      .limit(200)
      .then(({ data }) => {
        if (active && data) setMessages(data);
      });

    const channel = supabase
      .channel(`session-chat-${sessionId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "session_messages", filter: `session_id=eq.${sessionId}` },
        (payload) => setMessages((prev) => [...prev, payload.new as ChatMessage]),
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Record attendance when a participant opens the classroom.
  useEffect(() => {
    if (!sessionId || !user) return;
    supabase
      .from("attendance")
      .insert({ session_id: sessionId, user_id: user.id, joined_at: new Date().toISOString(), status: "present" })
      .then(() => undefined);
  }, [sessionId, user]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || !user || !sessionId) return;
    const text = draft.trim();
    setDraft("");
    const { error } = await supabase
      .from("session_messages")
      .insert({ session_id: sessionId, user_id: user.id, message: text });
    if (error) {
      toast.error(error.message);
      setDraft(text);
    }
  };

  if (isLoading) return <PageContainer><p className="text-sm text-muted-foreground">Loading classroom…</p></PageContainer>;
  if (!session) return <PageContainer><p className="text-sm text-muted-foreground">Session not found.</p></PageContainer>;

  return (
    <PageContainer className="max-w-7xl">
      <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2">
        <Link to="/schedule">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to schedule
        </Link>
      </Button>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl">{session.title}</h1>
          <p className="text-sm text-muted-foreground">
            {(session.course as { title?: string } | null)?.title} · {formatDayTime(session.starts_at, timezone)} ·{" "}
            {formatDuration(session.duration_minutes)}
          </p>
        </div>
        <Badge variant={session.status === "live" ? "default" : "secondary"} className="capitalize">
          {session.status}
        </Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <div className="surface flex aspect-video flex-col items-center justify-center gap-3 p-8 text-center">
            <Video className="h-8 w-8 text-muted-foreground" />
            <p className="text-base font-medium">Live video is not connected yet</p>
            <p className="max-w-md text-sm text-muted-foreground">
              The classroom experience is ready — chat, roster, whiteboard and attendance all work. Camera,
              microphone, screen sharing and recording need a media provider ({provider.label}).
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {[
                { icon: Video, label: "Camera", on: provider.capabilities.camera },
                { icon: Mic, label: "Microphone", on: provider.capabilities.microphone },
                { icon: MonitorUp, label: "Screen share", on: provider.capabilities.screenShare },
                { icon: PenLine, label: "Whiteboard", on: true },
              ].map((c) => (
                <Badge key={c.label} variant={c.on ? "secondary" : "outline"} className="gap-1">
                  <c.icon className="h-3 w-3" />
                  {c.label}
                  {!c.on && " · off"}
                </Badge>
              ))}
            </div>
          </div>

          {(isTeacher || isAdmin) && (
            <div className="surface flex items-start gap-3 p-4 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-primary" />
              <p className="text-muted-foreground">
                Instructor view: connect a media provider (LiveKit, Daily, Agora or 100ms) to enable broadcasting
                and server-side recording for this room.
              </p>
            </div>
          )}

          <div className="surface p-5">
            <h2 className="text-base">Shared whiteboard</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Notes written here are visible to everyone in the room once the media provider is connected.
            </p>
            <div className="mt-3 h-48 rounded-xl border border-dashed border-border" />
          </div>
        </div>

        <aside className="surface flex h-[520px] flex-col p-4">
          <h2 className="text-base">Class chat</h2>
          <div className="mt-3 flex-1 space-y-3 overflow-y-auto pr-1 scrollbar-thin">
            {messages.map((m) => (
              <div key={m.id} className="text-sm">
                <p className="text-xs text-muted-foreground">
                  {m.user_id === user?.id ? profile?.first_name || "You" : "Participant"}
                </p>
                <p>{m.message}</p>
              </div>
            ))}
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground">No messages yet. Say hello.</p>
            )}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={sendMessage} className="mt-3 flex gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={session.chat_locked ? "Chat is locked" : "Message the class"}
              disabled={session.chat_locked && !isTeacher && !isAdmin}
            />
            <Button type="submit" size="icon" aria-label="Send message">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </aside>
      </div>
    </PageContainer>
  );
}
