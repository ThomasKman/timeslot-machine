import {useState, useEffect, useRef} from 'react'
import './App.css'
import phases from './phases.json'

function App() {

    // State variables
    const [currentPhase, setCurrentPhase] = useState(0);
    const [timeLeft, setTimeLeft] = useState(phases[1].duration); // Initialize with first team's time
    const [isRunning, setIsRunning] = useState(false);
    const [isOvertime, setIsOvertime] = useState(false);
    const [completedPhases, setCompletedPhases] = useState([]);
    const [stopwatchTime, setStopwatchTime] = useState(0);
    const [isMeetingEnded, setIsMeetingEnded] = useState(false);
    const [startTime, setStartTime] = useState(null);
    const [isCollapsed, setIsCollapsed] = useState(true); // Default to collapsed
    const [timeout] = useState(1);

    // Timer interval references
    const timerRef = useRef(null);
    const stopwatchRef = useRef(null);

    // Format time as MM:SS
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    // Handle button click
    const handleButtonClick = () => {
        if (isMeetingEnded) return;

        if (!isRunning) {
            // Start timer
            setIsRunning(true);
            setIsOvertime(false);

            // Move to next phase if we're at the initial phase
            if (currentPhase === 0) {
                const nextPhase = 1;
                setCurrentPhase(nextPhase);
                setTimeLeft(phases[nextPhase].duration);
            }

            // Start stopwatch if it's not already running
            if (!stopwatchRef.current) {
                // Record the start time (Berlin time) when the meeting starts
                if (!startTime) {
                    setStartTime(new Date());
                }
                stopwatchRef.current = setInterval(() => {
                    setStopwatchTime(prev => prev + 0.1);
                }, timeout);
            }

            // Start countdown timer
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    // Allow timer to go negative (overtime)
                    if (prev <= 0) {
                        setIsOvertime(true);
                    }
                    return prev - 0.1;
                });
            }, timeout);
        } else {
            // Stop timer
            clearInterval(timerRef.current);
            setIsRunning(false);

            // Record completed phase
            if (currentPhase > 0) {
                const phaseDuration = Math.round((phases[currentPhase].duration - timeLeft) * 10) / 10; // Round to 1 decimal place
                setCompletedPhases(prev => [
                    ...prev,
                    {
                        name: phases[currentPhase].name,
                        duration: phaseDuration,
                        theme: phases[currentPhase].theme
                    }
                ]);
            }

            // Move to next phase
            const nextPhase = currentPhase + 1;
            if (nextPhase < phases.length) {
                setCurrentPhase(nextPhase);
                setTimeLeft(phases[nextPhase].duration);
                setIsOvertime(false);
            } else {
                // End meeting if we've gone through all phases
                setIsMeetingEnded(true);
                clearInterval(stopwatchRef.current);
                stopwatchRef.current = null;
            }
        }
    };

    // Initialize timer when phase changes
    useEffect(() => {
        if (!phases[currentPhase].isInitial) {
            setTimeLeft(phases[currentPhase].duration);
        }
    }, [currentPhase]);

    // Clean up intervals on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (stopwatchRef.current) clearInterval(stopwatchRef.current);
        };
    }, []);

    // Calculate progress percentage for the timer circle
    const calculateProgress = () => {
        if (phases[currentPhase].isInitial) return 100;
        const totalDuration = phases[currentPhase].duration;
        const progress = (timeLeft / totalDuration) * 100;
        return Math.max(0, Math.min(100, progress)); // Ensure progress is between 0 and 100
    };

    // Get current theme class
    const getCurrentThemeClass = () => {
        if (isOvertime) return "theme-overtime";
        return phases[currentPhase].theme;
    };

    return (
        <div className={`app-container ${getCurrentThemeClass()}`}>
            <div className="fixed-content">
                <header>
                    <h1>{phases[currentPhase].name}</h1>
                </header>

                <div className="timer-container">
                    <div className="timer-circle-container">
                        <div
                            className="timer-circle"
                            style={{
                                background: `conic-gradient(
                  var(--progress-color) ${calculateProgress()}%, 
                  var(--background-color) 0
                )`
                            }}
                        >
                            <div className="timer-inner-circle">
                                <div className="countdown-timer">{isOvertime &&
                                    <span className="overtime-indicator">-</span>}&nbsp;
                                    {formatTime(Math.abs(timeLeft))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        className="control-button"
                        onClick={handleButtonClick}
                        disabled={isMeetingEnded}
                        aria-label={isRunning ? "Pause" : "Play"}
                    >
                        {isRunning ? (
                            <span className="button-icon">⏸</span>
                        ) : (
                            <span className="button-icon">▶</span>
                        )}
                    </button>
                </div>
            </div>

            <footer>
                <div className="stopwatch">
                    <div
                        className="meeting-dauer-header"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                    >
                        <div className="header-content">
                            <span>Meeting-Dauer: {formatTime(stopwatchTime)}</span>
                            {startTime && (
                                <div className="start-time">
                                    Meeting-Start: {startTime.toLocaleTimeString('de-DE', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    timeZone: 'Europe/Berlin'
                                })}
                                </div>
                            )}
                        </div>
                        <span className={`toggle-icon ${isCollapsed ? 'collapsed' : 'expanded'}`}>
              ▼
            </span>
                    </div>
                </div>
                <div className={`completed-phases ${isCollapsed ? 'collapsed' : 'expanded'}`}>
                    {completedPhases.map((phase, index) => (
                        <div key={index} className={`completed-phase ${phase.theme}`}>
                            <span className="phase-name">{phase.name}</span>
                            <span className="phase-duration">{formatTime(phase.duration)}</span>
                        </div>
                    ))}
                </div>
            </footer>
        </div>
    )
}

export default App
