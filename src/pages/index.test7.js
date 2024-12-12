import React, { useState, useEffect, useCallback } from 'react';

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



  // Safe research ideas rendering
  const renderResearchIdeas = () => (
    researchIdeas.map((group, groupIndex) => (
      <div key={groupIndex} className="mb-8 border border-green-500 p-4">
        {group.ideas?.map((idea, ideaIndex) => (
          <div key={ideaIndex} className="mb-6 border border-green-500 p-4">
            <div className="text-green-500 font-bold mb-2">
              {idea.Name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </div>
            <div className="text-green-500 mb-4 whitespace-pre-wrap">{idea.Experiment}</div>
            <div className="grid grid-cols-3 gap-4 text-green-500 text-sm border-t border-green-500 pt-4">
              <div>NOVELTY: {idea.Novelty}/10</div>
              <div>FEASIBILITY: {idea.Feasibility}/10</div>
              <div>IMPACT: {idea.Interestingness}/10</div>
            </div>
            <div className="mt-4 text-green-500 text-sm">
              <div className="flex items-center gap-4">
                <div>LITERATURE CHECK:</div>
                {idea.literatureNoveltyScore === undefined ? (
                  <button 
                    onClick={async () => {
                      const result = await checkLiteratureNovelty(idea.Experiment);
                      if (result) {
                        setResearchIdeas(prevIdeas => {
                          const newIdeas = [...prevIdeas];
                          const updatedGroup = {...group};
                          const updatedIdea = {
                            ...idea,
                            literatureNovel: result.novel,
                            literatureNoveltyScore: result.novelty_score
                          };
                          updatedGroup.ideas = group.ideas.map(i => 
                            i === idea ? updatedIdea : i
                          );
                          newIdeas[groupIndex] = updatedGroup;
                          return newIdeas;
                        });
                      }
                    }}
                    className="px-2 py-1 border border-green-500 text-green-500 hover:bg-green-500 hover:text-black transition-colors"
                  >
                    CHECK NOVELTY
                  </button>
                ) : (
                  <div className="text-green-500 font-bold">
                    **{idea.literatureNoveltyScore}/10**
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    ))
  );
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
    // In handleSubmit, at the start:
    setProgressMessages([]); // Clear previous messages
    setResearchIdeas([]); // Clear previous ideas
    e.preventDefault();
  
    if (!url.trim().startsWith('https://arxiv.org/abs/')) {
      setError('ERROR: INVALID URL. MUST BE AN ARXIV URL');
      return;
    }
  
    setLoading(true);
    setSummaryText('');
    setNoveltyText('');
    setProgressMessages([]);
    setError('');
    setDisplayedText('');
    setNovelSentences([]);
    setResearchIdeas([]); // Reset research ideas
  
    try {
      // Get both summary and analysis in parallel
      const [summaryResponse, analysisResponse] = await Promise.all([
        fetch('https://heroknov-8c89d81bc237.herokuapp.com/summary', {
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
  
      if (!summaryResponse.ok || !analysisResponse.ok) {
        throw new Error('Network response was not ok');
      }
  
      const [summaryData, analysisData] = await Promise.all([
        summaryResponse.json(),
        analysisResponse.json()
      ]);
  
      console.log('Analysis Data:', analysisData); // Debug log
  
      // Set novel sentences and text
      setNovelSentences(analysisData.scoredText || []);
      setDisplayedText(analysisData.paper_text || '');
  
      // Set summary and novelty analysis with typewriter effect
      await Promise.all([
        new Promise(resolve => typeText(summaryData.summary, setSummaryText, resolve)),
        new Promise(resolve => typeText(
          analysisData.scoredText?.map(item => 
            `💡 Novel Insight (${(item.score * 100).toFixed(0)}%)\n\n${item.text}\n\n${item.novelty_context || ''}\n\n---\n`
          ).join('\n') || '',
          setNoveltyText,
          resolve
        ))
      ]);
  
      // Generate research ideas
      if (analysisData.scoredText?.[0]) {
        const topScoredText = analysisData.scoredText[0];
        console.log('Generating ideas for:', topScoredText.text); // Debug log
  
        try {
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
            throw new Error('Research ideas request failed');
          }
  
          const generatedIdeasData = await generatedIdeasResponse.json();
          console.log('Generated Ideas:', generatedIdeasData); // Debug log
  
          if (generatedIdeasData.scoredText && generatedIdeasData.scoredText.length > 0) {
            setResearchIdeas(generatedIdeasData.scoredText);
          } else {
            console.warn('No research ideas in response');
            setError('No research ideas generated');
          }
        } catch (ideasError) {
          console.error('Error generating ideas:', ideasError);
          setError(`Failed to generate research ideas: ${ideasError.message}`);
        }
      }
  
      setAnalysisComplete(true);
      setCurrentPage(1);
  
    } catch (err) {
      console.error('Error in analysis:', err);
      setError(`SYSTEM ERROR: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const es = new EventSource('https://4q3gqw5y4h8mpj-80.proxy.runpod.net/stream');
    
    es.onmessage = (event) => {
      try {
        // Parse and validate message
        const parsedData = JSON.parse(event.data);
        if (parsedData && parsedData.titles?.processingMessage) {
          setProgressMessages(prev => [...prev, event.data]);
        }
      } catch (error) {
        console.error('Error handling stream message:', error);
      }
    };
  
    es.onerror = (error) => {
      console.error('EventSource error:', error);
    };
  
    return () => {
      if (es) {
        console.log('Closing EventSource');
        es.close();
      }
    };
  }, []);
  
  // Modified text processing function
  const processText = useCallback((inputText) => {
    if (!inputText || !Array.isArray(novelSentences) || novelSentences.length === 0) {
      return [{ text: inputText || '', highlight: false }];
    }

    const segments = [];
    let currentPosition = 0;
    
    // Filter and sort valid sentences
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
        // Add non-highlighted text before match
        if (index > currentPosition) {
          segments.push({
            text: inputText.slice(currentPosition, index),
            highlight: false,
            score: 0
          });
        }
        
        // Add highlighted text
        segments.push({
          text: novel.text,
          highlight: true,
          score: novel.score
        });
        
        currentPosition = index + novel.text.length;
      }
    });

    // Add remaining text
    if (currentPosition < inputText.length) {
      segments.push({
        text: inputText.slice(currentPosition),
        highlight: false,
        score: 0
      });
    }

    return segments;
  }, [novelSentences]);

  // Render function for text segments
  const renderTextSegments = (segments) => {
    return segments.map((segment, index) => {
      if (segment.highlight) {
        return (
          <div key={index} className="bg-black text-white p-1 my-1 font-mono border border-black">
            {segment.text}
            {segment.score && (
              <span className="ml-2 opacity-50">
                [score: {segment.score.toFixed(2)}]
              </span>
            )}
          </div>
        );
      }
      return (
        <span key={index} className="font-mono">
          {segment.text}
        </span>
      );
    });
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
            <h1 className="text-4xl mb-8"></h1>
            
            {/* Control Panel Window */}
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
    
              {/* Navigation Tabs */}
              <div className="border-b border-black flex">
                <button
                  onClick={() => setCurrentPage(0)}
                  className={`px-4 py-2 border-r border-black ${currentPage === 0 ? 'bg-black text-white' : 'bg-white'}`}
                >
                  Paper Text
                </button>
                <button
                  onClick={() => setCurrentPage(1)}
                  className={`px-4 py-2 border-r border-black ${currentPage === 1 ? 'bg-black text-white' : 'bg-white'}`}
                >
                  Research Ideas
                </button>
              </div>
    
              {/* Main Content Area */}
              {/* Main Content Area */}
<div className="p-4">
  {currentPage === 0 ? (
    <div className="font-mono whitespace-pre-wrap">
      {displayedText ? (
        processText(displayedText)?.map((segment, index) => (
          <React.Fragment key={index}>
            {segment.highlight ? (
  <span className="inline bg-black text-white px-1">
    {segment.text}
    {segment.score !== undefined && (
      <span className="ml-1 opacity-50 text-xs">
        [{(segment.score * 100).toFixed(0)}%]
      </span>
    )}
  </span>
) : (
  <span>{segment.text}</span>
)}
          </React.Fragment>
        ))
      ) : (
        <pre className="text-black">{text}</pre>
      )}
    </div>
  ) : (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
    {/* Summary Analysis Panel */}
    <div className="border border-black p-4">
      <h2 className="text-xl mb-4 pb-2 border-b border-black">
        Summary Analysis
      </h2>
      <div className="overflow-y-auto max-h-[60vh] font-mono">
        <pre className="whitespace-pre-wrap">{summaryText}</pre>
      </div>
    </div>

    {/* Novelty Analysis Panel */}
    <div className="border border-black p-4">
      <h2 className="text-xl mb-4 pb-2 border-b border-black">
        Novelty Analysis
      </h2>
      <div className="overflow-y-auto max-h-[60vh] font-mono">
        <pre className="whitespace-pre-wrap">{noveltyText}</pre>
      </div>
    </div>
    
    {/* Research Ideas Panel */}
{/* Research Ideas Panel */}
{/* Research Ideas Panel */}
<div className="border border-black p-4">
  <h2 className="text-xl mb-4 pb-2 border-b border-black">
    Research Ideas
  </h2>
  <div className="overflow-y-auto max-h-[60vh]">
    {loading ? (
      <div>
        <div>GENERATING IDEAS...</div>
        {progressMessages.length > 0 && progressMessages.map((msg, index) => {
          try {
            const parsedMsg = JSON.parse(msg);
            return (
              <div key={index} className="mt-2 text-sm">
                {parsedMsg.titles?.processingMessage || 'Processing...'}
              </div>
            );
          } catch (e) {
            return null;
          }
        })}
      </div>
    ) : researchIdeas && researchIdeas.length > 0 ? (
      renderResearchIdeas()
    ) : (
      <div>Waiting for research ideas...</div>
    )}
  </div>
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