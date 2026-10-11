import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Send,
  RefreshCw,
  Search,
  MoreVertical,
  Check,
  UserRound,
  Paperclip,
  FileText,
  Ban,
  Flag,
  X,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';

function formatTime(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso.replace(' ', 'T') + 'Z');
    return d.toLocaleString('az-AZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

function parseMessage(value) {
  try {
    const payload = JSON.parse(value);
    if (payload?.kind === 'attachment' && payload.attachment?.url) return payload;
  } catch {
    // Messages created before attachments are plain text.
  }
  return { text: value, attachment: null };
}

export default function Mesajlar() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [conversations, setConversations] = useState([]);
  const [conversationSearch, setConversationSearch] = useState('');
  const [activeUserId, setActiveUserId] = useState(searchParams.get('to') || null);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [blockStatus, setBlockStatus] = useState({ blockedByMe: false, blockedMe: false });
  const [chatMenuOpen, setChatMenuOpen] = useState(false);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [error, setError] = useState('');
  const messageListRef = useRef(null);
  const lastMessageIdRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!loading && !user) navigate('/giris');
  }, [user, loading, navigate]);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    setLoadingConvos(true);
    try {
      const data = await api.getConversations();
      setConversations(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingConvos(false);
    }
  }, [user]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  const loadThread = useCallback(async (otherId, showLoading = false) => {
    if (!otherId) return;
    if (showLoading) setThreadLoading(true);
    try {
      const [data, status] = await Promise.all([api.getThread(otherId), api.getBlockStatus(otherId)]);
      setActiveUser(data.user);
      setMessages(data.messages);
      setBlockStatus(status);
    } catch (err) {
      setError(err.message);
    } finally {
      if (showLoading) setThreadLoading(false);
    }
  }, []);

  useEffect(() => { setChatMenuOpen(false); }, [activeUserId]);

  useEffect(() => {
    if (activeUserId) loadThread(activeUserId, true);
  }, [activeUserId, loadThread]);

  useEffect(() => {
    if (!activeUserId) return undefined;
    const interval = window.setInterval(() => {
      loadThread(activeUserId);
      loadConversations();
    }, 10000);
    return () => window.clearInterval(interval);
  }, [activeUserId, loadThread, loadConversations]);

  const scrollToBottom = () => {
    const messageList = messageListRef.current;
    if (messageList) messageList.scrollTo({ top: messageList.scrollHeight, behavior: 'smooth' });
  };
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) {
      lastMessageIdRef.current = null;
      return;
    }
    if (lastMessage.id !== lastMessageIdRef.current) {
      lastMessageIdRef.current = lastMessage.id;
      scrollToBottom();
    }
  }, [messages]);

  const handleChatSelect = (id) => setActiveUserId(id);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!messageText.trim() && !selectedFile) || !activeUserId || blockStatus.blockedByMe || blockStatus.blockedMe) return;
    setSending(true);
    setError('');
    try {
      let attachment = null;
      if (selectedFile) {
        const uploaded = await api.uploadMedia(selectedFile);
        attachment = { url: uploaded.url, name: selectedFile.name, mimeType: uploaded.mimeType, size: uploaded.size };
      }
      const sent = await api.sendMessage(activeUserId, messageText.trim(), attachment);
      setMessages((prev) => [...prev, sent]);
      setMessageText('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      loadConversations();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const toggleBlock = async () => {
    if (!activeUser) return;
    if (blockStatus.blockedByMe) {
      await api.unblockUser(activeUser.id);
    } else {
      if (!window.confirm(`${activeUser.fullName} istifadəçisini bloklamaq istəyirsiniz?`)) return;
      await api.blockUser(activeUser.id);
    }
    setBlockStatus(await api.getBlockStatus(activeUser.id));
    setChatMenuOpen(false);
  };

  const filteredConversations = conversations.filter((chat) =>
    (chat.user?.fullName || '').toLocaleLowerCase('az-AZ').includes(conversationSearch.trim().toLocaleLowerCase('az-AZ'))
  );

  const returnToConversations = () => {
    setActiveUserId(null);
    setActiveUser(null);
    setMessages([]);
  };

  if (!user) return null;

  return (
    <div className="h-svh overflow-hidden bg-[#F8FAFC] pt-24 text-slate-800 selection:bg-blue-200 selection:text-blue-900">
      <main className="mx-auto flex h-[calc(100svh-7rem)] min-h-[460px] max-w-[1440px] flex-col px-3 pb-4 sm:px-5 lg:px-8">
        {error && <div role="alert" className="mb-3 shrink-0 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">{error}</div>}

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className={`${activeUserId ? 'hidden lg:flex' : 'flex'} min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm`}>
            <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3.5">
              <div>
                <h1 className="text-lg font-bold text-slate-900">Mesajlar</h1>
                <p className="mt-0.5 text-xs text-slate-500">{conversations.length} söhbət</p>
              </div>
              <button type="button" onClick={loadConversations} title="Siyahını yenilə" aria-label="Siyahını yenilə" className="rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600">
                <RefreshCw className={`h-4 w-4 ${loadingConvos ? 'animate-spin' : ''}`} />
              </button>
            </header>

            <label className="mx-3 my-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 focus-within:border-blue-400 focus-within:bg-white">
              <Search className="h-4 w-4 shrink-0 text-slate-400" />
              <input value={conversationSearch} onChange={(event) => setConversationSearch(event.target.value)} placeholder="Söhbət axtar..." aria-label="Söhbətlərdə axtar" className="w-full min-w-0 bg-transparent py-2 text-sm outline-none placeholder:text-slate-400" />
            </label>

            <div className="chat-scroll min-h-0 flex-1 overflow-y-auto px-2 pb-2">
              {loadingConvos && conversations.length === 0 ? <div className="space-y-2 p-2">{[1, 2, 3].map((item) => <div key={item} className="h-[68px] animate-pulse rounded-lg bg-slate-100" />)}</div>
                : filteredConversations.length ? filteredConversations.map((chat) => {
                  const isActive = activeUserId === chat.userId;
                  const initials = (chat.user?.fullName || '?').slice(0, 2).toUpperCase();
                  return (
                    <button key={chat.userId} type="button" onClick={() => handleChatSelect(chat.userId)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition ${isActive ? 'bg-blue-50 ring-1 ring-inset ring-blue-100' : 'hover:bg-slate-50'}`}>
                      <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-blue-100 text-sm font-bold text-blue-700 flex items-center justify-center">
                        {chat.user?.avatarUrl ? <img src={chat.user.avatarUrl} alt={chat.user.fullName || 'Profil şəkli'} className="h-full w-full object-cover" /> : initials}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-bold text-slate-900">{chat.user?.fullName || 'İstifadəçi'}</span>
                          <span className="shrink-0 text-[11px] text-slate-400">{formatTime(chat.time)}</span>
                        </span>
                        <span className="mt-1 flex items-center justify-between gap-2">
                          <span className="truncate text-xs text-slate-500">{chat.isSentByMe ? 'Siz: ' : ''}{chat.lastMessage}</span>
                          {chat.unreadCount > 0 && <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">{chat.unreadCount}</span>}
                        </span>
                      </span>
                    </button>
                  );
                }) : <div className="px-4 py-12 text-center text-sm text-slate-500">{conversations.length ? 'Axtarışa uyğun söhbət yoxdur.' : 'Hələ söhbət yoxdur.'}</div>}
            </div>
          </aside>

          <section className={`${activeUserId ? 'flex' : 'hidden lg:flex'} min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm`}>
            {threadLoading ? <div className="flex flex-1 items-center justify-center text-sm text-slate-500"><RefreshCw className="mr-2 h-4 w-4 animate-spin text-blue-600" /> Söhbət yüklənir...</div>
              : activeUser ? <>
                <header className="flex shrink-0 items-center justify-between border-b border-slate-200 px-3 py-3 sm:px-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <button type="button" onClick={returnToConversations} aria-label="Söhbətlərə qayıt" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"><ArrowLeft className="h-4 w-4" /></button>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                      {activeUser.avatarUrl ? <img src={activeUser.avatarUrl} alt={activeUser.fullName || 'Profil şəkli'} className="h-full w-full object-cover" /> : (activeUser.fullName || '?').slice(0, 2).toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-slate-900 sm:text-base">{activeUser.fullName}</span>
                      <span className="mt-0.5 block text-xs text-slate-500">{activeUser.role === 'freelancer' ? 'Freelancer' : 'Sifarişçi'}</span>
                    </span>
                  </div>
                  <div className="relative shrink-0">
                    <button type="button" onClick={() => setChatMenuOpen((open) => !open)} aria-label="Söhbət seçimləri" aria-expanded={chatMenuOpen} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600"><MoreVertical className="h-5 w-5" /></button>
                    {chatMenuOpen && <div className="absolute right-0 top-full z-20 mt-1 w-52 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                      <button type="button" onClick={() => { setChatMenuOpen(false); navigate('/frilanserler', { state: { profileId: activeUser.id } }); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"><UserRound className="h-4 w-4" /> Profilə bax</button>
                      <button type="button" onClick={() => { setChatMenuOpen(false); navigate(`/sikayet?userId=${activeUser.id}&userName=${encodeURIComponent(activeUser.fullName || '')}`); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold text-orange-700 hover:bg-orange-50"><Flag className="h-4 w-4" /> İstifadəçini şikayət et</button>
                      <button type="button" onClick={() => toggleBlock().catch((err) => setError(err.message))} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50"><Ban className="h-4 w-4" /> {blockStatus.blockedByMe ? 'Blokdan çıxar' : 'İstifadəçini blokla'}</button>
                    </div>}
                  </div>
                </header>

                {(blockStatus.blockedByMe || blockStatus.blockedMe) && <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">{blockStatus.blockedByMe ? 'Bu istifadəçini bloklamısınız.' : 'Bu istifadəçi sizi bloklayıb.'} {blockStatus.blockedByMe && <button type="button" onClick={() => toggleBlock().catch((err) => setError(err.message))} className="ml-1 font-bold underline">Blokdan çıxar</button>}</div>}

                <div ref={messageListRef} className="chat-scroll min-h-0 flex-1 overflow-y-auto bg-[#F8FAFC] px-3 py-5 sm:px-6">
                  <div className="mx-auto flex max-w-3xl flex-col gap-3">
                    {messages.length === 0 && <p className="my-auto py-16 text-center text-sm text-slate-500">Bu söhbətdə hələ mesaj yoxdur. İlk mesajı göndərin.</p>}
                    {messages.map((msg) => {
                      const isMe = msg.fromUserId === user.id;
                      const content = parseMessage(msg.text);
                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`flex max-w-[88%] flex-col sm:max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                            <div className={`rounded-2xl px-3.5 py-2.5 shadow-sm ${isMe ? 'rounded-br-sm bg-blue-600 text-white' : 'rounded-bl-sm border border-slate-200 bg-white text-slate-700'}`}>
                              {content.text && <p className="whitespace-pre-wrap break-words text-sm leading-5">{content.text}</p>}
                              {content.attachment && <div className={content.text ? 'mt-2' : ''}>
                                {content.attachment.mimeType?.startsWith('image/') ? <a href={content.attachment.url} target="_blank" rel="noreferrer"><img src={content.attachment.url} alt={content.attachment.name} className="max-h-64 max-w-full rounded-lg object-contain" /></a>
                                  : content.attachment.mimeType?.startsWith('video/') ? <video src={content.attachment.url} controls className="max-h-64 max-w-full rounded-lg" />
                                    : content.attachment.mimeType?.startsWith('audio/') ? <audio src={content.attachment.url} controls className="max-w-full" />
                                      : <a href={content.attachment.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-semibold underline"><FileText className="h-4 w-4 shrink-0" /><span className="break-all">{content.attachment.name}</span></a>}
                                {content.text && <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-5">{content.text}</p>}
                              </div>}
                            </div>
                            <span className="mt-1 flex items-center gap-1 px-1 text-[10px] text-slate-400">{formatTime(msg.createdAt)} {isMe && <Check className="h-3 w-3" />}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <footer className="shrink-0 border-t border-slate-200 bg-white p-3 sm:px-5 sm:py-4">
                  {(blockStatus.blockedByMe || blockStatus.blockedMe) ? <p className="py-2 text-center text-sm text-amber-800">Bloklama aktivdir, mesaj göndərmək mümkün deyil.</p> : <>
                    {selectedFile && <div className="mb-2 flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-xs"><Paperclip className="h-4 w-4 shrink-0 text-slate-500" /><span className="min-w-0 flex-1 truncate">{selectedFile.name}</span><button type="button" onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} aria-label="Faylı çıxar" className="rounded p-1 text-slate-500 hover:bg-white"><X className="h-4 w-4" /></button></div>}
                    <form onSubmit={handleSendMessage} className="flex items-end gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 focus-within:border-blue-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/10">
                      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,audio/mpeg,audio/wav,application/pdf,text/plain,text/csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip" onChange={(event) => setSelectedFile(event.target.files?.[0] || null)} className="hidden" />
                      <button type="button" onClick={() => fileInputRef.current?.click()} disabled={sending} title="Fayl əlavə et" aria-label="Fayl əlavə et" className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-40"><Paperclip className="h-5 w-5" /></button>
                      <textarea rows={1} value={messageText} onChange={(event) => setMessageText(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} placeholder="Mesajınızı yazın..." aria-label="Mesaj mətni" className="max-h-28 min-h-10 min-w-0 flex-1 resize-y bg-transparent px-2 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400" />
                      <button type="submit" disabled={(!messageText.trim() && !selectedFile) || sending} aria-label="Mesaj göndər" title="Göndər" className="rounded-lg bg-blue-600 p-2.5 text-white transition hover:bg-blue-700 disabled:bg-slate-300"><Send className="h-4 w-4" /></button>
                    </form>
                  </>}
                </footer>
              </> : <div className="flex flex-1 flex-col items-center justify-center px-5 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600"><Search className="h-6 w-6" /></div>
                <h2 className="font-bold text-slate-800">{activeUserId ? 'Söhbət açıla bilmədi' : 'Söhbət seçin'}</h2>
                <p className="mt-1 max-w-xs text-sm text-slate-500">{activeUserId ? 'İstifadəçi məlumatını yenidən yükləyin və ya söhbət siyahısına qayıdın.' : 'Mesajları görmək və söhbətə başlamaq üçün siyahıdan istifadəçi seçin.'}</p>
                {activeUserId && <div className="mt-4 flex gap-2"><button type="button" onClick={() => loadThread(activeUserId, true)} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white hover:bg-blue-700">Yenidən yoxla</button><button type="button" onClick={returnToConversations} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">Söhbətlərə qayıt</button></div>}
              </div>}
          </section>
        </div>
      </main>
    </div>
  );
}
