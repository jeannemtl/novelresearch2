import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

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
  const [fetchTimer, setFetchTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [randomValues, setRandomValues] = useState(['', '', '', '']);
  
  const NFT_CONTRACT_ADDRESS = "0x0D8682373DCD5605911019C96565d97Af1569Dc8";
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
    if (ideasLoading) return <div>Generating research ideas...</div>;
    if (ideasError) return <div className="text-red-500">{ideasError}</div>;
    if (!researchIdeas?.length) return <div>No research ideas generated yet.</div>;
    if (!researchIdeas[0]?.scoredText?.[0]?.ideas) return <div>No ideas found.</div>;
  
    const ideas = researchIdeas[0].scoredText[0].ideas;
    
    return (
      <div className="space-y-8">
        {ideas.map((idea, index) => (
          <div key={index} className="border border-black p-6">
            <div className="relative">
                            {/* k8 badge */}
                            <div className={`absolute -top-3 -right-3 bg-white border border-black text-xs px-1 font-mono transform rotate-12
                ${idea.isMinted ? 'border-green-500' : ''}`}>
                {idea.isMinted ? 'k8 IP' : 'k8'}
              </div>
              
              <div className="font-bold mb-2">
                {idea.Name === "seed_idea" ? "Seed Idea" : 
                  (idea.Title || idea.Name?.split('_').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' '))}
              </div>
              {/*<div className="font-bold text-xl mb-4">{`Generated idea ${index + 1}: ${idea.Title}`}</div>*/}
              <div className="mb-6 whitespace-pre-wrap">{idea.Experiment}</div>
              <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                <div>NOVELTY: {idea.Novelty}/10</div>
                <div>FEASIBILITY: {idea.Feasibility}/10</div>
                <div>IMPACT: {idea.Interestingness}/10</div>
              </div>
              {!idea.isMinted && (
  <>
    {idea.isPending ? (
      <div className="inline-block bg-gray-400 text-white px-4 py-2 font-mono">
        MINTING...
      </div>
    ) : (
      <button 
        onClick={() => handleMintIdea(idea)}
        className="bg-[#0000FF] text-white px-4 py-2 font-mono"
      >
        MINT AS NFT →
      </button>
    )}
  </>
)}
{idea.isMinted && (
  <div className="space-y-2">
    <div className="text-green-500 font-mono flex items-center gap-2">
      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
      MINTED
    </div>
    {idea.mintTx && (
      <div className="ml-2 text-xs font-mono space-y-1">
        <div className="text-gray-600">NFT Details:</div>
        <div className="flex items-center gap-2">
          <span>Token ID:</span>
          <span className="text-blue-600">#{idea.tokenId}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Hash:</span>
          <a 
            href={`https://sepolia.basescan.org/tx/${idea.mintTx}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline truncate max-w-[200px]"
          >
            {idea.mintTx?.slice(0, 10)}...{idea.mintTx?.slice(-8)}
          </a>
        </div>
      </div>
    )}
  </div>
)}
      
      {idea.isMinted && !idea.isRegistered && (
  <>
    {idea.isRegistrationPending ? (
      <div className="inline-block bg-gray-400 text-white px-4 py-2 font-mono ml-2">
        REGISTERING...
      </div>
    ) : (
      <button 
        onClick={() => handleIPRegistration(idea)}
        className="bg-[#0000FF] text-white px-4 py-2 font-mono ml-2"
      >
        REGISTER IP →
      </button>
    )}
  </>
)}
{idea.isRegistered && (
  <div className="space-y-2">
    <div className="text-green-500 font-mono flex items-center gap-2 ml-2">
      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
      REGISTERED
    </div>
    <div className="ml-2 text-xs font-mono space-y-1">
      <div className="text-gray-600">Transaction Details:</div>
      <div className="flex items-center gap-2">
        <span>Block:</span>
        <span className="text-blue-600">#{idea.registrationBlock}</span>
      </div>
      <div className="flex items-center gap-2">
        <span>Hash:</span>
        <a 
          href={`https://sepolia.basescan.org/tx/${idea.registrationTx}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline truncate max-w-[200px]"
        >
          {idea.registrationTx?.slice(0, 10)}...{idea.registrationTx?.slice(-8)}
        </a>
      </div>
    </div>
  </div>
)}
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
  
  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setRandomValues(prev => prev.map(() => 
          Math.random().toString(36).substring(2, 4).toUpperCase()
        ));
      }, 100);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setTimerActive(true); // Start timer
  
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
      setTimerActive(false); // Stop timer
      setFetchTimer(0); // Reset timer
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
  // Modify the EventSource effect
useEffect(() => {
  let es;
  
  if (loading || ideasLoading) {  // Only connect when loading
    es = new EventSource('https://4q3gqw5y4h8mpj-80.proxy.runpod.net/stream');
    console.log('EventSource connected');
    
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
      // Try to reconnect
      if (es.readyState === EventSource.CLOSED) {
        es = new EventSource('https://4q3gqw5y4h8mpj-80.proxy.runpod.net/stream');
      }
    };
  }

  return () => {
    if (es) {
      console.log('Closing EventSource');
      es.close();
    }
  };
}, [loading, ideasLoading]); // Add dependencies to reconnect when loading states change

const handleMintIdea = async (idea) => {
  try {
    if (!window.ethereum) {
      alert('Please install MetaMask');
      return;
    }

    // Create a function to identify the same idea
    const isSameIdea = (a, b) => 
      a.Title === b.Title && 
      a.Experiment === b.Experiment && 
      a.Novelty === b.Novelty;

    // Set initial pending state
    setResearchIdeas(prevIdeas => {
      return prevIdeas.map(item => ({
        ...item,
        scoredText: item.scoredText.map(st => ({
          ...st,
          ideas: st.ideas.map(i => isSameIdea(i, idea) ? { ...i, isPending: true } : i)
        }))
      }));
    });

    // Handle chain switching
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x14a34' }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x14a34',
              chainName: 'Base Sepolia',
              rpcUrls: ['https://base-sepolia.g.alchemy.com/v2/jEiVjBriEh9e-9BSPPiebXKTB5r7_ErT'],
              nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
              blockExplorerUrls: ['https://sepolia.basescan.org']
            }]
          });
        } catch (addError) {
          throw new Error('Failed to add network');
        }
      }
    }

    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    const nftContract = new ethers.Contract(
      NFT_CONTRACT_ADDRESS,
      ['function mintTo(address recipient, string metadata) public returns (uint)'],
      signer
    );

    const metadata = {
      name: idea.Title,
      description: idea.Experiment,
      attributes: [
        { trait_type: 'Novelty', value: idea.Novelty },
        { trait_type: 'Feasibility', value: idea.Feasibility },
        { trait_type: 'Impact', value: idea.Interestingness }
      ]
    };

    console.log("Starting transaction...");
    const tx = await nftContract.mintTo(
      await signer.getAddress(),
      JSON.stringify(metadata)
    );

    console.log("Waiting for confirmation...");
    const receipt = await tx.wait();
    console.log("Transaction confirmed:", receipt);
    console.log("Events:", receipt.events);

    // Update state with transaction details
    setResearchIdeas(prevIdeas => {
      const newIdeas = prevIdeas.map(item => ({
        ...item,
        scoredText: item.scoredText.map(st => ({
          ...st,
          ideas: st.ideas.map(i => 
            isSameIdea(i, idea) ? { 
              ...i, 
              isMinted: true, 
              isPending: false,
              mintTx: receipt.transactionHash,
              mintBlock: receipt.blockNumber,
              tokenId: receipt.events?.[0]?.args?.[2]?.toString() || 'Unknown'
            } : i
          )
        }))
      }));
      console.log("Updated ideas:", newIdeas);
      return newIdeas;
    });

  } catch (error) {
    console.error('Minting error:', error);
    
    // Reset pending state on error
    setResearchIdeas(prevIdeas => prevIdeas.map(item => ({
      ...item,
      scoredText: item.scoredText.map(st => ({
        ...st,
        ideas: st.ideas.map(i => 
          isSameIdea(i, idea) ? { ...i, isPending: false } : i
        )
      }))
    })));

    if (error.message.includes('rejected')) {
      alert('Transaction was rejected');
    } else {
      alert('Error minting NFT: ' + error.message);
    }
  }
};


const handleIPRegistration = async (idea) => {
  try {
    if (!window.ethereum) return;

    // Create a function to identify the same idea
    const isSameIdea = (a, b) => 
      a.Title === b.Title && 
      a.Experiment === b.Experiment && 
      a.Novelty === b.Novelty;
    
    // Set pending state
    setResearchIdeas(prevIdeas => prevIdeas.map(item => ({
      ...item,
      scoredText: item.scoredText.map(st => ({
        ...st,
        ideas: st.ideas.map(i => 
          isSameIdea(i, idea) ? { ...i, isRegistrationPending: true } : i
        )
      }))
    })));

    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    const registrationWorkflows = new ethers.Contract(
      "0xde13Be395E1cd753471447Cf6A656979ef87881c",
      [
        'function mintAndRegisterIp(address collection, address recipient, tuple(string ipMetadataURI, bytes32 ipMetadataHash, string nftMetadataURI, bytes32 nftMetadataHash) metadata) returns (address ipId, uint256 tokenId)'
      ],
      signer
    );

    const metadata = {
      ipMetadataURI: "",
      ipMetadataHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes(JSON.stringify({
        title: idea.Title,
        description: idea.Experiment,
        attributes: [
          { key: 'Novelty', value: idea.Novelty },
          { key: 'Feasibility', value: idea.Feasibility },
          { key: 'Impact', value: idea.Interestingness }
        ]
      }))),
      nftMetadataURI: "",
      nftMetadataHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes(JSON.stringify({
        name: idea.Title,
        description: idea.Experiment
      })))
    };

    const tx = await registrationWorkflows.mintAndRegisterIp(
      NFT_CONTRACT_ADDRESS,
      await signer.getAddress(),
      metadata
    );

    console.log("Waiting for registration confirmation...");
    const receipt = await tx.wait();
    console.log("Registration confirmed:", receipt);
    
    // Update state to show registered with transaction details
    setResearchIdeas(prevIdeas => prevIdeas.map(item => ({
      ...item,
      scoredText: item.scoredText.map(st => ({
        ...st,
        ideas: st.ideas.map(i => 
          isSameIdea(i, idea) ? { 
            ...i, 
            isRegistered: true, 
            isRegistrationPending: false,
            registrationTx: receipt.transactionHash,
            registrationBlock: receipt.blockNumber
          } : i
        )
      }))
    })));

    setProgressMessages(prev => [...prev, "Registered as IP Asset!"]);
    
  } catch (error) {
    console.error('IP registration error:', error);
    
    // Reset pending state on error
    setResearchIdeas(prevIdeas => prevIdeas.map(item => ({
      ...item,
      scoredText: item.scoredText.map(st => ({
        ...st,
        ideas: st.ideas.map(i => 
          isSameIdea(i, idea) ? { ...i, isRegistrationPending: false } : i
        )
      }))
    })));
    
    setIdeasError(`Failed to register IP: ${error.message}`);
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

          {/* Control Panel Grid */}
{/* Control Panel with margin text */}
<div className="relative"> {/* Add this wrapper div */}
  {/* Left margin text */}
  <div className="absolute -left-40 top-1/2 transform -translate-y-1/2 text-xs w-32 text-right">
  
  </div>
  
  {/* Right margin text */}
  <div className="absolute -right-40 top-1/2 transform -translate-y-1/2 text-xs w-32">

  </div>

  {/* Control Panel Grid */}
  <div className="grid grid-cols-4 gap-4 p-4 border-b border-black">
    <div className="border border-black p-2">
      <div className="text-center">2/5/84</div>
      <div className="text-center">22:32:50</div>
    </div>
    <div className="border border-black p-2 flex flex-col items-center justify-center">
      <div className="text-4xl font-bold font-mono">
        {researchIdeas[0]?.scoredText?.[0]?.ideas?.filter(idea => idea.Novelty > 6).length || 0}
      </div>
      <div className="text-xs mt-1">NOVEL IDEAS</div>
    </div>
    <div className="border border-black p-2 flex flex-col items-center justify-center">
      <div className="text-4xl font-bold font-mono">
        {progressMessages.filter(msg => msg.includes('Reflection')).length || 0}
      </div>
      <div className="text-xs mt-1">SELF REFLECTION ROUNDS</div>
    </div>
    <div className="border border-black p-2">
      <div className="grid grid-cols-2 gap-1">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="border border-black aspect-square flex items-center justify-center">
            <div className="text-2xl font-mono font-bold">
              {loading ? randomValues[i] : ''}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
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