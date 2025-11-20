import { useEffect, useRef, useState } from 'react';
import './App.css';
import { getRandomQuote } from './quotes';
import { getRandomStar } from './stars';

function App() {
	const videoRef = useRef(null);
	const canvasRef = useRef(null);
	const animationFrameRef = useRef(null);
	const [rows, setRows] = useState(0);
	const [filledSquares, setFilledSquares] = useState(new Map()); // Map of square index to quote
	const [currentPage, setCurrentPage] = useState('home'); // 'home', 'dark-forest', 'hope', 'humanity'
	const [circles, setCircles] = useState([]); // Array of {id, x, y} for dark forest page
	const [particles, setParticles] = useState([]); // Array of particle animations for destroyed stars
	const [hopeInput, setHopeInput] = useState('');
	const [hopeNotes, setHopeNotes] = useState([]);
	const [hopeItems, setHopeItems] = useState([]);
	const [dragState, setDragState] = useState(null);

	useEffect(() => {
		// Ensure video plays
		if (videoRef.current) {
			videoRef.current.play().catch((err) => {
				console.log('Video autoplay failed:', err);
			});
		}
	}, []);

	useEffect(() => {
		// Calculate number of rows to maintain square cells
		const calculateRows = () => {
			const cols = 6;
			const cellWidth = window.innerWidth / cols;
			const calculatedRows = Math.ceil(window.innerHeight / cellWidth);
			setRows(calculatedRows);
		};

		calculateRows();
		window.addEventListener('resize', calculateRows);
		return () => window.removeEventListener('resize', calculateRows);
	}, []);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext('2d');
		let animationTime = 0;

		const resizeCanvas = () => {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		};

		resizeCanvas();
		window.addEventListener('resize', resizeCanvas);

		// Figure-8 orbit parametric equations
		const getFigure8Position = (t) => {
			// Scale factor: 4 squares wide = 4/6 of screen width
			// Figure-8 width is 2*scale, so scale = (4/6 * window.innerWidth) / 2
			const cellWidth = window.innerWidth / 6;
			const scale = (cellWidth * 4) / 2; // At least 4 squares wide
			const centerX = window.innerWidth / 2;
			const centerY = window.innerHeight / 2;

			// Parametric equations for figure-8 orbit
			const x = centerX + scale * Math.sin(t);
			const y = centerY + scale * Math.sin(t) * Math.cos(t);

			return { x, y };
		};

		const draw = () => {
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			// Draw the figure-8 path
			ctx.strokeStyle = 'white';
			ctx.lineWidth = 2;
			ctx.beginPath();

			const pathPoints = 200;
			for (let i = 0; i <= pathPoints; i++) {
				const t = (i / pathPoints) * Math.PI * 2;
				const pos = getFigure8Position(t);
				if (i === 0) {
					ctx.moveTo(pos.x, pos.y);
				} else {
					ctx.lineTo(pos.x, pos.y);
				}
			}
			ctx.stroke();

			// Draw three bodies with different sizes and phase offsets
			const period = Math.PI * 2;
			const bodySizes = [18, 24, 15]; // Different sizes for the three bodies
			const phaseOffsets = [0, period / 3, (2 * period) / 3]; // Offset by 1/3 period each

			for (let i = 0; i < 3; i++) {
				const t = (animationTime + phaseOffsets[i]) % period;
				const pos = getFigure8Position(t);

				// Draw white circle
				ctx.fillStyle = 'white';
				ctx.beginPath();
				ctx.arc(pos.x, pos.y, bodySizes[i], 0, Math.PI * 2);
				ctx.fill();
			}

			animationTime += 0.01;
			animationFrameRef.current = requestAnimationFrame(draw);
		};

		draw();

		return () => {
			window.removeEventListener('resize', resizeCanvas);
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
			}
		};
	}, []);

	useEffect(() => {
		if (currentPage !== 'dark-forest') {
			setCircles([]); // Clear circles when leaving dark forest page
			return;
		}

		// Function to check if a position overlaps with existing circles
		const checkOverlap = (x, y, existingCircles) => {
			const circleRadius = 15; // 30px diameter / 2
			const minDistance = circleRadius * 2 + 20; // Minimum distance between circle centers (with 20px margin)

			for (const circle of existingCircles) {
				const distance = Math.sqrt(Math.pow(x - circle.x, 2) + Math.pow(y - circle.y, 2));
				if (distance < minDistance) {
					return true; // Overlaps
				}
			}
			return false; // No overlap
		};

		// Function to find a non-overlapping position
		const findNonOverlappingPosition = (existingCircles) => {
			const maxAttempts = 50;
			let attempts = 0;

			while (attempts < maxAttempts) {
				const x = Math.random() * (window.innerWidth - 100) + 50;
				const y = Math.random() * (window.innerHeight - 150) + 50;

				if (!checkOverlap(x, y, existingCircles)) {
					return { x, y };
				}
				attempts++;
			}

			// If we can't find a position, return a default one (should rarely happen)
			return {
				x: Math.random() * (window.innerWidth - 100) + 50,
				y: Math.random() * (window.innerHeight - 150) + 50,
			};
		};

		// Function to add a new circle
		const addCircle = () => {
			setCircles((prev) => {
				const position = findNonOverlappingPosition(prev);
				const newCircle = {
					id: Date.now() + Math.random(),
					x: position.x,
					y: position.y,
					createdAt: Date.now(),
					starName: getRandomStar(),
				};
				return [...prev, newCircle];
			});
		};

		// Add first circle immediately
		addCircle();

		let circleCount = 1; // Track how many circles we've added in this cycle
		let timeoutId = null;

		const scheduleNextCircle = () => {
			// Every 10 seconds (5 circles at 2s intervals), clear all and wait 3 seconds
			if (circleCount >= 9) {
				// Clear all circles after 10 seconds
				setCircles([]);
				// Wait 3 seconds, then start cycle again
				timeoutId = setTimeout(() => {
					circleCount = 0; // Reset counter
					addCircle(); // Start with first circle
					circleCount++;
					scheduleNextCircle();
				}, 3000);
			} else {
				// Continue normal 2 second interval
				timeoutId = setTimeout(() => {
					addCircle();
					circleCount++;
					scheduleNextCircle();
				}, 2000);
			}
		};

		// Start the cycle
		scheduleNextCircle();

		return () => {
			if (timeoutId) clearTimeout(timeoutId);
		};
	}, [currentPage]);

	// Remove individual circles after 6 seconds
	useEffect(() => {
		if (currentPage !== 'dark-forest') return;

		const cleanupInterval = setInterval(() => {
			setCircles((prev) => {
				const now = Date.now();
				return prev.filter((circle) => now - circle.createdAt < 6000); // Keep circles less than 6 seconds old
			});
		}, 100); // Check every 100ms for smooth removal

		return () => clearInterval(cleanupInterval);
	}, [currentPage, circles.length]);

	// Handle star destruction
	const handleStarClick = (circleId, x, y) => {
		// Remove the star from circles
		setCircles((prev) => prev.filter((circle) => circle.id !== circleId));

		// Create pixel particles
		const particleCount = 20;
		const newParticles = [];
		for (let i = 0; i < particleCount; i++) {
			newParticles.push({
				id: `${circleId}-${i}-${Date.now()}`,
				x: x + (Math.random() - 0.5) * 30,
				y: y + (Math.random() - 0.5) * 30,
				vx: (Math.random() - 0.5) * 0.8,
				vy: (Math.random() - 0.5) * 0.8,
				opacity: 1,
				size: 3 + Math.random() * 3,
				createdAt: Date.now(),
			});
		}
		setParticles((prev) => [...prev, ...newParticles]);
	};

	// Animate particles
	useEffect(() => {
		if (currentPage !== 'dark-forest' || particles.length === 0) return;

		const animationInterval = setInterval(() => {
			setParticles((prev) => {
				const now = Date.now();
				return prev
					.map((particle) => {
						const age = now - particle.createdAt;
						const lifetime = 3500; // slower fade-out

						if (age > lifetime) {
							return null; // Remove particle
						}

						// Update position
						const newX = particle.x + particle.vx;
						const newY = particle.y + particle.vy;

						// Fade out
						const opacity = 1 - age / lifetime;

						return {
							...particle,
							x: newX,
							y: newY,
							opacity,
						};
					})
					.filter((p) => p !== null);
			});
		}, 16); // ~60fps

		return () => clearInterval(animationInterval);
	}, [currentPage, particles.length]);

	// Clear particles when leaving dark forest page
	useEffect(() => {
		if (currentPage !== 'dark-forest') {
			setParticles([]);
		}
	}, [currentPage]);

	// Content filter to prevent hate speech, harassment, slurs, and bad words
	const containsBadWords = (text) => {
		const badWords = [
			'cheating',
			// Hate speech and slurs (common examples - you may want to expand this list)
			'nigger',
			'nigga',
			'nazi',
			'kkk',
			'faggot',
			'fag',
			'dyke',
			'tranny',
			'retard',
			'retarded',
			'spastic',
			'chink',
			'gook',
			'jap',
			'wetback',
			'kike',
			'yid',
			'towelhead',
			'sandnigger',
			// Harassment and offensive terms
			'kill yourself',
			'kys',
			'die',
			'suicide',
			'rape',
			'rapist',
			'molest',
			// Other offensive terms
			'bitch',
			'whore',
			'slut',
			'cunt',
			'asshole',
			'dickhead',
			'motherfucker',
			'dick',
			'penis',
			'vagina',
		];

		const lowerText = text.toLowerCase();
		return badWords.some((word) => lowerText.includes(word));
	};

	const handleHopeSubmit = (e) => {
		e.preventDefault();
		const text = hopeInput.trim();
		if (!text) return;

		// Check for bad words - if found, don't create the note
		if (containsBadWords(text)) {
			setHopeInput('');
			return;
		}

		const noteWidth = 220;
		const noteHeight = 220;
		const xMax = Math.max(window.innerWidth - noteWidth, 0);
		const yMax = Math.max(window.innerHeight - noteHeight, 0);

		const note = {
			id: Date.now(),
			text,
			x: Math.random() * xMax,
			y: Math.random() * yMax,
		};

		setHopeNotes((prev) => [...prev, note]);
		setHopeInput('');
	};

	const handleSpawnClick = () => {
		const assets = [
			'/lucky_drops/meds.png',
			'/lucky_drops/tape.png',
			'/lucky_drops/stamp.png',
			'/lucky_drops/star.png',
			'/lucky_drops/price.png',
			'/lucky_drops/clover.png',
		];
		const asset = assets[Math.floor(Math.random() * assets.length)];
		const minSize = 90;
		const maxSize = 140;
		const size = minSize + Math.random() * (maxSize - minSize);
		const xMax = Math.max(window.innerWidth - size, 0);
		const yMax = Math.max(window.innerHeight - size, 0);
		const item = {
			id: Date.now() + Math.random(),
			img: asset,
			x: Math.random() * xMax,
			y: Math.random() * yMax,
			width: size,
			height: size,
			rotation: Math.random() * 16 - 8,
		};
		setHopeItems((prev) => [...prev, item]);
	};

	const handleDragStart = (kind, id, width, height) => (e) => {
		e.preventDefault();
		const collection = kind === 'note' ? hopeNotes : hopeItems;
		const target = collection.find((entry) => entry.id === id);
		if (!target) return;
		setDragState({
			kind,
			id,
			offsetX: e.clientX - target.x,
			offsetY: e.clientY - target.y,
			width,
			height,
		});
	};

	useEffect(() => {
		if (!dragState) return;

		const handleMouseMove = (e) => {
			e.preventDefault();
			const newX = Math.min(Math.max(e.clientX - dragState.offsetX, 0), window.innerWidth - dragState.width);
			const newY = Math.min(Math.max(e.clientY - dragState.offsetY, 0), window.innerHeight - dragState.height);

			if (dragState.kind === 'note') {
				setHopeNotes((prev) => prev.map((note) => (note.id === dragState.id ? { ...note, x: newX, y: newY } : note)));
			} else {
				setHopeItems((prev) => prev.map((item) => (item.id === dragState.id ? { ...item, x: newX, y: newY } : item)));
			}
		};

		const handleMouseUp = () => {
			setDragState(null);
		};

		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', handleMouseUp);

		return () => {
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mouseup', handleMouseUp);
		};
	}, [dragState]);

	return (
		<div className="app-container">
			{currentPage === 'dark-forest' && (
				<div className="top-banner">
					If he finds other life— an angel or a demon—there’s only one thing he can do:&nbsp;
					<span className="emphasis-text">open fire and eliminate them.</span>
					<br />
					<span className="top-banner-secondary">this is the picture of cosmic civilization.</span>
				</div>
			)}
			{currentPage === 'home' && (
				<>
					<video ref={videoRef} className="background-video" autoPlay loop muted playsInline preload="auto">
						<source src="/background.mp4" type="video/mp4" />
						Your browser does not support the video tag.
					</video>
					<div className="grid-overlay" style={{ gridTemplateColumns: `repeat(6, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}>
						{Array.from({ length: rows * 6 }, (_, index) => {
							const isFilled = filledSquares.has(index);
							const quote = filledSquares.get(index);

							return (
								<div
									key={index}
									className={`grid-cell ${isFilled ? 'filled' : ''}`}
									onClick={() => {
										const newFilledSquares = new Map(filledSquares);
										if (isFilled) {
											newFilledSquares.delete(index);
										} else {
											newFilledSquares.set(index, getRandomQuote());
										}
										setFilledSquares(newFilledSquares);
									}}
								>
									{isFilled && <div className="quote-text">{quote}</div>}
								</div>
							);
						})}
					</div>
					<canvas ref={canvasRef} className="figure8-animation"></canvas>
				</>
			)}
			{currentPage === 'dark-forest' && (
				<div className="dark-forest-page">
					{circles.map((circle) => (
						<div
							key={circle.id}
							className="dark-forest-circle-container"
							style={{ left: `${circle.x}px`, top: `${circle.y}px` }}
							onClick={(e) => {
								e.stopPropagation();
								handleStarClick(circle.id, circle.x, circle.y);
							}}
						>
							<div className="dark-forest-circle"></div>
							<div className="dark-forest-text">{circle.starName}</div>
						</div>
					))}
					{particles.map((particle) => (
						<div
							key={particle.id}
							className="star-particle"
							style={{
								left: `${particle.x}px`,
								top: `${particle.y}px`,
								opacity: particle.opacity,
								width: `${particle.size}px`,
								height: `${particle.size}px`,
							}}
						></div>
					))}
				</div>
			)}
			{currentPage === 'hope' && (
				<div className="hope-page">
					<video className="hope-video" autoPlay loop muted playsInline preload="auto">
						<source src="/earth.mp4" type="video/mp4" />
						Your browser does not support the video tag.
					</video>
					<button className="hope-spawner" onClick={handleSpawnClick} aria-label="spawn keepsake">
						<img src="/13.png" alt="Spawn keepsake" />
					</button>
					<div className="hope-overlay">
						<h2 className="hope-question">What is love?</h2>
						<form className="hope-form" onSubmit={handleHopeSubmit}>
							<textarea
								className="hope-input"
								placeholder="Share your definition..."
								value={hopeInput}
								onChange={(e) => setHopeInput(e.target.value)}
							></textarea>
							<button type="submit" className="hope-submit">
								Pin it
							</button>
						</form>
					</div>
					{hopeNotes.map((note) => (
						<div
							key={note.id}
							className="hope-note"
							style={{ left: `${note.x}px`, top: `${note.y}px` }}
							onMouseDown={handleDragStart('note', note.id, 220, 220)}
						>
							<p>{note.text}</p>
						</div>
					))}
					{hopeItems.map((item) => (
						<div
							key={item.id}
							className="hope-item"
							style={{
								left: `${item.x}px`,
								top: `${item.y}px`,
								width: `${item.width}px`,
								height: `${item.height}px`,
								transform: `rotate(${item.rotation}deg)`,
								backgroundImage: `url('${item.img}')`,
							}}
							onMouseDown={handleDragStart('item', item.id, item.width, item.height)}
						></div>
					))}
				</div>
			)}
			<div className="bottom-panel">
				<div className="panel-content">
					<button
						className={`nav-button ${currentPage === 'dark-forest' ? 'active' : ''}`}
						onClick={() => setCurrentPage(currentPage === 'dark-forest' ? 'home' : 'dark-forest')}
					>
						"dark forest"
					</button>
					<button className={`nav-button ${currentPage === 'hope' ? 'active' : ''}`} onClick={() => setCurrentPage('hope')}>
						"hope"
					</button>
					<button className={`nav-button ${currentPage === 'home' ? 'active' : ''}`} onClick={() => setCurrentPage('home')}>
						"humanity"
					</button>
				</div>
			</div>
		</div>
	);
}

export default App;
