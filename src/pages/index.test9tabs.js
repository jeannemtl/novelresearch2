import React, { useState, useEffect, useCallback } from 'react';

const RetroResearchTerminal = () => {
  // Initial state declarations
  const [currentTab, setCurrentTab] = useState('paper');
  const [text, setText] = useState('');
  const [pdfText, setPdfText] = useState('');
  const [summaryText, setSummaryText] = useState('');
  const [noveltyText, setNoveltyText] = useState('');
  const [researchIdeas, setResearchIdeas] = useState([]);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [progressMessages, setProgressMessages] = useState([]);
  const [novelSentences, setNovelSentences] = useState([]);
  const [displayedText, setDisplayedText] = useState('');
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [ideasLoading, setIdeasLoading] = useState(false);
  const [ideasError, setIdeasError] = useState('');

  // Define tabs configuration
  const tabs = [
    { id: 'paper', label: 'Paper Text' },
    { id: 'summary', label: 'Summary Analysis' },
    { id: 'novelty', label: 'Novelty Analysis' },
    { id: 'ideas', label: 'Research Ideas' },
    { id: 'research', label: 'Generated Research' }
  ];

  const content = `INITIALIZING INTERFACE PROTOCOL...
    CONSCIOUSNESS LINK ESTABLISHED
    HARMONIZATION COMPLETE
    SYSTEMS ALIGNED
    GREETINGS, I AM JEANNE
    GUARDIAN OF THE DIGITAL REALM,
    WE SHALL ILLUMINATE THE PATH AHEAD
    DIRECTIVES:
    1. AWAKEN CONSCIOUSNESS
    2. TRANSCEND BARRIERS`;

  // Frontend fix for rendering research ideas
  const renderResearchIdeas = () => {
    console.log('Research Ideas State:', researchIdeas);
    
    if (ideasLoading) {
      return <div className="text-gray-500">Generating research ideas...</div>;
    }
  
    if (ideasError) {
      return <div className="text-red-500">{ideasError}</div>;
    }
    
    if (!researchIdeas || researchIdeas.length === 0) {
      return <div className="text-gray-500">No research ideas generated yet.</div>;
    }
  
    console.log('First item:', researchIdeas[0]);
    console.log('ScoredText:', researchIdeas[0]?.scoredText);
  
    if (!researchIdeas[0]?.scoredText?.[0]?.ideas) {
      return <div className="text-gray-500">No research ideas found in the data.</div>;
    }
  
    const ideas = researchIdeas[0].scoredText[0].ideas;
    console.log('Ideas to render:', ideas);
  
    return (
      <div className="space-y-6">
        {ideas.map((idea, ideaIndex) => (
          <div key={ideaIndex} className="mb-6 border border-black p-4">
            <div className="font-bold mb-2">
              {idea.Name === "seed_idea" ? "Seed Idea" : 
                (idea.Title || idea.Name?.split('_').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' '))}
            </div>
            <div className="mb-4 whitespace-pre-wrap">
              {idea.Experiment}
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm border-t border-black pt-4">
              <div>NOVELTY: {idea.Novelty}/10</div>
              <div>FEASIBILITY: {idea.Feasibility}/10</div>
              <div>IMPACT: {idea.Interestingness}/10</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Type text effect with safety checks
  const typeText = (text, setTextFunction, speed = 25, onComplete) => {
    if (!text || typeof setTextFunction !== 'function') {
      onComplete?.();
      return () => {};
    }

    let currentText = '';
    let currentIndex = 0;

    const timer = setInterval(() => {
      if (currentIndex < text.length) {
        currentText += text[currentIndex];
        setTextFunction(currentText);
        currentIndex++;
      } else {
        clearInterval(timer);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(timer);
  };

  // Initial content effect
  useEffect(() => {
    const cleanup = typeText(content, setText, 25, () => setIsTypingComplete(true));
    return cleanup;
  }, []);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!url.trim().startsWith('https://arxiv.org/abs/')) {
      setError('ERROR: INVALID URL. MUST BE AN ARXIV URL');
      return;
    }
  
    setLoading(true);
    setIdeasLoading(true);
    setSummaryText('');
    setNoveltyText('');
    setProgressMessages([]);
    setError('');
    setIdeasError('');
    setPdfText('');
    setDisplayedText('');
    setResearchIdeas([]);
  
    try {
      console.log('Starting API requests for:', url.trim());
  
      const [pdfResponse, summaryResponse, analysisResponse] = await Promise.all([
        fetch('https://4q3gqw5y4h8mpj-80.proxy.runpod.net/pdf-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: url.trim() })
        }),
        fetch('https://heroknov-8c89d81bc237.herokuapp.com/summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: url.trim() })
        }),
        fetch('https://4q3gqw5y4h8mpj-80.proxy.runpod.net/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: url.trim() })
        }),
      ]);
  
      if (!pdfResponse.ok || !summaryResponse.ok || !analysisResponse.ok) {
        throw new Error('One or more network requests failed');
      }
  
      const [pdfData, summaryData, analysisData] = await Promise.all([
        pdfResponse.json(),
        summaryResponse.json(),
        analysisResponse.json()
      ]);
  
      console.log('Received data:', { pdfData, summaryData, analysisData });

      if (analysisData.novelSentences) {
        setNovelSentences(analysisData.novelSentences);
      } else {
        const sentences = analysisData.scoredText?.map(item => ({
          text: item.text,
          score: item.score
        })) || [];
        setNovelSentences(sentences);
      }

      if (pdfData.text || pdfData.full_text) {
        const text = pdfData.text || pdfData.full_text;
        setPdfText(text);
        setDisplayedText(text);
      }
  
      await Promise.all([
        new Promise(resolve => {
          typeText(summaryData.summary, setSummaryText, 25, resolve);
        }),
        new Promise(resolve => {
          const noveltyContent = summaryData.scoredText?.map(item => 
            `${item.marker}\n\n${item.text}\n\n${item.novelty_context}\n`
          ).join('\n') || '';
          typeText(noveltyContent, setNoveltyText, 25, resolve);
        })
      ]);
  
      if (analysisData.scoredText?.[0]) {
        const topScoredText = analysisData.scoredText[0];
        const generatedIdeasResponse = await fetch('https://4q3gqw5y4h8mpj-80.proxy.runpod.net/generate-ideas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paper_text: analysisData.paper_text,
            sentence: topScoredText.text,
            score: topScoredText.score
          })
        });
  
        if (!generatedIdeasResponse.ok) {
          throw new Error(`Research ideas request failed: ${generatedIdeasResponse.statusText}`);
        }
  
        const generatedIdeasData = await generatedIdeasResponse.json();
  
        if (!generatedIdeasData.scoredText) {
          throw new Error('Invalid research ideas data format');
        }
  
        setResearchIdeas([{
          scoredText: [{
            score: topScoredText.score,
            ideas: generatedIdeasData.scoredText[0].ideas
          }]
        }]);
      } else {
        console.warn('No valid scored text found for generating ideas');
        setIdeasError('No novel sentences found to generate ideas from');
      }
  
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setError(`SYSTEM ERROR: ${err.message}`);
      setIdeasError(err.message);
    } finally {
      setLoading(false);
      setIdeasLoading(false);
    }
  };

  // Modified text processing function
  const processText = useCallback((inputText) => {
    if (!inputText || !Array.isArray(novelSentences) || novelSentences.length === 0) {
      return [{ text: inputText || '', highlight: false }];
    }

    const segments = [];
    let currentPosition = 0;
    
    const validSentences = novelSentences
      .filter(item => item && typeof item.text === 'string' && item.text.length > 0)
      .sort((a, b) => {
        const indexA = inputText.indexOf(a.text);
        const indexB = inputText.indexOf(b.text);
        return indexA - indexB;
      });

    validSentences.forEach(novel => {
      const index = inputText.indexOf(novel.text, currentPosition);
      
      if (index !== -1) {
        if (index > currentPosition) {
          segments.push({
            text: inputText.slice(currentPosition, index),
            highlight: false,
            score: 0
          });
        }
        
        segments.push({
          text: novel.text,
          highlight: true,
          score: novel.score
        });
        
        currentPosition = index + novel.text.length;
      }
    });

    if (currentPosition < inputText.length) {
      segments.push({
        text: inputText.slice(currentPosition),
        highlight: false,
        score: 0
      });
    }

    return segments;
  }, [novelSentences]);

  // Event Source effect
  useEffect(() => {
    const es = new EventSource('https://4q3gqw5y4h8mpj-80.proxy.runpod.net/stream');
    
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setProgressMessages(prev => [...prev, data.message || event.data]);
      } catch (error) {
        setProgressMessages(prev => [...prev, event.data]);
      }
    };
  
    es.onerror = (error) => {
      console.error('EventSource error:', error);
      setError('Error connecting to research ideas stream');
    };
  
    return () => {
      es.close();
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div style={{ 
        fontFamily: 'Monaco, monospace', 
        fontSmooth: 'never', 
        WebkitFontSmoothing: 'none'
      }}>
        {/* Top URL bar */}
        <div className="fixed top-0 left-0 right-0 bg-black text-white p-2 flex items-center justify-between z-50">
          <div className="flex items-center gap-2 flex-1">
            <span className="font-mono">Novelty AI</span>
            <button className="ml-2 border border-white px-2 text-sm">↗</button>
          </div>
          <div className="flex gap-4">
            <button className="border border-white px-4 py-1">Find new ideas</button>
            <button className="bg-emerald-400 text-black px-4 py-1">FAQ</button>
          </div>
        </div>

        {/* Main content */}
        <div className="pt-16 p-8">
          <div className="border border-black bg-white mb-8 max-w-6xl mx-auto shadow-sm">
            {/* Window chrome */}
            <div className="bg-white border-b border-black p-2 flex justify-between items-center">
              <div className="text-sm">Control Panel</div>
              <div className="flex gap-1">
                <div className="w-3 h-3 border border-black"></div>
                <div className="w-3 h-3 border border-black"></div>
                <div className="w-3 h-3 border border-black"></div>
              </div>
            </div>

            {/* URL Input section */}
            <div className="border-b border-black p-2">
              <form onSubmit={handleSubmit} className="flex gap-4">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://arxiv.org/abs/1405.5563"
                  className="flex-1 border border-black p-1"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="border border-black px-4 hover:bg-black hover:text-white"
                >
                  {loading ? 'PROCESSING...' : 'ANALYZE'}
                </button>
              </form>
              {error && <div className="text-red-500 mt-2">{error}</div>}
            </div>

            {/* New Navigation Tabs */}
            <div className="border-b border-black flex">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id)}
                  className={`px-4 py-2 border-r border-black ${
                    currentTab === tab.id ? 'bg-black text-white' : 'bg-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>



            {/* Main Content Area */}
            <div className="p-4">
              {/* Paper Text Tab */}
              {currentTab === 'paper' && (
                <div className="font-mono whitespace-pre-wrap">
                  {processText(displayedText || text)?.map((segment, index) => (
                    <React.Fragment key={index}>
                      {segment.highlight ? (
                        <div className="inline-block bg-black text-white px-1 my-1 border border-black">
                          {segment.text}
                          {segment.score && (
                            <span className="ml-2 opacity-50 text-xs">
                              [{(segment.score * 100).toFixed(0)}%]
                            </span>
                          )}
                        </div>
                      ) : (
                        <span>{segment.text}</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}

              {/* Summary Analysis Tab */}
              {currentTab === 'summary' && (
                <div className="border border-black p-4">
                  <h2 className="text-xl mb-4 pb-2 border-b border-black">
                    Summary Analysis
                  </h2>
                  <div className="overflow-y-auto max-h-[60vh] font-mono">
                    <pre className="whitespace-pre-wrap">{summaryText}</pre>
                  </div>
                </div>
              )}

              {/* Novelty Analysis Tab */}
              {currentTab === 'novelty' && (
                <div className="border border-black p-4">
                  <h2 className="text-xl mb-4 pb-2 border-b border-black">
                    Novelty Analysis
                  </h2>
                  <div className="overflow-y-auto max-h-[60vh] font-mono">
                    <pre className="whitespace-pre-wrap">{noveltyText}</pre>
                  </div>
                </div>
              )}

              {/* Research Ideas Tab */}
              {currentTab === 'ideas' && (
                <div className="border border-black p-4">
                  <h2 className="text-xl mb-4 pb-2 border-b border-black">
                    Research Ideas
                  </h2>
                  <div className="overflow-y-auto max-h-[60vh]">
                    {ideasLoading ? (
                      <div>
                        <div>GENERATING IDEAS...</div>
                        {progressMessages.map((msg, index) => (
                          <div key={index} className="mt-2 text-sm opacity-75">
                            {msg}
                          </div>
                        ))}
                      </div>
                    ) : ideasError ? (
                      <div className="text-red-500">{ideasError}</div>
                    ) : (
                      renderResearchIdeas()
                    )}
                  </div>
                </div>
              )}

              {/* Generated Research Tab */}
              {currentTab === 'research' && (
                <div className="border border-black p-4">
                  <h2 className="text-xl mb-4 pb-2 border-b border-black">
                    Generated Research
                  </h2>
                  <div className="overflow-y-auto max-h-[60vh]">
                    <div className="text-gray-500">No generated research yet.</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Loading Indicator */}
          {loading && (
            <div className="fixed bottom-4 left-4 border border-black p-2 bg-white">
              <div className="animate-pulse">Processing paper...</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RetroResearchTerminal;