import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";

// --- Constants & Config ---
const LEAFS_BLUE = '#00205B';
const LEAFS_WHITE = '#FFFFFF';
const SILVER = '#A2AAAD';
const RED_ALERT = '#E31837';

// Wheel Segments (The "Timelines")
const SEGMENTS = [
  "Day-to-Day",
  "Week-to-Week",
  "Month-to-Month",
  "Indefinite",
  "Game-Time Decision",
  "Robidas Island", // Shortened for legibility
  "Maintenance Day",
  "Until Playoffs"
];

// Map display names to prompt names if needed, or just use the display name
// "Robidas Island" implies LTIR effectively.

// --- Gemini API Setup ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

async function generateFunnyInjury(timelineCategory) {
  // Expand shorthand for the prompt
  let promptTimeline = timelineCategory;
  if (timelineCategory === "Robidas Island") promptTimeline = "Long Term Injured Reserve (LTIR) / Robidas Island";

  try {
    const prompt = `
      You are a satirical, cynical beat reporter covering the Toronto Maple Leafs hockey team. 
      The user has spun the 'Injury Wheel' and the official timeline is: "${promptTimeline}".
      
      Generate a funny, modern NHL-style injury update explaining WHY they are out for this specific duration.
      Poke fun at hockey clichés, salary cap circumvention (LTIR), media vagueness ("upper body"), and Toronto's intense market.
      
      Return JSON format with:
      - 'player_alias': A funny generic name (e.g., 'Top Line Winger', 'Overpaid Defenceman', 'The "Starter"').
      - 'diagnosis': The specific, absurd medical reason or excuse for this timeline (e.g. 'General malaise', 'Hurt feelings', 'Too much fortnite').
      - 'timeline': The timeline category ("${promptTimeline}") with a funny parenthetical addition.
      - 'coach_quote': A cliché quote from the coach trying to dodge the question about this specific timeline.
      - 'cap_implication': A snarky comment about how this helps or hurts the salary cap situation.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            player_alias: { type: Type.STRING },
            diagnosis: { type: Type.STRING },
            timeline: { type: Type.STRING },
            coach_quote: { type: Type.STRING },
            cap_implication: { type: Type.STRING },
          },
        },
      },
    });
    
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      player_alias: "Core Four Member",
      diagnosis: "Failed to load AI wit.",
      timeline: timelineCategory,
      coach_quote: "We're just taking it one error at a time.",
      cap_implication: "We are over the limit."
    };
  }
}

// --- Components ---

const Spinner = () => (
  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const Wheel = ({ onSpinEnd, isSpinning }) => {
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const wheelRef = useRef(null);

  // Wheel Size Config
  const WHEEL_SIZE = 500; // Bigger base size
  // Increased offset to move text to wider part of the wedge
  const LABEL_OFFSET = 175; 

  // Responsive scaling
  useEffect(() => {
    const handleResize = () => {
      const padding = 40;
      const availableWidth = window.innerWidth - padding;
      if (availableWidth < WHEEL_SIZE) {
        setScale(availableWidth / WHEEL_SIZE);
      } else {
        setScale(1);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSpin = () => {
    if (isSpinning) return;

    const segmentAngle = 360 / SEGMENTS.length;
    const randomSegment = Math.floor(Math.random() * SEGMENTS.length);
    const extraSpins = 5 + Math.floor(Math.random() * 5);
    
    const randomOffset = Math.floor(Math.random() * 360);
    const newRotation = rotation + (extraSpins * 360) + randomOffset;
    
    setRotation(newRotation);

    setTimeout(() => {
      const normalizedRotation = newRotation % 360;
      const degreesFromTop = (360 - normalizedRotation) % 360;
      const segmentIndex = Math.floor(degreesFromTop / segmentAngle);
      
      onSpinEnd(SEGMENTS[segmentIndex]);
    }, 3000);
  };

  const gradient = SEGMENTS.map((_, i) => {
    const start = (i / SEGMENTS.length) * 100;
    const end = ((i + 1) / SEGMENTS.length) * 100;
    const color = i % 2 === 0 ? LEAFS_BLUE : '#FFFFFF';
    return `${color} ${start}% ${end}%`;
  }).join(', ');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
      {/* Container for scaling */}
      <div style={{ 
        width: `${WHEEL_SIZE}px`, 
        height: `${WHEEL_SIZE}px`,
        position: 'relative',
        transform: `scale(${scale})`,
        transformOrigin: 'center top',
        marginBottom: `-${(WHEEL_SIZE * (1 - scale))}px` // Negative margin to remove empty space when scaled down
      }}>
        {/* Pointer */}
        <div style={{
          position: 'absolute',
          top: '-25px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '0',
          height: '0',
          borderLeft: '25px solid transparent',
          borderRight: '25px solid transparent',
          borderTop: `40px solid ${RED_ALERT}`,
          zIndex: 10,
          filter: 'drop-shadow(0 4px 4px rgba(0,0,0,0.5))'
        }} />

        {/* The Wheel */}
        <div 
          ref={wheelRef}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: `conic-gradient(${gradient})`,
            transform: `rotate(${rotation}deg)`,
            transition: 'transform 3s cubic-bezier(0.25, 0.1, 0.25, 1)',
            boxShadow: '0 0 30px rgba(0,0,0,0.5), inset 0 0 30px rgba(0,0,0,0.5)',
            position: 'relative',
            border: '10px solid white'
          }}
        >
           {/* Labels */}
           {SEGMENTS.map((seg, i) => {
              const angle = (360 / SEGMENTS.length) * i + (360 / SEGMENTS.length) / 2;
              const isBlueBg = i % 2 === 0;
              return (
                <div key={i} style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  // Translate Y negative moves it UP towards the rim
                  transform: `translate(-50%, -50%) rotate(${angle}deg) translate(0, -${LABEL_OFFSET}px)`,
                  textAlign: 'center',
                  width: '110px', // Narrower to prevent overlap
                  color: isBlueBg ? 'white' : LEAFS_BLUE,
                  fontWeight: '800',
                  fontSize: '19px', // Slightly smaller for fit
                  lineHeight: '1.1',
                  textTransform: 'uppercase',
                  fontFamily: "'Barlow Condensed', sans-serif",
                  textShadow: isBlueBg ? '0 2px 4px rgba(0,0,0,0.5)' : 'none',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '80px', // Allow height for wrapping
                }}>
                  {seg}
                </div>
              );
           })}
        </div>
        
        {/* Center Hub */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90px',
          height: '90px',
          background: 'white',
          borderRadius: '50%',
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 5,
          border: `4px solid ${SILVER}`
        }}>
            <img 
                src="https://upload.wikimedia.org/wikipedia/en/thumb/b/b6/Toronto_Maple_Leafs_2016_logo.svg/1200px-Toronto_Maple_Leafs_2016_logo.svg.png" 
                alt="Leafs"
                style={{ width: '60px', height: 'auto' }}
            />
        </div>
      </div>

      <button
        onClick={handleSpin}
        disabled={isSpinning}
        style={{
          background: isSpinning ? SILVER : RED_ALERT,
          color: 'white',
          border: 'none',
          padding: '1.2rem 4rem',
          fontSize: '2rem',
          fontWeight: '900',
          borderRadius: '4px',
          cursor: isSpinning ? 'not-allowed' : 'pointer',
          textTransform: 'uppercase',
          fontFamily: "'Barlow Condensed', sans-serif",
          boxShadow: '0 6px 0 rgba(0,0,0,0.3)',
          transform: isSpinning ? 'translateY(3px)' : 'none',
          transition: 'all 0.2s',
          marginTop: '1rem'
        }}
      >
        {isSpinning ? 'SPINNING...' : 'SPIN'}
      </button>
    </div>
  );
};

const ResultCard = ({ data }) => {
    if (!data) return null;
    
    return (
        <div style={{
            background: 'white',
            color: '#333',
            borderRadius: '8px',
            padding: '0',
            maxWidth: '500px',
            width: '95%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            overflow: 'hidden',
            marginTop: '2rem',
            animation: 'slideUp 0.5s ease-out'
        }}>
            <div style={{ background: LEAFS_BLUE, padding: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: RED_ALERT, padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.8rem', color: 'white', textTransform: 'uppercase'}}>
                    Official Statement
                </div>
                <div style={{ color: 'white', fontWeight: 'bold', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Maple Leafs PR
                </div>
            </div>
            
            <div style={{ padding: '1.5rem' }}>
                <h2 style={{ marginTop: 0, fontSize: '2.2rem', fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase', color: LEAFS_BLUE, lineHeight: '1' }}>
                    {data.player_alias}
                </h2>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginTop: '1rem' }}>
                    <div style={{ background: '#f0f4f8', padding: '1rem', borderRadius: '6px', borderLeft: `6px solid ${SILVER}` }}>
                        <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: '#666', fontWeight: 'bold', marginBottom: '4px' }}>Timeline</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>{data.timeline}</div>
                    </div>

                    <div style={{ background: '#f0f4f8', padding: '1rem', borderRadius: '6px', borderLeft: `6px solid ${LEAFS_BLUE}` }}>
                        <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: '#666', fontWeight: 'bold', marginBottom: '4px' }}>Probable Cause</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: '600' }}>{data.diagnosis}</div>
                    </div>
                </div>

                <div style={{ marginTop: '1.5rem', fontStyle: 'italic', color: '#444', borderLeft: `4px solid ${RED_ALERT}`, paddingLeft: '1rem', fontSize: '1.1rem' }}>
                    "{data.coach_quote}"
                    <div style={{ fontSize: '0.8rem', marginTop: '4px', color: '#888', fontStyle: 'normal' }}>— Head Coach (declining to elaborate)</div>
                </div>

                <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: LEAFS_BLUE, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>💰</span> {data.cap_implication}
                </div>
            </div>
        </div>
    );
};

const App = () => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

  const handleSpinEnd = async (selectedSegment) => {
    setLoadingAI(true);
    const data = await generateFunnyInjury(selectedSegment);
    setResultData(data);
    setLoadingAI(false);
    setIsSpinning(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '2rem 1rem',
      background: `linear-gradient(135deg, ${LEAFS_BLUE} 0%, #00102B 100%)`,
    }}>
        <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ 
                fontFamily: "'Barlow Condensed', sans-serif", 
                fontSize: 'clamp(2.5rem, 5vw, 4rem)', 
                margin: '0 0 0.5rem 0', 
                textTransform: 'uppercase',
                letterSpacing: '2px',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)'
            }}>
                Leafs Injury <span style={{ color: SILVER }}>Roulette</span>
            </h1>
            <p style={{ color: SILVER, fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
                Spin to reveal the destiny of your favorite roster player.
            </p>
        </header>

        <main style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Wheel onSpinEnd={handleSpinEnd} isSpinning={isSpinning || loadingAI} />

            {loadingAI && (
                <div style={{ marginTop: '2rem', color: 'white', fontSize: '1.5rem', fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '1px', animation: 'pulse 1.5s infinite' }}>
                   CONSULTING MEDICAL STAFF...
                </div>
            )}

            <ResultCard data={resultData} />
        </main>

        <footer style={{ marginTop: 'auto', paddingTop: '3rem', color: '#555', fontSize: '0.8rem', textAlign: 'center' }}>
            This is a parody app. Not affiliated with the NHL. Generated by Gemini.
        </footer>

        <style>{`
            @keyframes slideUp {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            @keyframes pulse {
                0% { opacity: 0.5; }
                50% { opacity: 1; }
                100% { opacity: 0.5; }
            }
        `}</style>
    </div>
  );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);