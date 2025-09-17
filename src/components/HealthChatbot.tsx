import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Send, 
  Search, 
  Plus, 
  Moon, 
  Sun, 
  Globe, 
  Heart, 
  Shield, 
  AlertTriangle,
  Stethoscope,
  Pill,
  Phone,
  MessageSquare
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: 'text' | 'alert' | 'info';
  language?: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  language: string;
  lastUpdated: Date;
}

const LANGUAGES = {
  en: { name: 'English', flag: '🇺🇸' },
  hi: { name: 'हिंदी', flag: '🇮🇳' },
  mr: { name: 'मराठी', flag: '🇮🇳' },
  bn: { name: 'বাংলা', flag: '🇧🇩' },
};

const HEALTH_TOPICS = [
  { icon: Shield, label: 'Prevention', color: 'bg-accent-light text-accent' },
  { icon: Stethoscope, label: 'Symptoms', color: 'bg-primary-light text-primary' },
  { icon: Pill, label: 'Vaccination', color: 'bg-secondary text-secondary-foreground' },
  { icon: AlertTriangle, label: 'Alerts', color: 'bg-warning/20 text-warning' },
];

const MOCK_RESPONSES = {
  en: {
    greeting: "👋 Hello! I'm your AI Health Assistant. I can help you with preventive healthcare, symptoms, vaccinations, and health alerts. How can I assist you today?",
    prevention: "🛡️ **Preventive Healthcare Tips:**\n\n• Wash hands regularly with soap\n• Maintain physical distancing\n• Eat nutritious food with fruits & vegetables\n• Exercise for 30 minutes daily\n• Get adequate sleep (7-8 hours)\n• Stay hydrated\n• Avoid smoking and excessive alcohol",
    symptoms: "🩺 **Common Symptoms Guide:**\n\nFor fever, cough, or breathing difficulty, please consult a healthcare worker immediately.\n\n**When to seek help:**\n• Fever > 100.4°F (38°C)\n• Persistent cough\n• Difficulty breathing\n• Severe headache\n• Loss of taste/smell",
    vaccination: "💉 **Vaccination Schedule:**\n\n**Adults:**\n• COVID-19: As per latest guidelines\n• Tetanus: Every 10 years\n• Flu: Annually\n\n**Children:**\n• Follow national immunization schedule\n• Consult your local health center\n\nNext vaccination drive: March 15-20, 2024",
    alert: "🚨 **Health Alert:** Seasonal flu cases increasing in your area. Please take preventive measures and get vaccinated if eligible."
  },
  hi: {
    greeting: "👋 नमस्ते! मैं आपका AI स्वास्थ्य सहायक हूं। मैं निवारक स्वास्थ्य सेवा, लक्षण, टीकाकरण और स्वास्थ्य अलर्ट में आपकी मदद कर सकता हूं।",
    prevention: "🛡️ **निवारक स्वास्थ्य सुझाव:**\n\n• नियमित रूप से साबुन से हाथ धोएं\n• शारीरिक दूरी बनाए रखें\n• फल और सब्जियों के साथ पौष्टिक भोजन करें\n• दैनिक 30 मिनट व्यायाम करें",
    symptoms: "🩺 **सामान्य लक्षण गाइड:**\n\nबुखार, खांसी या सांस लेने में कठिनाई के लिए तुरंत स्वास्थ्य कार्यकर्ता से संपर्क करें।",
    vaccination: "💉 **टीकाकरण अनुसूची:**\n\n**वयस्क:**\n• कोविड-19: नवीनतम दिशानिर्देशों के अनुसार\n• टिटनेस: हर 10 साल\n• फ्लू: वार्षिक",
    alert: "🚨 **स्वास्थ्य चेतावनी:** आपके क्षेत्र में मौसमी फ्लू के मामले बढ़ रहे हैं। कृपया निवारक उपाय अपनाएं।"
  }
};

export const HealthChatbot = () => {
  const [currentLanguage, setCurrentLanguage] = useState<keyof typeof LANGUAGES>('en');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [sessions]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: `Chat ${sessions.length + 1}`,
      messages: [{
        id: '1',
        content: MOCK_RESPONSES[currentLanguage].greeting,
        sender: 'bot',
        timestamp: new Date(),
        type: 'text',
        language: currentLanguage
      }],
      language: currentLanguage,
      lastUpdated: new Date()
    };
    
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    
    toast({
      title: "New chat started",
      description: "Fresh conversation ready!",
    });
  };

  const getCurrentSession = () => {
    return sessions.find(s => s.id === currentSessionId);
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;
    
    const currentSession = getCurrentSession();
    if (!currentSession) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageInput.trim(),
      sender: 'user',
      timestamp: new Date(),
      type: 'text',
      language: currentLanguage
    };

    setSessions(prev => prev.map(session => 
      session.id === currentSessionId 
        ? { ...session, messages: [...session.messages, userMessage], lastUpdated: new Date() }
        : session
    ));

    setMessageInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const input = userMessage.content.toLowerCase();
      let response = "I understand your concern. For accurate medical advice, please consult with a healthcare professional in your area.";
      let responseType: 'text' | 'alert' | 'info' = 'text';

      if (input.includes('prevent') || input.includes('निवारक')) {
        response = MOCK_RESPONSES[currentLanguage].prevention;
        responseType = 'info';
      } else if (input.includes('symptom') || input.includes('लक्षण') || input.includes('fever') || input.includes('cough')) {
        response = MOCK_RESPONSES[currentLanguage].symptoms;
        responseType = 'info';
      } else if (input.includes('vaccin') || input.includes('टीका')) {
        response = MOCK_RESPONSES[currentLanguage].vaccination;
        responseType = 'info';
      } else if (input.includes('alert') || input.includes('चेतावनी')) {
        response = MOCK_RESPONSES[currentLanguage].alert;
        responseType = 'alert';
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: 'bot',
        timestamp: new Date(),
        type: responseType,
        language: currentLanguage
      };

      setSessions(prev => prev.map(session => 
        session.id === currentSessionId 
          ? { ...session, messages: [...session.messages, botMessage], lastUpdated: new Date() }
          : session
      ));

      setIsTyping(false);
    }, 1500);
  };

  const filteredSessions = sessions.filter(session =>
    session.messages.some(msg => 
      msg.content.toLowerCase().includes(searchQuery.toLowerCase())
    ) || session.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Initialize with first session
  useEffect(() => {
    if (sessions.length === 0) {
      createNewSession();
    }
  }, []);

  const currentSession = getCurrentSession();

  return (
    <div className="flex h-screen bg-gradient-soft">
      {/* Sidebar */}
      <div className="w-80 bg-card border-r border-border flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Health Assistant</h1>
              <p className="text-sm text-muted-foreground">AI-Powered Healthcare</p>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex gap-2 mb-3">
            <Button 
              onClick={createNewSession}
              size="sm" 
              className="flex-1 bg-gradient-primary hover:opacity-90"
            >
              <Plus className="w-4 h-4 mr-1" />
              New Chat
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDarkMode(!isDarkMode)}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          </div>

          {/* Language Selector */}
          <Select value={currentLanguage} onValueChange={(lang: keyof typeof LANGUAGES) => setCurrentLanguage(lang)}>
            <SelectTrigger className="w-full">
              <Globe className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(LANGUAGES).map(([code, lang]) => (
                <SelectItem key={code} value={code}>
                  <span className="mr-2">{lang.flag}</span>
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Search */}
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Health Topics Quick Access */}
        <div className="p-4 border-b border-border">
          <p className="text-sm font-medium mb-2">Quick Topics</p>
          <div className="grid grid-cols-2 gap-2">
            {HEALTH_TOPICS.map((topic) => (
              <Button
                key={topic.label}
                variant="outline"
                size="sm"
                className="h-auto p-2 flex flex-col items-center gap-1"
                onClick={() => setMessageInput(topic.label.toLowerCase())}
              >
                <topic.icon className="w-4 h-4" />
                <span className="text-xs">{topic.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Chat History */}
        <ScrollArea className="flex-1 p-2">
          {filteredSessions.map((session) => (
            <Button
              key={session.id}
              variant={session.id === currentSessionId ? "secondary" : "ghost"}
              className="w-full justify-start mb-1 h-auto p-3"
              onClick={() => setCurrentSessionId(session.id)}
            >
              <div className="flex flex-col items-start text-left">
                <span className="font-medium text-sm">{session.title}</span>
                <span className="text-xs text-muted-foreground">
                  {session.messages.length} messages • {LANGUAGES[session.language as keyof typeof LANGUAGES].flag}
                </span>
              </div>
            </Button>
          ))}
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentSession && (
          <>
            {/* Chat Header */}
            <div className="bg-card border-b border-border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-health rounded-full flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="font-semibold">{currentSession.title}</h2>
                    <p className="text-sm text-muted-foreground">
                      {LANGUAGES[currentSession.language as keyof typeof LANGUAGES].name} • {currentSession.messages.length} messages
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">
                    <Phone className="w-3 h-3 mr-1" />
                    WhatsApp Ready
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-accent-light text-accent border-accent">
                    <Shield className="w-3 h-3 mr-1" />
                    Secure
                  </Badge>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="max-w-4xl mx-auto space-y-4">
                {currentSession.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <Card 
                      className={`max-w-[80%] ${
                        message.sender === 'user' 
                          ? 'bg-gradient-primary text-white shadow-chat' 
                          : message.type === 'alert'
                          ? 'bg-warning/10 border-warning/30'
                          : message.type === 'info'
                          ? 'bg-accent-light border-accent/30'
                          : 'bg-card shadow-card'
                      }`}
                    >
                      <CardContent className="p-3">
                        <div className="whitespace-pre-wrap text-sm">
                          {message.content}
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                          <span className="text-xs opacity-70">
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {message.type === 'alert' && (
                            <Badge variant="outline" className="text-xs bg-warning/20 text-warning border-warning">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Alert
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <Card className="bg-card shadow-card">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                          </div>
                          <span className="text-sm text-muted-foreground">AI is typing...</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="bg-card border-t border-border p-4">
              <div className="max-w-4xl mx-auto">
                <div className="flex gap-2">
                  <Input
                    placeholder={`Type your health question in ${LANGUAGES[currentLanguage].name}...`}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || isTyping}
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Always consult healthcare professionals for medical advice • Available 24/7 via WhatsApp & SMS
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};