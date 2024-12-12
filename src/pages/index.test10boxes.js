import React, { useState, useEffect } from 'react';

const RetroResearchTerminal = () => {
  // Initial state declarations
  const [currentPage, setCurrentPage] = useState(0);
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

  // Safe text processing function
  const processText = React.useCallback((inputText) => {
    if (!inputText || !novelSentences?.length) {
      return [{ text: inputText || '', highlight: false }];
    }
    
    const segments = [];
    let lastIndex = 0;
    
    novelSentences.forEach(novel => {
      if (!novel?.text) return;
      
      const index = inputText.indexOf(novel.text, lastIndex);
      if (index !== -1) {
        if (index > lastIndex) {
          segments.push({ text: inputText.slice(lastIndex, index), highlight: false });
        }
        segments.push({ text: novel.text, highlight: true });
        lastIndex = index + novel.text.length;
      }
    });
    
    if (lastIndex < inputText.length) {
      segments.push({ text: inputText.slice(lastIndex), highlight: false });
    }
    
    return segments;
  }, [novelSentences]);

  // Safe research ideas rendering
  const renderResearchIdeas = () => {
    if (!Array.isArray(researchIdeas)) return null;
    
    return researchIdeas.map((group, groupIndex) => {
      if (!group?.ideas) return null;
      
      return (
        <div key={groupIndex} className="border border-black p-4 mb-4">
          {Array.isArray(group.ideas) && group.ideas.map((idea, ideaIndex) => (
            <div key={ideaIndex} className="mb-4 border-t border-black pt-4">
              <div className="font-bold mb-2">
                {idea?.Name?.split('_')
                  .map(word => word?.charAt(0).toUpperCase() + word?.slice(1))
                  .join(' ') || 'Untitled'}
              </div>
              <div className="mb-4 whitespace-pre-wrap">{idea?.Experiment || ''}</div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>NOVELTY: {idea?.Novelty || 0}/10</div>
                <div>FEASIBILITY: {idea?.Feasibility || 0}/10</div>
                <div>IMPACT: {idea?.Interestingness || 0}/10</div>
              </div>
            </div>
          ))}
        </div>
      );
    });
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
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!url.trim().startsWith('https://arxiv.org/abs/')) {
      setError('ERROR: INVALID URL. MUST BE AN ARXIV URL');
      return;
    }

    setLoading(true);
    setPdfText('');
    setSummaryText('');
    setNoveltyText('');
    setProgressMessages([]);
    setError('');
    setCurrentPage(0);
    setAnalysisComplete(false);

    try {
      const [pdfResponse, analysisResponse] = await Promise.all([
        fetch('https://4q3gqw5y4h8mpj-80.proxy.runpod.net/pdf-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: url.trim() })
        }),
        fetch('https://4q3gqw5y4h8mpj-80.proxy.runpod.net/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: url.trim() })
        })
      ]);

      if (!pdfResponse.ok || !analysisResponse.ok) {
        throw new Error('Analysis failed');
      }

      const [pdfData, analysisData] = await Promise.all([
        pdfResponse.json(),
        analysisResponse.json()
      ]);

      setNovelSentences(analysisData.scoredText || []);

      await new Promise(resolve => {
        typeText(pdfData.full_text, setDisplayedText, 5, resolve);
      });

      setPdfText(pdfData.full_text);
      setSummaryText(analysisData.summary || '');
      setNoveltyText(
        analysisData.scoredText
          ?.map(item => `${item.marker}\n\n${item.text}\n\n${item.novelty_context}\n`)
          .join('\n') || ''
      );
      setAnalysisComplete(true);

    } catch (err) {
      setError(`SYSTEM ERROR: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };


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
            <span className="font-mono">emmma.mmm.page/type_ransom</span>
            <button className="ml-2 border border-white px-2 text-sm">↗</button>
          </div>
          <div className="flex gap-4">
            <button className="border border-white px-4 py-1">MAKE YOUR OWN</button>
            <button className="bg-emerald-400 text-black px-4 py-1">RANDOM</button>
          </div>
        </div>
  
        {/* Main content */}
        <div className="pt-16 p-8">
          <h1 className="text-4xl mb-8">Ransom.</h1>
          
          {/* Control Panel Window */}
          <div className="border border-black bg-white mb-8 max-w-6xl mx-auto">
            {/* Window chrome */}
            <div className="bg-white border-b border-black p-2 flex justify-between items-center">
              <div className="text-sm">Control Panel</div>
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="w-3 h-3 border border-black"></div>
                ))}
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
  
            {/* Control Panel Grid */}
            <div className="grid grid-cols-4 gap-4 p-4 border-b border-black">
              <div className="border border-black p-2">
                <div className="text-center">2/5/84</div>
                <div className="text-center">22:32:50</div>
              </div>
              <div className="border border-black p-2">
                <div className="grid grid-cols-3 gap-1 text-center">
                  <div className="border border-black">0</div>
                  <div className="border border-black">1</div>
                  <div className="border border-black">2</div>
                </div>
              </div>
              <div className="border border-black p-2">
                <div className="flex justify-center gap-2">
                  <span>▶</span>
                  <span>◼</span>
                  <span>⏮</span>
                  <span>⏭</span>
                </div>
              </div>
              <div className="border border-black p-2">
                <div className="grid grid-cols-2 gap-1">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="border border-black aspect-square"></div>
                  ))}
                </div>
              </div>
            </div>
  
            {/* Main Content Area */}
            <div className="p-4">
              {currentPage === 0 ? (
                // PDF View with typewriter effect
                <div className="font-mono">
                  {processText(displayedText || text)?.map((segment, index) => (
                    <span
                      key={index}
                      className={segment.highlight ? 'bg-gray-200' : ''}
                    >
                      {segment.text}
                    </span>
                  ))}
                </div>
              ) : (
                // Analysis View
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Summary Section */}
                  <div className="border border-black p-4">
                    <h2 className="text-xl mb-4 pb-2 border-b border-black">
                      Summary Analysis
                    </h2>
                    <pre className="whitespace-pre-wrap">{summaryText}</pre>
                  </div>
                  
                  {/* Research Ideas Section */}
                  <div className="border border-black p-4">
                    <h2 className="text-xl mb-4 pb-2 border-b border-black">
                      Research Ideas
                    </h2>
                    <div className="overflow-y-auto max-h-[60vh]">
                      {loading ? (
                        <div>GENERATING IDEAS...</div>
                      ) : (
                        renderResearchIdeas()
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
  
          {/* Navigation Buttons */}
          {analysisComplete && (
            <div className="fixed bottom-4 right-4 flex gap-2">
              <button 
                onClick={() => setCurrentPage(0)}
                className="px-4 py-2 border border-black bg-white hover:bg-black hover:text-white"
              >
                ←
              </button>
              <button 
                onClick={() => setCurrentPage(1)}
                className="px-4 py-2 border border-black bg-white hover:bg-black hover:text-white"
              >
                →
              </button>
            </div>
          )}
        </div>
  
        {/* Loading Indicator */}
        {loading && (
          <div className="fixed top-4 right-4 border border-black p-4 bg-white">
            Processing paper...
          </div>
        )}
      </div>
    </div>
  );
  };
  
  export default RetroResearchTerminal;