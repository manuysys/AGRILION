"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { mlApi } from "@/lib/api-client";
import { chatBubble } from "@/lib/motion";

interface Message {
  role: "user" | "bot";
  text: string;
}

const quickActions = [
  "¿Cuál es el estado general?",
  "¿Hay alertas activas?",
  "Recomendaciones para hoy",
  "¿Qué silobolsa tiene mayor riesgo?",
];

export default function ChatWidget({ siloId = "SILO_001" }: { siloId?: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "Hola, soy AGRILION AI. Pregúntame sobre el estado de tus silobolsas." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: "user", text: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await mlApi.chat(text, siloId);
      const reply = res.response || "No pude procesar tu consulta en este momento.";
      setMessages((prev) => [...prev, { role: "bot", text: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "El servicio de IA no está disponible ahora. Usando análisis local." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.95 }}
          transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          className="w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#1a5c3a] to-[#2d8a4e] text-white">
            <div className="flex items-center gap-2">
              <Bot size={18} />
              <span className="text-sm font-semibold">AGRILION AI</span>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Cerrar chat" className="p-1 rounded-lg hover:bg-white/10 transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 h-80 overflow-y-auto p-3 space-y-3 bg-gray-50/50">
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {quickActions.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="text-xs px-2.5 py-1.5 bg-white border border-gray-200 rounded-full text-gray-600 hover:border-[#1a5c3a] hover:text-[#1a5c3a] transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {messages.map((msg, i) => (
              <motion.div
                key={msg.text + msg.role + i}
                variants={chatBubble}
                initial="hidden"
                animate="visible"
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex items-start gap-2 max-w-[85%] ${
                    msg.role === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      msg.role === "user" ? "bg-[#1a5c3a]" : "bg-gray-200"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <User size={14} className="text-white" />
                    ) : (
                      <Bot size={14} className="text-[#1a5c3a]" />
                    )}
                  </div>
                  <div
                    className={`rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-[#1a5c3a] text-white rounded-tr-sm"
                        : "bg-white border border-gray-200 text-gray-700 rounded-tl-sm"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              </motion.div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3.5 py-2.5">
                  <span className="w-2 h-2 bg-[#1a5c3a] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-[#1a5c3a] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-[#1a5c3a] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}

            <div ref={endRef} />
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
            className="flex items-center gap-2 p-3 border-t border-gray-100 bg-white"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pregúntale a AGRILION AI..."
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a5c3a]/20 focus:border-[#1a5c3a]"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              aria-label="Enviar mensaje"
              className="w-9 h-9 bg-[#1a5c3a] text-white rounded-xl flex items-center justify-center hover:bg-[#2d8a4e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={16} />
            </button>
          </form>
        </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 bg-gradient-to-br from-[#1a5c3a] to-[#2d8a4e] text-white rounded-full flex items-center justify-center shadow-xl shadow-[#1a5c3a]/30"
        whileHover={{ scale: 1.05, boxShadow: "0 10px 40px rgba(26, 92, 58, 0.4)" }}
        whileTap={{ scale: 0.95 }}
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </motion.button>
    </div>
  );
}
