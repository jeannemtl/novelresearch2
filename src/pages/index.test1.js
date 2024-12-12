import React, { useState, useEffect } from 'react';
//import './App.css';  // or import './tailwind.css';
//import './index.css';
const RetroResearchTerminal = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [text, setText] = useState('');
  const [summaryText, setSummaryText] = useState('');
  const [noveltyText, setNoveltyText] = useState('');
  const [researchIdeas, setResearchIdeas] = useState([]);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [progressMessages, setProgressMessages] = useState([]);

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

  const typeText = (text, setTextFunction, onComplete) => {
    let currentText = '';
    let currentIndex = 0;

    const timer = setInterval(() => {
      if (currentIndex < text.length) {
        currentText += text[currentIndex];
        setTextFunction(currentText);
        currentIndex++;
      } else {
        clearInterval(timer);
        if (onComplete) onComplete();
      }
    }, 25);

    return () => clearInterval(timer);
  };

  useEffect(() => {
    const cleanup = typeText(content, setText, () => setIsTypingComplete(true));
    return cleanup;
  }, []);

  const handleSubmit = async (e) => {
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

    try {
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

      await Promise.all([
        new Promise(resolve => typeText(summaryData.summary, setSummaryText, resolve)),
        new Promise(resolve => typeText(
          summaryData.scoredText?.map(item => 
            `${item.marker}\n\n${item.text}\n\n${item.novelty_context}\n`
          ).join('\n') || '',
          setNoveltyText,
          resolve
        ))
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
          throw new Error('Research ideas request failed');
        }

        // In your handleSubmit function, after generatedIdeasResponse:
        const generatedIdeasData = await generatedIdeasResponse.json();
        console.log('Generated Ideas Data:', generatedIdeasData);
        setResearchIdeas(generatedIdeasData.scoredText || []);

      }
    } catch (err) {
      setError(`SYSTEM ERROR: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const checkLiteratureNovelty = async (text) => {
    try {
      const response = await fetch('https://4q3gqw5y4h8mpj-80.proxy.runpod.net/check-literature-novelty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      
      if (!response.ok) {
        throw new Error('Literature novelty check failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error in checkLiteratureNovelty:", error);
      return null;
    }
  };

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
  useEffect(() => {
    const es = new EventSource('https://4q3gqw5y4h8mpj-80.proxy.runpod.net/stream');
    console.log('EventSource connected');
  
    es.onmessage = (event) => {
      console.log('Received message:', event.data);
      setProgressMessages(prev => [...prev, event.data]);
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
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 p-8 relative">
      {/* Header */}
      <div className="max-w-4xl mx-auto text-center mb-16">
        <h1 className="text-5xl font-bold tracking-wider"></h1>
        <div className="flex items-center justify-center gap-2 text-sm mt-2">
          <span>✧</span>
          <span>RESEARCH ANALYSIS & IDEA GENERATOR</span>
          <span>✧</span>
        </div>
      </div>

      {/* Main Window */}
      <div className="max-w-4xl mx-auto relative">
        {/* Stacked window effect */}
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="absolute w-full h-full border-8 border-gray-200 bg-black"
            style={{
              transform: `translate(${i * 2}px, ${i * 2}px)`,
              zIndex: -i
            }}
          />
        ))}

        {/* Main content window */}
        <div className="border-8 border-gray-200 bg-black p-6 relative">
          {/* Blue dialog box */}
          <div className="bg-blue-600 text-white p-8 mb-8 relative">
            <div className="absolute top-1 right-1 flex gap-1">
              <div className="w-3 h-3 bg-gray-200" />
              <div className="w-3 h-3 bg-gray-200" />
              <div className="w-3 h-3 bg-gray-200" />
            </div>
            <pre className="font-mono text-center whitespace-pre-wrap">
              {text || content}
            </pre>
            {/* Pixel art smiley */}
            <div className="absolute -bottom-4 right-4 text-2xl transform rotate-90">
              :-)
            </div>
          </div>

          {/* Navigation arrows - moved outside main content and adjusted z-index */}
          <div className="fixed top-1/2 transform -translate-y-1/2 inset-x-4 flex justify-between z-50 pointer-events-auto">
            <button 
              onClick={() => currentPage > 0 && setCurrentPage(currentPage - 1)}
              className="w-12 h-12 border-2 border-green-500 bg-black flex items-center justify-center text-green-500 hover:bg-green-500 hover:text-black transition-colors rounded"
            >
              ←
            </button>
            <button 
              onClick={() => currentPage < 1 && setCurrentPage(currentPage + 1)}
              className="w-12 h-12 border-2 border-green-500 bg-black flex items-center justify-center text-green-500 hover:bg-green-500 hover:text-black transition-colors rounded"
            >
              →
            </button>
          </div>

          {/* Input form */}
          <form onSubmit={handleSubmit} className="relative z-50 flex gap-4 mb-8">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://arxiv.org/abs/1405.5563"
              className="flex-1 p-3 bg-gray-800 text-green-500 border-2 border-gray-200 focus:outline-none focus:border-blue-500"
              style={{ caretColor: 'rgb(34, 197, 94)' }}
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 transition-colors"
            >
              {loading ? 'PROCESSING...' : 'ANALYZE'}
            </button>
          </form>

          {/* Content area */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              {error && (
                <div className="text-red-500 mb-4 p-4 border border-red-500">
                  {error}
                </div>
              )}
              {!showFAQ ? (
                summaryText && (
                  <div className="bg-gray-900 p-4 border border-gray-200">
                    <h2 className="text-green-500 text-xl mb-4 pb-2 border-b border-green-500">
                      SUMMARY ANALYSIS
                    </h2>
                    <pre className="text-green-500 whitespace-pre-wrap">
                      {summaryText}
                    </pre>
                  </div>
                )
              ) : (
                <div className="bg-gray-900 p-4 border border-gray-200">
                  <h2 className="text-green-500 text-xl mb-4 pb-2 border-b border-green-500">
                    SYSTEM FAQ
                  </h2>
                  {/* FAQ content */}
                </div>
              )}
            </div>

            <div>
              {currentPage === 0 && noveltyText && (
                <div className="bg-gray-900 p-4 border border-gray-200">
                  <h2 className="text-green-500 text-xl mb-4 pb-2 border-b border-green-500">
                    NOVELTY ANALYSIS
                  </h2>
                  <pre className="text-green-500 whitespace-pre-wrap">
                    {noveltyText}
                  </pre>
                </div>
              )}
              {currentPage === 1 && (
                <div className="bg-gray-900 p-4 border border-gray-200">
                  <h2 className="text-green-500 text-xl mb-4 pb-2 border-green-500">
                    RESEARCH IDEA GENERATOR
                  </h2>
                  <div className="overflow-y-auto max-h-[60vh]">
                    {loading ? (
                      <div className="text-green-500">
                        <div>GENERATING RESEARCH IDEAS...</div>
                        {progressMessages.map((msg, index) => (
                          <div key={index} className="mt-2 text-sm opacity-75">
                            {msg}
                          </div>
                        ))}
                      </div>
                    ) : (
                      renderResearchIdeas()
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* k8 badge */}
        <div className="absolute -top-4 right-4 w-16 h-16 bg-white rounded-full flex items-center justify-center text-xl font-bold transform rotate-12 shadow-lg">
          k8
        </div>
      </div>

      {/* Footer text */}
      <div className="text-center mt-8 text-sm text-gray-500 italic">
        check out the research
      </div>
    </div>
  );
};
export default RetroResearchTerminal;