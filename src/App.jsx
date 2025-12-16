import React, { useState } from 'react';

// --- ICONS ---
const IconNotebook = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-cyan-400"><path d="M2 6h4" /><path d="M2 12h4" /><path d="M2 18h4" /><path d="M6 4v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v0Z" /><path d="M16 4.5v15" /></svg> );
const IconLink = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72" /></svg> );
const IconSparkles = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2"><path d="M9.94 18.06 12 22l2.06-3.94" /><path d="M3.94 6.06 6 10l2.06-3.94" /><path d="M16 3l2.06 3.94L22 3" /><path d="m14 14 6 6" /><path d="M12 2a2.83 2.83 0 0 0 4 4L12 10l-4-4a2.83 2.83 0 0 0 4-4Z" /></svg> );
const IconPaperclip = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.59a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg> );
const IconDownload = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg> );

const defaultPattern = `Generate a structured set of notes from the video. The notes should cover the following points where applicable: a concise summary, key topics, a timestamped outline, impactful quotes, actionable advice, key terminology, contrasting viewpoints, analogies, suggestions for further research, and the intended audience.`;

const WelcomeMessage = () => ( <div className="text-center h-full flex flex-col justify-center items-center"><h3 className="text-lg font-medium text-slate-200">Awaiting Input</h3><p className="mt-1 text-sm text-slate-400">Your generated notes will appear here.</p></div> );
const LoadingSpinner = ({ text = "Analyzing video and generating notes..." }) => ( <div className="text-center h-full flex flex-col justify-center items-center"><svg className="animate-spin h-8 w-8 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><p className="mt-4 text-sm text-slate-400">{text}</p></div> );
const ErrorDisplay = ({ message }) => ( <div className="text-center h-full flex flex-col justify-center items-center bg-red-900/20 border border-red-500/30 rounded-lg p-4"><h3 className="text-lg font-medium text-red-400">An Error Occurred</h3><p className="mt-1 text-sm text-slate-400">{message}</p></div> );

const loadJsPdf = () => {
    return new Promise((resolve, reject) => {
        if (window.jspdf) return resolve(window.jspdf);
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = () => resolve(window.jspdf);
        script.onerror = () => reject(new Error('Failed to load jsPDF library.'));
        document.head.appendChild(script);
    });
};

function App() {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [notePattern, setNotePattern] = useState(defaultPattern);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [notes, setNotes] = useState(null);
  
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;;
  const API_URL_BASE = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const handleGenerateNotes = async () => {
    if (!youtubeUrl) { setError("Please enter a YouTube URL."); return; }
    setError(null); setIsLoading(true); setNotes(null);
    
    const systemInstruction = { 
      parts: [{ 
        text: "You are an expert academic assistant. Your response MUST be a valid JSON array of objects, and nothing else. Do not include any introductory text, closing text, or markdown formatting like ```json. Your entire output must be parsable by JSON.parse(). Each object in the array should represent a section of notes and have two properties: 'title' and 'content'. Your analysis MUST be grounded in the real-time search results for the user's YouTube URL. Adapt the number of notes to the video's length (2-4 for short, up to 10 for long)."
      }] 
    };
    
    const userPrompt = `Please generate notes for the YouTube video at this URL: ${youtubeUrl}\n\nUse the following user-provided guide for the content of your notes:\n\n"${notePattern}"`;
    
    const payload = { 
      contents: [{ parts: [{ text: userPrompt }] }], 
      systemInstruction, 
      tools: [{ "google_search": {} }],
    };
    
    try {
      const response = await fetch(API_URL_BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error?.message || "An unknown API error occurred."); }
      const result = await response.json();
      let generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!generatedText) { throw new Error("Received an empty response from the API."); }
      
      const startIndex = generatedText.indexOf('[');
      const endIndex = generatedText.lastIndexOf(']');
      if (startIndex === -1 || endIndex === -1) {
        throw new SyntaxError("Could not find a valid JSON array in the response.");
      }
      const jsonString = generatedText.substring(startIndex, endIndex + 1);

      const parsedNotes = JSON.parse(jsonString);
      setNotes(parsedNotes);
    } catch (err) { 
      console.error("API Call failed:", err); 
      let errorMessage = err.message;
      if (err instanceof SyntaxError) { errorMessage = "The AI returned an invalid format. Please try again."; }
      setError(`API Error: ${errorMessage}`); 
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleSuggestGuide = async () => {
    const goal = prompt("What is your goal for these notes? (e.g., 'study for a test', 'get key marketing takeaways', 'understand the main historical points')");
    if (!goal) return;
    setIsSuggesting(true); setError(null);
    const systemInstruction = { parts: [{ text: "You are an AI assistant that creates expert-level note-taking templates. Based on a user's goal, create a single, concise string that can be used as a guide for another AI to take notes. The guide should not be a numbered list, but a clear, single paragraph of instructions." }] };
    const userPrompt = `My goal is: "${goal}". Please create a note-taking guide for me.`;
    const payload = { contents: [{ parts: [{ text: userPrompt }] }], systemInstruction };
    try {
      const response = await fetch(API_URL_BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error?.message || "An unknown API error occurred."); }
      const result = await response.json();
      const newPattern = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!newPattern) { throw new Error("Could not generate a new guide."); }
      setNotePattern(newPattern.trim());
    } catch (err) { console.error("Suggest Guide failed:", err); setError(err.message); } finally { setIsSuggesting(false); }
  };

  const handleDownloadPdf = async () => {
    if (!notes) return;
    setIsDownloading(true); setError(null);
    try {
      await loadJsPdf();
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      let y = 15;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 10;
      notes.forEach((note, index) => {
        doc.setFont("helvetica", "bold");
        const titleLines = doc.splitTextToSize(note.title, doc.internal.pageSize.width - margin * 2);
        if (y + (titleLines.length * 6) > pageHeight - margin) { doc.addPage(); y = margin; }
        doc.text(titleLines, margin, y);
        y += (titleLines.length * 6) + 2;
        doc.setFont("helvetica", "normal");
        const splitContent = doc.splitTextToSize(note.content, doc.internal.pageSize.width - margin * 2);
        splitContent.forEach(line => {
            if (y > pageHeight - margin) { doc.addPage(); y = margin; }
            doc.text(line, margin, y);
            y += 6;
        });
        y += 10;
        if (y > pageHeight - margin && index < notes.length - 1) { doc.addPage(); y = margin; }
      });
      doc.save(`youtube_notes_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) { console.error("PDF Download failed:", err); setError("Could not download PDF. Failed to load library."); } finally { setIsDownloading(false); }
  };

  return (
    <div className="min-h-screen w-full bg-slate-900 text-white font-sans">
      <div className="px-4 sm:px-6 lg:px-8">
        <header className="flex items-center space-x-4 py-6 border-b border-slate-700">
          <IconNotebook />
          <div><h1 className="text-2xl font-bold text-slate-100">YouTube Deep-Dive Notemaker</h1><p className="text-sm text-slate-400">Generate structured PDF notes from any YouTube video.</p></div>
        </header>
        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-8">
          <div className="bg-slate-800/50 rounded-lg p-6 flex flex-col space-y-6 ring-1 ring-slate-700/50 transition-all hover:ring-cyan-500/50">
            <h2 className="text-lg font-semibold text-cyan-400">1. Input Details</h2>
            <div className="space-y-2"><label htmlFor="youtube-url" className="text-sm font-medium text-slate-300">YouTube Video URL</label><div className="relative"><IconLink /><input type="text" id="youtube-url" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="e.g., [https://www.youtube.com/watch?v=](https://www.youtube.com/watch?v=)..." className="w-full bg-slate-900/80 border border-slate-700 rounded-md py-2.5 pl-10 pr-4 text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors duration-300" /></div></div>
            <div className="space-y-2 flex-grow flex flex-col"><label htmlFor="note-pattern" className="text-sm font-medium text-slate-300">Note-Taking Guide</label><textarea id="note-pattern" value={notePattern} onChange={(e) => setNotePattern(e.target.value)} className="w-full h-64 flex-grow bg-slate-900/80 border border-slate-700 rounded-md p-3 text-slate-300 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors duration-300 resize-none" /></div>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <button onClick={handleSuggestGuide} disabled={isSuggesting || isLoading} className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-md font-semibold text-sm text-slate-200 transition-all duration-300 transform hover:scale-105 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed">
                {isSuggesting ? 'Suggesting...' : 'Suggest Guide'}
              </button>
              <button onClick={handleGenerateNotes} disabled={isLoading || !youtubeUrl || isSuggesting} className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 border border-cyan-500 rounded-md font-semibold text-sm text-white transition-all duration-300 transform hover:scale-105 shadow-[0_0_15px_0_rgba(74,222,222,0.3)] disabled:from-slate-600 disabled:to-slate-700 disabled:shadow-none disabled:cursor-not-allowed">
                <IconPaperclip />
                {isLoading ? 'Generating...' : 'Generate Notes'}
              </button>
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-6 min-h-[480px] flex flex-col ring-1 ring-slate-700/50">
            <h2 className="text-lg font-semibold mb-4 text-cyan-400">2. Generated Notes</h2>
            <div className="flex-grow flex items-center justify-center text-center">
              {isLoading ? <LoadingSpinner /> : isSuggesting ? <LoadingSpinner text="Generating new guide..." /> : error ? <ErrorDisplay message={error} /> : notes ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <h3 className="text-lg font-medium text-green-400">Notes Generated Successfully!</h3>
                  <p className="mt-1 mb-6 text-sm text-slate-400">{notes.length} sections created.</p>
                  <button onClick={handleDownloadPdf} disabled={isDownloading} className="w-full max-w-xs inline-flex items-center justify-center px-4 py-2.5 bg-green-600 hover:bg-green-500 border border-green-500 rounded-md font-semibold text-sm text-white transition-all duration-300 transform hover:scale-105 shadow-[0_0_15px_0_rgba(52,211,153,0.3)] disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed">
                    <IconDownload />
                    {isDownloading ? 'Downloading...' : 'Download PDF'}
                  </button>
                </div>
              ) : <WelcomeMessage />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;