import {useState, useEffect, useRef} from 'react'
import {Link} from 'react-router-dom'
import './App.css'
import defaultSpeakers from './speakers.json'

function ScrumTeam() {

    // State variables
    const [speakers, setSpeakers] = useState(defaultSpeakers);
    const [newSpeakerName, setNewSpeakerName] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPhase, setCurrentPhase] = useState(0);
    const [timeLeft, setTimeLeft] = useState(speakers[1].duration); // Initialize with first speaker's time
    const [isRunning, setIsRunning] = useState(false);
    const [isOvertime, setIsOvertime] = useState(false);
    const [completedPhases, setCompletedPhases] = useState([]);
    const [stopwatchTime, setStopwatchTime] = useState(0);
    const [isMeetingEnded, setIsMeetingEnded] = useState(false);
    const [startTime, setStartTime] = useState(null);
    const [isCollapsed, setIsCollapsed] = useState(true); // Default to collapsed
    const [timeout] = useState(100);

    // Calculate speaker durations based on equal parts of 15 minutes with 5-second buffers
    const calculateSpeakerDurations = (speakersList) => {
        // Get the number of regular speakers and Spannungsspeicher (excluding initial and Blocker)
        // We only exclude the initial phase (index 0) and the Blocker phase (second to last)
        const regularSpeakers = speakersList.slice(1, -1);
        const numSpeakers = regularSpeakers.length;

        if (numSpeakers === 0) return speakersList;

        // Total time: 15 minutes (900 seconds)
        const totalTime = 900;
        // Buffer time between speakers: 5 seconds
        const bufferTime = 5;
        // Total buffer time needed
        const totalBufferTime = (numSpeakers - 1) * bufferTime;
        // Time available for speakers after accounting for buffers
        const availableTime = totalTime - totalBufferTime;
        // Time per speaker
        const timePerSpeaker = Math.floor(availableTime / numSpeakers);

        // Create a new array with updated durations
        const updatedSpeakers = [...speakersList];

        // Update durations for regular speakers and Spannungsspeicher
        for (let i = 1; i <= numSpeakers; i++) {
            // This now includes the Spannungsspeicher phase
            updatedSpeakers[i].duration = timePerSpeaker;
        }

        return updatedSpeakers;
    };

    // Function to add a new speaker
    const addSpeaker = () => {
        if (newSpeakerName.trim()) {
            // Add new speaker before the last two items (Blocker and Spannungsspeicher)
            const newSpeaker = {
                name: newSpeakerName,
                duration: 0, // Temporary duration, will be calculated
                theme: "theme-team"
            };

            const lastTwoItems = speakers.slice(-2);
            const otherItems = speakers.slice(0, -2);

            // Create new speakers array with the new speaker
            const newSpeakersArray = [
                ...otherItems,
                newSpeaker,
                ...lastTwoItems
            ];

            // Calculate durations for all speakers
            const updatedSpeakers = calculateSpeakerDurations(newSpeakersArray);

            // Update state with the new speakers array
            setSpeakers(updatedSpeakers);

            setNewSpeakerName('');
        }
    };

    // Function to clear all speakers except initial, Blocker, and Spannungsspeicher
    const clearSpeakers = () => {
        // Keep only the initial item (index 0), Blocker (second to last), and Spannungsspeicher (last)
        const initialItem = speakers[0];
        const blockerItem = speakers[speakers.length - 2];
        const spannungsspeicherItem = speakers[speakers.length - 1];

        const newSpeakersArray = [initialItem, blockerItem, spannungsspeicherItem];

        // Calculate durations for the remaining speakers
        const updatedSpeakers = calculateSpeakerDurations(newSpeakersArray);

        // Update state with the new speakers array
        setSpeakers(updatedSpeakers);
    };

    // Function to randomize the order of speakers, keeping Spannungsspeicher as last
    const randomizeSpeakers = () => {
        // Get the initial item, regular speakers, Blocker, and Spannungsspeicher
        const initialItem = speakers[0];
        const regularSpeakers = speakers.slice(1, -2);
        const blockerItem = speakers[speakers.length - 2];
        const spannungsspeicherItem = speakers[speakers.length - 1];

        // Randomize the order of regular speakers
        const shuffledSpeakers = [...regularSpeakers];
        for (let i = shuffledSpeakers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledSpeakers[i], shuffledSpeakers[j]] = [shuffledSpeakers[j], shuffledSpeakers[i]];
        }

        // Create new speakers array with randomized order
        const newSpeakersArray = [
            initialItem,
            ...shuffledSpeakers,
            blockerItem,
            spannungsspeicherItem
        ];

        // Calculate durations for all speakers
        const updatedSpeakers = calculateSpeakerDurations(newSpeakersArray);

        // Update state with the new speakers array
        setSpeakers(updatedSpeakers);
    };

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
                setTimeLeft(speakers[nextPhase].duration);
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
                const phaseDuration = Math.round((speakers[currentPhase].duration - timeLeft) * 10) / 10; // Round to 1 decimal place
                setCompletedPhases(prev => [
                    ...prev,
                    {
                        name: speakers[currentPhase].name,
                        duration: phaseDuration,
                        theme: speakers[currentPhase].theme
                    }
                ]);
            }

            // Move to next phase
            const nextPhase = currentPhase + 1;
            if (nextPhase < speakers.length) {
                setCurrentPhase(nextPhase);
                setTimeLeft(speakers[nextPhase].duration);
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
        if (!speakers[currentPhase].isInitial) {
            setTimeLeft(speakers[currentPhase].duration);
        }
    }, [currentPhase]);

    // Calculate durations when component mounts
    useEffect(() => {
        // Calculate durations for initial speakers
        const calculatedSpeakers = calculateSpeakerDurations(speakers);
        setSpeakers(calculatedSpeakers);
    }, []);

    // Clean up intervals on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (stopwatchRef.current) clearInterval(stopwatchRef.current);
        };
    }, []);

    // Calculate progress percentage for the timer circle
    const calculateProgress = () => {
        if (speakers[currentPhase].isInitial) return 100;
        const totalDuration = speakers[currentPhase].duration;
        const progress = (timeLeft / totalDuration) * 100;
        return Math.max(0, Math.min(100, progress)); // Ensure progress is between 0 and 100
    };

    // Get current theme class
    const getCurrentThemeClass = () => {
        if (isOvertime) return "theme-overtime";
        return speakers[currentPhase].theme;
    };

    return (
        <div className={`app-container ${getCurrentThemeClass()}`}>
            <div className="fixed-content">
                <header>
                    <div className="nav-links">
                        <Link to="/">Teams</Link>
                        <Link to="/scrum-team" className="active">Individuals</Link>
                    </div>
                    <h1>{speakers[currentPhase].name}</h1>
                </header>

                {isModalOpen && (
                    <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2 className="modal-title">Manage Speakers</h2>
                                <button 
                                    className="modal-close-button"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    ×
                                </button>
                            </div>

                            <div className="speaker-form">
                                <div className="input-group">
                                    <input
                                        type="text"
                                        value={newSpeakerName}
                                        onChange={(e) => setNewSpeakerName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                addSpeaker();
                                            }
                                        }}
                                        placeholder="Enter speaker name"
                                        className="speaker-input"
                                    />
                                    <div className="duration-info">
                                        <p>Speaker times are automatically calculated as equal parts of 15 minutes with 5-second buffers between speakers.</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={addSpeaker}
                                    className="add-speaker-button"
                                >
                                    Add Speaker
                                </button>
                            </div>

                            <div className="speakers-list">
                                <div className="speakers-actions">
                                    <button 
                                        onClick={clearSpeakers}
                                        className="clear-speakers-button"
                                        disabled={speakers.length <= 3}
                                    >
                                        Clear Speakers
                                    </button>
                                    <button 
                                        onClick={randomizeSpeakers}
                                        className="random-order-button"
                                        disabled={speakers.length <= 3}
                                    >
                                        Random Order
                                    </button>
                                </div>

                                <h3>Speakers:</h3>
                                <ul>
                                    {speakers.slice(1, -2).map((speaker, index) => {
                                        // The actual index in the speakers array is index + 1 (to account for the initial item)
                                        const actualIndex = index + 1;
                                        return (
                                            <li key={index}>
                                                <div className="speaker-info">
                                                    <span className="speaker-name">{speaker.name}</span>
                                                    <span className="speaker-duration">{Math.floor(speaker.duration / 60)}:{(speaker.duration % 60).toString().padStart(2, '0')}</span>
                                                </div>
                                                <button 
                                                    onClick={() => {
                                                        const updatedSpeakers = [...speakers];
                                                        updatedSpeakers.splice(actualIndex, 1);
                                                        // Recalculate durations after removing a speaker
                                                        const recalculatedSpeakers = calculateSpeakerDurations(updatedSpeakers);
                                                        setSpeakers(recalculatedSpeakers);
                                                    }}
                                                    className="remove-speaker-button"
                                                >
                                                    ✕
                                                </button>
                                            </li>
                                        );
                                    })}

                                    {/* Blocker & Hindernisse as irremovable item */}
                                    <li className="blocker-item">
                                        <div className="speaker-info">
                                            <span className="speaker-name">{speakers[speakers.length - 2].name}</span>
                                            <span className="speaker-duration">{Math.floor(speakers[speakers.length - 2].duration / 60)}:{(speakers[speakers.length - 2].duration % 60).toString().padStart(2, '0')}</span>
                                        </div>
                                        <div className="irremovable-indicator">
                                            <span>Irremovable</span>
                                        </div>
                                    </li>

                                    {/* Spannungsspeicher as irremovable item */}
                                    <li className="spannungsspeicher-item">
                                        <div className="speaker-info">
                                            <span className="speaker-name">{speakers[speakers.length - 1].name}</span>
                                            <span className="speaker-duration">{Math.floor(speakers[speakers.length - 1].duration / 60)}:{(speakers[speakers.length - 1].duration % 60).toString().padStart(2, '0')}</span>
                                        </div>
                                        <div className="irremovable-indicator">
                                            <span>Irremovable</span>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

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

                    {!isRunning && currentPhase === 0 && (
                        <button 
                            className="manage-speakers-button"
                            onClick={() => setIsModalOpen(true)}
                        >
                            Manage Speakers
                        </button>
                    )}
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

export default ScrumTeam
