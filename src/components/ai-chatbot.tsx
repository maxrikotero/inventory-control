"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageCircle,
  Send,
  Bot,
  User,
  Sparkles,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Minimize2,
  Maximize2,
} from "lucide-react";
import { toast } from "sonner";
import { ChatMessage, ChatContext, chatbotEngine } from "@/lib/ai/chatbot";

interface AIChatbotProps {
  customerId?: string;
  onActionClick?: (action: any) => void;
  className?: string;
}

export function AIChatbot({
  customerId,
  onActionClick,
  className,
}: AIChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const context: ChatContext = {
    customerId,
    conversationHistory: messages,
    userPreferences: {
      language: "es",
      communicationStyle: "casual",
    },
  };

  useEffect(() => {
    // Initialize with welcome message
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: "welcome",
        type: "assistant",
        content:
          "¡Hola! 👋 Soy tu asistente de ventas inteligente. ¿En qué puedo ayudarte hoy?",
        timestamp: Date.now(),
        metadata: {
          intent: "GREETING",
          confidence: 1.0,
          actions: chatbotEngine.getQuickActions(context),
        },
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: "user",
      content: inputMessage.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await chatbotEngine.processMessage(
        inputMessage.trim(),
        context
      );
      setMessages((prev) => [...prev, response]);
    } catch (error) {
      console.error("Error processing message:", error);
      toast.error("Error al procesar el mensaje");

      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        type: "assistant",
        content:
          "Lo siento, hubo un error al procesar tu mensaje. ¿Podrías intentar de nuevo?",
        timestamp: Date.now(),
        metadata: {
          intent: "UNKNOWN",
          confidence: 0.1,
        },
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
    inputRef.current?.focus();
  };

  const handleActionClick = (action: any) => {
    onActionClick?.(action);
    toast.success(`Acción: ${action.label}`);
  };

  const handleFeedback = (messageId: string, isPositive: boolean) => {
    // In a real implementation, you'd send this feedback to improve the chatbot
    toast.success(
      `Gracias por tu ${isPositive ? "positivo" : "negativo"} feedback`
    );
  };

  const suggestions = [
    "¿Qué productos tienes disponibles?",
    "¿Cuál es el precio de...?",
    "¿Tienes stock de...?",
    "¿Qué me recomiendas?",
  ];

  if (!isOpen) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <Card
        className={`w-96 shadow-xl ${
          isMinimized ? "h-16" : "h-[500px]"
        } transition-all duration-300`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-full">
                <Bot className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-sm">Asistente IA</CardTitle>
                <p className="text-xs text-gray-500">En línea</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-6 w-6 p-0"
              >
                {isMinimized ? (
                  <Maximize2 className="h-3 w-3" />
                ) : (
                  <Minimize2 className="h-3 w-3" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="p-0 flex flex-col h-[400px]">
            {/* Messages */}
            <ScrollArea className="flex-1 px-4">
              <div className="space-y-4 pb-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.type === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.type === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {message.type === "assistant" && (
                          <Bot className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                        )}
                        {message.type === "user" && (
                          <User className="h-4 w-4 mt-0.5 text-white flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm whitespace-pre-wrap">
                            {message.content}
                          </p>

                          {/* Intent badge */}
                          {message.metadata?.intent &&
                            message.metadata.intent !== "UNKNOWN" && (
                              <div className="mt-2">
                                <Badge variant="secondary" className="text-xs">
                                  {message.metadata.intent.replace("_", " ")}
                                </Badge>
                              </div>
                            )}

                          {/* Actions */}
                          {message.metadata?.actions &&
                            message.metadata.actions.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {message.metadata.actions.map(
                                  (action, index) => (
                                    <Button
                                      key={index}
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleActionClick(action)}
                                      className="text-xs h-6"
                                    >
                                      {action.label}
                                    </Button>
                                  )
                                )}
                              </div>
                            )}

                          {/* Feedback buttons */}
                          {message.type === "assistant" &&
                            message.id !== "welcome" && (
                              <div className="flex items-center gap-1 mt-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleFeedback(message.id, true)
                                  }
                                  className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
                                >
                                  <ThumbsUp className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleFeedback(message.id, false)
                                  }
                                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                >
                                  <ThumbsDown className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4 text-blue-600" />
                        <div className="flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span className="text-sm text-gray-600">
                            Escribiendo...
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Suggestions */}
            {messages.length <= 1 && (
              <div className="px-4 py-2 border-t">
                <p className="text-xs text-gray-500 mb-2">Sugerencias:</p>
                <div className="flex flex-wrap gap-1">
                  {suggestions.slice(0, 2).map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="text-xs h-6"
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Escribe tu mensaje..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  size="sm"
                  className="px-3"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
