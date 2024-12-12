import React, { useState, useEffect } from 'react';
import './App.css';  // or import './tailwind.css';
import './index.css';
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

        const generatedIdeasData = await generatedIdeasResponse.json();
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

  return (
    <div className="min-h-screen bg-purple-400 p-8">
      <div className="max-w-7xl mx-auto relative">
        {/* Pixel scatter effect */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-blue-500"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: 0.6
              }}
            />
          ))}
        </div>

        {/* Web badges */}
        <div className="flex gap-4 mb-6">
          <div className="border border-gray-400 bg-white p-1 shadow-md">
            <div className="text-xs">2003</div>
            <div className="text-sm">Internet Fiesta</div>
          </div>
          <div className="border border-gray-400 bg-white p-1 shadow-md">
            <div className="text-xs">Best viewed with:</div>
            <div className="text-sm">Neural Interface</div>
          </div>
        </div>

        {/* Main content */}
        <div className="border-8 border-gray-200 bg-black p-4 shadow-xl">
          <div className="fixed top-1/2 left-4 right-4 flex justify-between z-10">
            <button 
              onClick={() => currentPage > 0 && setCurrentPage(currentPage - 1)}
              className="w-8 h-8 border border-green-500 flex items-center justify-center text-green-500"
            >
              ←
            </button>
            <button 
              onClick={() => currentPage < 1 && setCurrentPage(currentPage + 1)}
              className="w-8 h-8 border border-green-500 flex items-center justify-center text-green-500"
            >
              →
            </button>
          </div>

          <div className="px-8">
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1">
                <pre className="text-green-500 whitespace-pre-wrap">{text}</pre>
                {isTypingComplete && (
                  <>
                    <div className="flex gap-4 my-4 flex-wrap">
                      {['HOME', 'FAQ', 'TELEGRAM', 'TWITTER/X', 'COINGECKO'].map((link) => (
                        <button
                          key={link}
                          onClick={() => {
                            if (link === 'FAQ') {
                              setShowFAQ(!showFAQ);
                            } else if (link === 'HOME') {
                              setShowFAQ(false);
                              setCurrentPage(0);
                            }
                          }}
                          className="text-green-500 hover:text-green-400"
                        >
                          {link}
                        </button>
                      ))}
                    </div>
                    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
                      <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://arxiv.org/abs/1405.5563"
                        className="flex-1 p-2 bg-black border border-green-500 text-green-500"
                      />
                      <button
                        type="submit"
                        disabled={loading}
                        className="p-2 border border-green-500 text-green-500"
                      >
                        {loading ? 'PROCESSING...' : 'ANALYZE'}
                      </button>
                    </form>
                    {error && <pre className="text-red-500 mt-4">{error}</pre>}
                    {!showFAQ ? (
                      summaryText && (
                        <>
                          <div className="mt-8 mb-4 text-green-500 text-xl border-b border-green-500 pb-2">
                            SUMMARY ANALYSIS
                          </div>
                          <pre className="text-green-500 whitespace-pre-wrap">{summaryText}</pre>
                        </>
                      )
                    ) : (
                      <>
                        <div className="mt-8 mb-4 text-green-500 text-xl border-b border-green-500 pb-2">
                          SYSTEM FAQ
                        </div>
                        <div className="space-y-8 text-green-500">
                          <div>
                            <div className="mb-2">{'>'} WHAT IS JEANNE?</div>
                            <div className="ml-4">JEANNE IS A CUSTOM MODEL, AI-POWERED RESEARCH ANALYSIS TOOL THAT IDENTIFIES NOVEL CONCEPTS IN ACADEMIC PAPERS.</div>
                          </div>
                          <div>
                            <div className="mb-2">{'>'} HOW DOES IT WORK?</div>
                            <div className="ml-4">PASTE AN ARXIV URL AND JEANNE WILL ANALYZE THE PAPER TO EXTRACT KEY INSIGHTS.</div>
                          </div>
                          <div>
                            <div className="mb-2">{'>'} HOW DOES IT SCORE FOR NOVELTY?</div>
                            <div className="ml-4">It converts the research idea into a search query using Claude. It then searches Google Scholar for recent papers (2020+) related to the idea. Then it analyzes the search results using Claude with its system prompt.</div>
                          </div>
                          <div>
                            <div className="mb-2">{'>'} WHAT PAPERS CAN I ANALYZE?</div>
                            <div className="ml-4">
                              CURRENTLY SUPPORTING PAPERS FROM ARXIV.ORG.
                              URL FORMAT: HTTPS://ARXIV.ORG/ABS/[PAPER-ID]
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>

              <div className="flex-1">
                {currentPage === 0 && noveltyText && (
                  <>
                    <div className="mb-4 text-green-500 text-xl border-b border-green-500 pb-2">
                      NOVELTY ANALYSIS
                    </div>
                    <pre className="text-green-500 whitespace-pre-wrap">{noveltyText}</pre>
                  </>
                )}
                {currentPage === 1 && (
                  <>
                    <div className="mb-4 text-green-500 text-xl border-b border-green-500 pb-2">
                      RESEARCH IDEA GENERATOR
                    </div>
                    <div className="overflow-y-auto max-h-[80vh]">
                      {loading ? (
                        <div className="text-green-500">
                          <div>GENERATING RESEARCH IDEAS...</div>
                          {progressMessages.map((msg, index) => (
                            <div key={index} className="mt-2 text-sm opacity-75">{msg}</div>
                          ))}
                        </div>
                      ) : (
                        renderResearchIdeas()
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RetroResearchTerminal;