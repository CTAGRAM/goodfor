import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Loader2, Sparkles, AlertCircle, Send, Terminal, Paperclip, X, FileText, Zap } from 'lucide-react';

/* SECURITY NOTE: 
  API Keys are hardcoded here for your local testing convenience based on your request.
  In a production app, never commit API keys to GitHub/GitLab. Use .env files.
*/
const GEMINI_API_KEY = "AIzaSyDFsCBWsOyTGFeN_zWxhMOoO3PVP8U8CSM";
const ELEVENLABS_API_KEY = "sk_cd72e12c02b178cfe15d6214e899565e59d7023c45a6fb6b";
const ELEVENLABS_VOICE_ID = "1zUSi8LeHs9M2mV8X6YS";

/**
 * Utility to strip Markdown/LaTeX and EMOJIS for smoother Text-to-Speech
 */
const cleanTextForSpeech = (text) => {
  return text
    .replace(/\|\|OPEN:.*?\|\|/g, "")            // Remove the hidden OPEN command
    .replace(/\$\$(.*?)\$\$/g, " math formula ") // Remove block math
    .replace(/\$(.*?)\$/g, " math formula ")     // Remove inline math
    .replace(/```[\s\S]*?```/g, " code block ")  // Remove code blocks
    .replace(/[*_~`#]/g, "")                     // Remove basic markdown symbols
    .replace(/\[\d+\]/g, "")                     // Remove citation numbers [1]
    // Remove Emojis
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "") 
    .replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]/g, "")
    .replace(/\n+/g, ". ");                      // Replace newlines with pauses
};

/**
 * Helper to Play Audio Buffer (Generic for MP3/WAV)
 */
const playAudioData = async (arrayBuffer, audioContextRef) => {
  try {
    // 1. Initialize Audio Context if needed
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    
    // Resume context if suspended (common browser policy requirement)
    if (ctx.state === 'suspended') await ctx.resume();

    // 2. Decode Audio Data
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

    // 3. Play
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.start();

    return new Promise((resolve) => {
      source.onended = resolve;
    });

  } catch (e) {
    console.error("Audio Playback Error:", e);
    throw e; 
  }
};

/**
 * Gemini API Helper - Text Generation
 */
const generateGeminiResponse = async (history, userQuery, attachment = null) => {
  const systemPrompt = `
    You are a helpful, witty, and knowledgeable AI assistant.
    Tone: Professional, calm, and helpful.
    
    SPECIAL FEATURE: OPENING APPS/WEBSITES
    If the user asks to open a specific website or web-application (like YouTube, Spotify, Calculator, Google, etc.), you MUST include a special tag at the START of your response: ||OPEN:url||.
    
    Standard Rules:
    - Use the Google Search tool to find real-time information.
    - If a file is provided, explain it.
    - Render math using LaTeX ($$).
    - Keep spoken responses concise.
  `;
  
  const conversation = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }]
  }));

  const currentParts = [{ text: userQuery }];
  if (attachment) {
    currentParts.push({ inlineData: { mimeType: attachment.mimeType, data: attachment.data } });
  }
  conversation.push({ role: 'user', parts: currentParts });

  const delays = [1000, 2000, 4000];

  for (let attempt = 0; attempt <= 3; attempt++) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: conversation,
            tools: [{ google_search: {} }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
          }),
        }
      );

      if (!response.ok) throw new Error(`API Error ${response.status}`);
      const result = await response.json();
      return result.candidates?.[0]?.content?.parts?.[0]?.text || "I didn't catch that.";
    } catch (error) {
      if (attempt === 3) return "I'm having trouble connecting to Gemini.";
      await new Promise(resolve => setTimeout(resolve, delays[attempt]));
    }
  }
};

/**
 * ElevenLabs API Helper - Audio Generation
 */
const generateElevenLabsAudio = async (text) => {
  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: text,
          model_id: "eleven_multilingual_v2", 
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          }
        }),
      }
    );

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API Error: ${response.status} - ${errorText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    return arrayBuffer;
  } catch (error) {
    console.error("ElevenLabs Call Failed:", error);
    throw error;
  }
};

/**
 * Message Bubble Component
 */
const MessageBubble = ({ role, text, hasAttachment }) => {
  const [katexLoaded, setKatexLoaded] = useState(false);
  const displayText = text.replace(/\|\|OPEN:.*?\|\|/g, "");

  useEffect(() => {
    // Dynamic import of KaTeX for local portability
    if (!window.katex) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
      document.head.appendChild(link);
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';
      script.onload = () => setKatexLoaded(true);
      document.head.appendChild(script);
    } else {
      setKatexLoaded(true);
    }
  }, []);

  const renderContent = (content) => {
    const parts = content.split(/(```[\s\S]*?```)/g);
    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        const codeContent = part.replace(/```(\w+)?\n?/, '').replace(/```$/, '');
        return (
          <div key={index} className="my-3 rounded-lg overflow-hidden border border-slate-700 bg-slate-900">
            <div className="bg-slate-800 px-3 py-1 text-xs text-slate-400 flex items-center gap-2">
              <Terminal className="w-3 h-3" /> CODE / REGEX
            </div>
            <pre className="p-3 overflow-x-auto text-sm font-mono text-green-400"><code>{codeContent}</code></pre>
          </div>
        );
      }
      if (katexLoaded && (part.includes('$$') || part.includes('$'))) {
        try {
          const segments = part.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);
          return (
            <span key={index}>{segments.map((seg, i) => {
              if (seg.startsWith('$$')) {
                const math = seg.slice(2, -2);
                const html = window.katex.renderToString(math, { displayMode: true, throwOnError: false });
                return <div key={i} dangerouslySetInnerHTML={{ __html: html }} className="my-2" />;
              } else if (seg.startsWith('$')) {
                const math = seg.slice(1, -1);
                const html = window.katex.renderToString(math, { displayMode: false, throwOnError: false });
                return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />;
              }
              return seg;
            })}</span>
          );
        } catch (e) { return <span key={index}>{part}</span>; }
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className={`flex w-full mb-4 ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] rounded-2xl px-5 py-3 shadow-md backdrop-blur-sm flex flex-col gap-2 ${
        role === 'user' ? 'bg-blue-600/20 border border-blue-500/30 text-white rounded-tr-none' : 'bg-slate-800/80 border border-slate-700 text-slate-200 rounded-tl-none'
      }`}>
        {hasAttachment && (
           <div className="flex items-center gap-2 bg-black/20 p-2 rounded-lg text-xs mb-1 w-fit">
             <Paperclip className="w-3 h-3" /><span>File Attachment</span>
           </div>
        )}
        <div className="text-sm leading-relaxed whitespace-pre-wrap">{renderContent(displayText)}</div>
        <div className={`text-[10px] mt-1 opacity-50 ${role === 'user' ? 'text-right' : 'text-left'}`}>
          {role === 'user' ? 'YOU' : 'AI ASSISTANT'}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  // Voice Settings
  const [useHdVoice, setUseHdVoice] = useState(true); 
  const [messages, setMessages] = useState([{ role: 'ai', text: "Hi! I'm running locally on your PC. How can I help?" }]);
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState(null);
  
  const [attachment, setAttachment] = useState(null);
  
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const audioContextRef = useRef(null);
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.onstart = () => { setIsListening(true); setError(null); };
      recognition.onend = () => { setIsListening(false); };
      recognition.onerror = (event) => {
        setIsListening(false);
        if (event.error !== 'no-speech' && event.error !== 'aborted') setError(`Mic Error: ${event.error}`);
      };
      recognition.onresult = async (event) => {
        const text = event.results[0][0].transcript;
        handleUserMessage(text);
      };
      recognitionRef.current = recognition;
    } else {
      setError("Speech Recognition not supported in this browser. Try Chrome/Edge.");
    }
    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
      if (synthRef.current) synthRef.current.cancel();
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("File too large (Max 5MB)."); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachment({
        name: file.name,
        type: file.type.startsWith('image') ? 'image' : 'pdf',
        mimeType: file.type,
        data: reader.result.split(',')[1]
      });
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleUserMessage = async (text) => {
    if (!text.trim() && !attachment) return;
    const userMsg = { role: 'user', text, hasAttachment: !!attachment };
    const currentAttachment = attachment; 
    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setAttachment(null); 
    setIsProcessing(true);

    let aiText = await generateGeminiResponse(messages, text || "What is this file?", currentAttachment);
    
    // Command Parsing
    const commandMatch = aiText.match(/\|\|OPEN:(.*?)\|\|/);
    if (commandMatch) {
      const url = commandMatch[1];
      try { window.open(url, '_blank'); } catch (e) { setError(`Pop-up blocked: ${url}`); }
    }

    setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
    setIsProcessing(false);

    if (!isMuted) {
      handleSpeech(cleanTextForSpeech(aiText));
    }
  };

  const handleSpeech = async (text) => {
    if (isMuted) return;

    if (useHdVoice) {
      setIsSpeaking(true);
      try {
        const audioData = await generateElevenLabsAudio(text);
        if (audioData) {
          await playAudioData(audioData, audioContextRef);
        }
      } catch (err) {
        // Fallback to browser voice on error
        console.error("Falling back to browser voice");
        const errMsg = err.message.includes("401") ? "ElevenLabs: Invalid API Key" : 
                       err.message.includes("402") ? "ElevenLabs: Quota Exceeded" : 
                       "ElevenLabs Connection Failed";
        setError(errMsg);
        speakBrowser(text);
      }
      setIsSpeaking(false);
    } else {
      speakBrowser(text);
    }
  };

  const speakBrowser = (text) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = synthRef.current.getVoices();
    let preferredVoice = voices.find(v => v.name.includes("Google US English") || v.name.includes("Samantha") || v.lang === "en-US");
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.pitch = 1.0; 
    utterance.rate = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    synthRef.current.speak(utterance);
  };

  const toggleListening = () => {
    if (isListening) recognitionRef.current?.stop();
    else {
      synthRef.current?.cancel();
      if (audioContextRef.current) audioContextRef.current.suspend(); 
      setIsSpeaking(false);
      recognitionRef.current?.start();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white font-sans overflow-hidden">
      
      {/* Header */}
      <div className="flex-none p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-400" />
          <span className="font-semibold tracking-wide text-sm">VOICE & CHAT AI</span>
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={() => setUseHdVoice(!useHdVoice)}
             className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded border transition-colors ${useHdVoice ? 'bg-green-900/50 border-green-500 text-green-300' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
             title="Toggle High Quality Voice"
           >
             <Zap className="w-3 h-3" /> {useHdVoice ? 'ELEVENLABS: ON' : 'ELEVENLABS: OFF'}
           </button>
           {isSpeaking && !isMuted && <span className="text-xs text-blue-400 animate-pulse font-bold">SPEAKING...</span>}
           {isListening && <span className="text-xs text-red-400 animate-pulse font-bold">LISTENING...</span>}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
        {messages.map((msg, idx) => (
          <MessageBubble key={idx} role={msg.role} text={msg.text} hasAttachment={msg.hasAttachment} />
        ))}
        {isProcessing && (
          <div className="flex w-full justify-start animate-pulse">
            <div className="bg-slate-800/50 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
              <span className="text-xs text-slate-400">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Error Toast */}
      {error && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-900/90 text-red-200 px-4 py-2 rounded-full text-xs flex items-center gap-2 border border-red-500/50 shadow-lg pointer-events-none z-50 animate-bounce">
          <AlertCircle className="w-3 h-3" /> {error}
        </div>
      )}

      {/* Controls Area */}
      <div className="flex-none bg-slate-900 border-t border-slate-800 p-4 pb-6">
        {attachment && (
          <div className="max-w-3xl mx-auto mb-2 flex items-center gap-3 bg-slate-800 p-2 rounded-lg border border-slate-700 animate-fade-in-up">
            <div className="w-10 h-10 bg-slate-700 rounded flex items-center justify-center overflow-hidden">
              {attachment.type === 'image' ? <img src={`data:${attachment.mimeType};base64,${attachment.data}`} alt="Preview" className="w-full h-full object-cover" /> : <FileText className="w-6 h-6 text-red-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate text-slate-200">{attachment.name}</div>
              <div className="text-[10px] text-slate-500 uppercase">{attachment.type}</div>
            </div>
            <button onClick={() => setAttachment(null)} className="p-1 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
          </div>
        )}

        <div className="max-w-3xl mx-auto flex items-end gap-3">
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*,application/pdf" className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="flex-none w-10 h-10 rounded-full flex items-center justify-center bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-blue-400 transition-all shadow-lg" title="Upload Image or PDF"><Paperclip className="w-5 h-5" /></button>
          
          <button onClick={() => setIsMuted(!isMuted)} className={`flex-none w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg border ${isMuted ? 'bg-slate-800 border-red-900/50 text-red-400 hover:bg-slate-700' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-blue-400 hover:bg-slate-700'}`} title={isMuted ? "Unmute Voice" : "Mute Voice"}>{isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}</button>

          <button onClick={toggleListening} className={`flex-none w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl mx-2 ${isListening ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30 animate-pulse scale-105' : isSpeaking && !isMuted ? 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/30 scale-105' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}>{isListening ? <MicOff className="w-6 h-6 text-white" /> : isSpeaking && !isMuted ? <Volume2 className="w-6 h-6 text-white animate-bounce" /> : <Mic className="w-6 h-6" />}</button>

          <div className="flex-1 relative">
            <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleUserMessage(inputValue)} placeholder={attachment ? "Ask about file..." : "Ask me anything..."} className="w-full bg-slate-800 text-white placeholder-slate-500 border border-slate-700 rounded-full pl-5 pr-12 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
            <button onClick={() => handleUserMessage(inputValue)} disabled={(!inputValue.trim() && !attachment) || isProcessing} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 hover:bg-blue-500 rounded-full text-white disabled:opacity-50 disabled:bg-slate-700 transition-colors"><Send className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}