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
