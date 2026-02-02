import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Maximize2, Minimize2, User, Bot } from "lucide-react";
 
type Channel = "BSE" | "SEBI" | "RBI";
 
type Msg = {
  role: "user" | "bot";
  text: string;
  ts: number;
};
 
const prompts: Record<Channel, string[]> = {
  BSE: ["Latest alerts", "Top gainers", "Sector trends"],
  SEBI: ["Weekly notifications", "Compliance highlights", "Investor updates"],
  RBI: ["Policy rates", "Regulatory updates", "Compliance status"],
};
 
export default function ChatbotFab() {
  const [open, setOpen] = useState(false);
  const [channel, setChannel] = useState<Channel>("BSE");
  const [input, setInput] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<Record<Channel, Msg[]>>({
    BSE: [],
    SEBI: [],
    RBI: [],
  });
  const endRef = useRef<HTMLDivElement>(null);
 
  const activeMsgs = useMemo(() => messages[channel], [messages, channel]);
 
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMsgs.length, open, channel]);
 
  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content) return;
    const u: Msg = { role: "user", text: content, ts: Date.now() };
    setMessages((prev) => ({ ...prev, [channel]: [...prev[channel], u] }));
    setInput("");
    try {
      const db = channel.toLowerCase();
      let botIndex = -1;
      setMessages((prev) => {
        const next = [...prev[channel], { role: "bot", text: "", ts: Date.now() + 1 }];
        botIndex = next.length - 1;
        return { ...prev, [channel]: next };
      });
      const normalize = (s: string) =>
        (s || "")
          .replace(/Â/g, "")
          .replace(/â€¢/g, "-")
          .replace(/â€“/g, "-")
          .replace(/â€”/g, "-")
          .replace(/•/g, "-")
          .replace(/–/g, "-")
          .replace(/—/g, "-")
          .replace(/â€˜/g, "‘")
          .replace(/â€™/g, "’")
          .replace(/â€œ/g, "“")
          .replace(/â€/g, "”")
          .replace(/â€¦/g, "…");
      const res = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          session_id: `session_${db}`,
          database: db,
        }),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setMessages((prev) => {
        const arr = [...prev[channel]];
        if (botIndex >= 0 && arr[botIndex]) {
          arr[botIndex] = { ...arr[botIndex], text: normalize(data.response ?? "") };
        }
        return { ...prev, [channel]: arr };
      });
    } catch (e) {
      const b: Msg = {
        role: "bot",
        text: `Sorry, an error occurred while contacting the ${channel} backend.`,
        ts: Date.now() + 1,
      };
      setMessages((prev) => ({ ...prev, [channel]: [...prev[channel], b] }));
    }
  };
 
  return (
    <>
      <div className="fixed bottom-6 right-20 z-50 flex items-center gap-3">
        <div
          className="hidden md:flex items-center gap-2 rounded-2xl px-3 py-2 border shadow-sm"
          style={{
            background: "#ffffff",
            borderColor: "#e5e7eb",
            color: "#0B74B0",
          }}
        >
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: "#22c55e" }}
            aria-hidden="true"
          />
          <span className="text-xs">How can I assist you today?</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="relative w-28 h-28 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:shadow-xl"
          style={{
            background:
              "linear-gradient(#ffffff, #ffffff) padding-box, linear-gradient(135deg, #0B74B0, #75479C, #BD3861) border-box",
            border: "2px solid transparent",
            color: "#0B74B0",
          }}
          aria-label="Open chatbot"
        >
          <Avatar className="h-24 w-24">
            <AvatarImage src="/avatar.jpg" alt="Assistant" />
            <AvatarFallback>AI</AvatarFallback>
          </Avatar>
          <span
            className="absolute -bottom-0 -right-0 h-4 w-4 rounded-full border-2"
            style={{ backgroundColor: "#22c55e", borderColor: "#ffffff" }}
            aria-label="Online"
          />
        </button>
      </div>
 
      {open && (
        <div className="fixed inset-0 z-50" aria-hidden="true">
          <div className="absolute inset-0 bg-black/20" onClick={() => setOpen(false)} />
          <div className={expanded ? "absolute inset-4" : "absolute bottom-6 right-6 w-[95vw] sm:w-[420px]"}>
            <Card
              className={expanded ? "border-2 h-full rounded-2xl overflow-hidden" : "border-2 rounded-2xl overflow-hidden"}
              style={{ borderColor: "#0B74B0", background: "#ffffff" }}
            >
            <CardHeader className="relative h-16">
  {/* Avatar Floating */}
  <Avatar
    className="h-20 w-20 absolute left-1/2 -bottom-10 -translate-x-1/2
               border-4 border-white shadow-md"
  >
    <AvatarImage src="/avatar.jpg" alt="Assistant" />
    <AvatarFallback>AI</AvatarFallback>
  </Avatar>
 
  {/* Actions */}
  <div className="absolute right-2 top-2 flex items-center gap-1 z-10">
    <button
      onClick={() => setExpanded((e) => !e)}
      className="p-1 rounded hover:bg-gray-100"
    >
      {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
    </button>
    <button
      onClick={() => setOpen(false)}
      className="p-1 rounded hover:bg-gray-100"
    >
      <X className="h-4 w-4" />
    </button>
  </div>
</CardHeader>
 
 
              <CardContent className="pt-12">
                <Tabs value={channel} onValueChange={(v) => setChannel(v as Channel)}>
                  <TabsList
                    className="grid grid-cols-3 h-10 rounded-xl border"
                    style={{
                      background: "linear-gradient(135deg, rgba(11,116,176,0.10), rgba(117,71,156,0.10))",
                      borderColor: "#0B74B0",
                    }}
                  >
                    <TabsTrigger
                      value="BSE"
                      className="text-sm font-medium rounded-sm"
                      style={{
                        color: channel === "BSE" ? "#ffffff" : "#0B74B0",
                        backgroundColor: channel === "BSE" ? "#0B74B0" : "transparent",
                      }}
                    >
                      BSE
                    </TabsTrigger>
                    <TabsTrigger
                      value="SEBI"
                      className="text-sm font-medium rounded-sm"
                      style={{
                        color: channel === "SEBI" ? "#ffffff" : "#75479C",
                        backgroundColor: channel === "SEBI" ? "#75479C" : "transparent",
                      }}
                    >
                      SEBI
                    </TabsTrigger>
                    <TabsTrigger
                      value="RBI"
                      className="text-sm font-medium rounded-sm"
                      style={{
                        color: channel === "RBI" ? "#ffffff" : "#BD3861",
                        backgroundColor: channel === "RBI" ? "#BD3861" : "transparent",
                      }}
                    >
                      RBI
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
 
                <div className="mt-3 flex gap-2 flex-wrap">
                  {prompts[channel].map((p) => (
                    <button
                      key={p}
                      onClick={() => send(p)}
                      className="px-2 py-1 rounded text-xs border"
                      style={{
                        borderColor: "#0B74B0",
                        color: "#0B74B0",
                        background: "rgba(11, 116, 176, 0.08)",
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
 
                <div
                  className="mt-3 overflow-y-auto rounded-2xl border p-2"
                  style={{
                    borderColor: "#e5e7eb",
                    background: "#f7fafc",
                    height: expanded ? "60vh" : "16rem",
                  }}
                >
                  {activeMsgs.length === 0 && (
                    <div className="text-sm" style={{ color: "#666666" }}>Ask something about {channel}.</div>
                  )}
                  {activeMsgs.map((m, i) => (
                    <div key={i} className={`mb-2 flex ${m.role === "user" ? "justify-end" : "justify-start"} items-end gap-2`}>
                      {m.role === "bot" && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src="/avatar.jpg" alt="Agent" />
                          <AvatarFallback>
                            <Bot className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "text-white" : "bg-white border"}`}
                        style={{
                          ...(m.role === "bot" ? { borderColor: "#e5e7eb", color: "#000000" } : {}),
                          ...(m.role === "user" ? { backgroundColor: "#0B74B0", color: "#ffffff" } : {}),
                        }}
                      >
                        {m.role === "bot" ? (
                          <div style={{ whiteSpace: "pre-wrap" }}>{m.text}</div>
                        ) : (
                          <div style={{ color: "#ffffff", whiteSpace: "pre-wrap" }}>{m.text}</div>
                        )}
                      </div>
                      {m.role === "user" && (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                  <div ref={endRef} />
                </div>
 
                <div className="mt-4 flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    placeholder={`Message ${channel}`}
                    className="rounded-2xl"
                  />
                  <Button onClick={() => send()} className="rounded-2xl" style={{ backgroundColor: "#0B74B0", borderColor: "#0B74B0" }}>Send</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
 
 
 