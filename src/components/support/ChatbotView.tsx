import React, { useState, useRef, useEffect } from "react";
import { Bot, RotateCcw, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { chatbotFlows, ROOT_NODE_ID, type ChatbotNode } from "@/lib/chatbotFlows";

const WHATSAPP_URL = "https://wa.me/message/CPETP3K4EKYXL1";

interface ChatMessage {
  from: "bot" | "user";
  text: string;
}

const ChatbotView: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { from: "bot", text: chatbotFlows[ROOT_NODE_ID].botMessage },
  ]);
  const [currentNodeId, setCurrentNodeId] = useState(ROOT_NODE_ID);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentNode = chatbotFlows[currentNodeId];

  useEffect(() => {
    // Scroll to bottom on new messages
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages]);

  const handleOptionClick = (label: string, nextNodeId: string) => {
    const nextNode = chatbotFlows[nextNodeId];
    if (!nextNode) return;

    const newMessages: ChatMessage[] = [
      ...messages,
      { from: "user", text: label },
      { from: "bot", text: nextNode.botMessage },
    ];

    // If terminal node, add the response as a second bot message
    if (nextNode.response) {
      newMessages.push({ from: "bot", text: nextNode.response });
    }

    setMessages(newMessages);
    setCurrentNodeId(nextNodeId);
  };

  const handleReset = () => {
    setMessages([{ from: "bot", text: chatbotFlows[ROOT_NODE_ID].botMessage }]);
    setCurrentNodeId(ROOT_NODE_ID);
  };

  const isTerminal = !!currentNode?.response && !currentNode?.options;

  return (
    <div className="flex flex-col h-[360px]">
      <ScrollArea ref={scrollRef} className="flex-1 px-4 py-3">
        <div className="space-y-3">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex",
                msg.from === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-line",
                  msg.from === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted text-muted-foreground rounded-bl-md"
                )}
              >
                {msg.from === "bot" && i === 0 && (
                  <Bot className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
                )}
                {msg.text}
              </div>
            </div>
          ))}

          {/* Option buttons */}
          {currentNode?.options && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {currentNode.options.map((opt) => (
                <button
                  key={opt.nextNodeId}
                  onClick={() => handleOptionClick(opt.label, opt.nextNodeId)}
                  className="text-xs px-3 py-1.5 rounded-full border border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 transition-colors text-left"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {/* Terminal: WhatsApp + restart */}
          {isTerminal && (
            <div className="space-y-2 pt-1">
              <a
                href="https://wa.me/50230616015"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full rounded-md bg-green-600 hover:bg-green-700 text-white text-xs h-8 px-3 font-medium transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                +502 3061-6015
              </a>
              <button
                onClick={handleReset}
                className="flex items-center justify-center gap-1 w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                <RotateCcw className="h-3 w-3" />
                Volver al inicio
              </button>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Bottom reset when not terminal */}
      {!isTerminal && currentNodeId !== ROOT_NODE_ID && (
        <div className="px-4 py-2 border-t border-border">
          <button
            onClick={handleReset}
            className="flex items-center justify-center gap-1 w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            Reiniciar conversación
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatbotView;
