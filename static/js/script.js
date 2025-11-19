const samples = [
    'sample_083_custom_segment_075_377',
    'sample_135_custom_segment_036_336',
    'sample_243_custom_segment_021_321',
    'sample_265_custom_segment_084_384',
    'sample_291_custom_segment_100_400',
    'sample_334_custom_segment_134_384'
];

let currentIndex = 0;
let nextSamplePreloaded = false;

const elements = {
    taskText: document.getElementById('taskText'),
    currentFrame: document.getElementById('currentFrame'),
    modelAVideo: document.getElementById('modelAVideo'),
    modelBVideo: document.getElementById('modelBVideo'),
    modelASelect: document.getElementById('modelASelect'),
    modelBSelect: document.getElementById('modelBSelect'),
    modelAProgress: document.getElementById('modelAProgress'),
    modelBProgress: document.getElementById('modelBProgress'),
    modelATime: document.getElementById('modelATime'),
    modelBTime: document.getElementById('modelBTime'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    playBtn: document.getElementById('playBtn'),
    refreshBtn: document.getElementById('refreshBtn'),
    pauseBtn: document.getElementById('pauseBtn'),
    sampleCounter: document.getElementById('sampleCounter')
};

function getVideoPath(model, sample) {
    // Models with ti2v-5B use _current_frame.mp4 suffix
    if (model.includes('ti2v-5B')) {
        return `resources/wm_videos/${model}/${sample}_current_frame.mp4`;
    }
    return `resources/wm_videos/${model}/${sample}.mp4`;
}

async function loadSample(index) {
    const sample = samples[index];
    
    // Update counter
    elements.sampleCounter.textContent = `Sample ${index + 1} of ${samples.length}`;
    
    // Update button states
    elements.prevBtn.disabled = index === 0;
    elements.nextBtn.disabled = index === samples.length - 1;
    
    // Load caption
    try {
        const response = await fetch(`resources/Benchmark/${sample}/${sample}_caption.txt`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        elements.taskText.textContent = text.trim() || 'No description available';
    } catch (e) {
        console.error('Error loading caption:', e);
        elements.taskText.textContent = 'Error loading task description. Make sure you are running a local server (not opening file:// directly). Try: python3 -m http.server 8000';
    }
    
    // Load current frame
    elements.currentFrame.src = `resources/Benchmark/${sample}/${sample}_current_frame.png`;
    
    // Load videos
    elements.modelAVideo.src = getVideoPath(elements.modelASelect.value, sample);
    elements.modelBVideo.src = getVideoPath(elements.modelBSelect.value, sample);
    
    // Reset videos
    elements.modelAVideo.load();
    elements.modelBVideo.load();
    
    // Reset progress bars
    elements.modelAProgress.value = 0;
    elements.modelBProgress.value = 0;
    
    // Preload next sample (TikTok style)
    if (index < samples.length - 1 && !nextSamplePreloaded) {
        preloadNextSample(index + 1);
    }
}

function preloadNextSample(index) {
    if (index >= samples.length) return;
    
    const sample = samples[index];
    const modelA = elements.modelASelect.value;
    const modelB = elements.modelBSelect.value;
    
    // Preload videos
    const preloadGt = new Image();
    preloadGt.src = `resources/Benchmark/${sample}/${sample}_video.mp4`;
    
    const preloadA = new Image();
    preloadA.src = getVideoPath(modelA, sample);
    
    const preloadB = new Image();
    preloadB.src = getVideoPath(modelB, sample);
    
    nextSamplePreloaded = true;
}

function playAllVideos() {
    elements.modelAVideo.play();
    elements.modelBVideo.play();
}

function pauseAllVideos() {
    elements.modelAVideo.pause();
    elements.modelBVideo.pause();
}

// Event listeners
elements.prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) {
        currentIndex--;
        nextSamplePreloaded = false;
        loadSample(currentIndex);
    }
});

elements.nextBtn.addEventListener('click', () => {
    if (currentIndex < samples.length - 1) {
        currentIndex++;
        nextSamplePreloaded = false;
        loadSample(currentIndex);
    }
});

elements.playBtn.addEventListener('click', playAllVideos);

elements.refreshBtn.addEventListener('click', () => {
    // Reload all videos for current sample
    loadSample(currentIndex);
});

elements.pauseBtn.addEventListener('click', pauseAllVideos);

elements.modelASelect.addEventListener('change', () => {
    elements.modelAVideo.src = getVideoPath(elements.modelASelect.value, samples[currentIndex]);
    elements.modelAVideo.load();
});

elements.modelBSelect.addEventListener('change', () => {
    elements.modelBVideo.src = getVideoPath(elements.modelBSelect.value, samples[currentIndex]);
    elements.modelBVideo.load();
});

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' && currentIndex > 0) {
        currentIndex--;
        nextSamplePreloaded = false;
        loadSample(currentIndex);
    } else if (e.key === 'ArrowRight' && currentIndex < samples.length - 1) {
        currentIndex++;
        nextSamplePreloaded = false;
        loadSample(currentIndex);
    } else if (e.key === ' ') {
        e.preventDefault();
        if (elements.modelAVideo.paused) {
            playAllVideos();
        } else {
            pauseAllVideos();
        }
    }
});

// Video control functions
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function setupVideoControls(video, progressBar, timeDisplay, playBtn) {
    let isSeeking = false;
    let pendingSeek = null;
    let rafId = null;
    
    // Update progress bar as video plays (only when not seeking)
    video.addEventListener('timeupdate', () => {
        if (video.duration && !isSeeking) {
            const progress = (video.currentTime / video.duration) * 100;
            progressBar.value = progress;
            timeDisplay.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
        }
    });
    
    // Smooth seeking using requestAnimationFrame
    function performSeek(targetTime) {
        if (rafId) {
            cancelAnimationFrame(rafId);
        }
        
        rafId = requestAnimationFrame(() => {
            // Only seek if not already seeking and target is different enough
            if (Math.abs(video.currentTime - targetTime) > 0.1) {
                video.currentTime = targetTime;
            }
            rafId = null;
        });
    }
    
    // When user starts dragging
    progressBar.addEventListener('mousedown', () => {
        isSeeking = true;
        video.pause();
    });
    
    progressBar.addEventListener('touchstart', () => {
        isSeeking = true;
        video.pause();
    });
    
    // Update both display and video while dragging
    progressBar.addEventListener('input', () => {
        if (video.duration) {
            const time = (progressBar.value / 100) * video.duration;
            timeDisplay.textContent = `${formatTime(time)} / ${formatTime(video.duration)}`;
            
            // Store pending seek and perform it smoothly
            pendingSeek = time;
            performSeek(time);
        }
    });
    
    // When user releases - final seek
    progressBar.addEventListener('change', () => {
        if (video.duration) {
            const time = (progressBar.value / 100) * video.duration;
            video.currentTime = time;
        }
        isSeeking = false;
        pendingSeek = null;
    });
    
    progressBar.addEventListener('mouseup', () => {
        isSeeking = false;
        pendingSeek = null;
    });
    
    progressBar.addEventListener('touchend', () => {
        isSeeking = false;
        pendingSeek = null;
    });
    
    // Play/pause button
    playBtn.addEventListener('click', () => {
        if (video.paused) {
            video.play();
            playBtn.textContent = '⏸';
        } else {
            video.pause();
            playBtn.textContent = '▶';
        }
    });
    
    // Update button when video state changes
    video.addEventListener('play', () => playBtn.textContent = '⏸');
    video.addEventListener('pause', () => playBtn.textContent = '▶');
}

// Setup individual video controls
const playButtons = document.querySelectorAll('.play-btn');
playButtons.forEach(btn => {
    const videoId = btn.getAttribute('data-video');
    const video = document.getElementById(videoId);
    const progressId = videoId.replace('Video', 'Progress');
    const timeId = videoId.replace('Video', 'Time');
    const progressBar = document.getElementById(progressId);
    const timeDisplay = document.getElementById(timeId);
    
    setupVideoControls(video, progressBar, timeDisplay, btn);
});

// Load first sample on page load
loadSample(0);

// Evaluation Pipeline Logic
document.getElementById('btnGenerate').addEventListener('click', function() {
    const container = document.getElementById('containerGenerate');
    container.classList.remove('empty');
    container.innerHTML = `
        <video autoplay loop muted playsinline controls style="width: 100%; height: auto; max-height: 400px;">
            <source src="resources/evaluation_pipeline/sample_291_vggt_veo.mp4" type="video/mp4">
            Your browser does not support the video tag.
        </video>
    `;
    this.disabled = true;
    this.textContent = "Generated";
});

document.getElementById('btnReconstruct').addEventListener('click', function() {
    const container = document.getElementById('containerReconstruct');
    container.classList.remove('empty');
    container.innerHTML = `
        <model-viewer 
            src="resources/evaluation_pipeline/sample_291_vggt_veo.glb" 
            alt="3D Reconstruction"
            loading="eager"
            camera-controls
            touch-action="pan-y"
            environment-image="neutral"
            camera-orbit="auto auto auto"
            zoom-sensitivity="0.2"
            min-camera-orbit="auto auto auto"
            max-camera-orbit="auto auto auto"
            interaction-prompt="none"
            shadow-intensity="1"
            ar
            disable-shadow
            ar-modes="webxr scene-viewer quick-look"
            style="width: 100%; height: 500px; background: #f5f5f5; border: 3px solid #43a3f6; border-radius: 8px;">
        </model-viewer>
    `;
    this.disabled = true;
    this.textContent = "Reconstructed";
});

document.getElementById('btnExtract').addEventListener('click', function() {
    const container = document.getElementById('containerExtract');
    container.classList.remove('empty');
    container.innerHTML = `
        <img src="resources/Benchmark/sample_291_custom_segment_100_400/sample_291_custom_segment_100_400_trajectory_plot.png" 
             alt="Trajectory Plot"
             style="width: 100%; height: auto; max-height: 400px;">
    `;
    this.disabled = true;
    this.textContent = "Extracted";
});

document.getElementById('btnEvaluate').addEventListener('click', function() {
    const container = document.getElementById('containerEvaluate');
    container.classList.remove('empty');
    container.innerHTML = `
        <div class="evaluation-score">
            Target Reached! <br>
            <span style="font-size: 0.8em; color: #666;">Trajectory Deviation: 0.42m</span>
        </div>
    `;
    this.disabled = true;
    this.textContent = "Evaluated";
});
