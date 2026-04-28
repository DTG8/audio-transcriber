import './style.css';

const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const uploadSection = document.querySelector('.upload-section');
const processingState = document.getElementById('processing-state');
const resultSection = document.getElementById('result-section');
const errorState = document.getElementById('error-state');

const resultContent = document.getElementById('result-content');
const copyBtn = document.getElementById('copy-btn');
const resetBtn = document.getElementById('reset-btn');
const retryBtn = document.getElementById('retry-btn');
const errorMessage = document.getElementById('error-message');

// Click to upload
dropZone.addEventListener('click', () => {
    fileInput.click();
});

// Drag and drop events
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, unhighlight, false);
});

function highlight(e) {
    dropZone.classList.add('drag-active');
}

function unhighlight(e) {
    dropZone.classList.remove('drag-active');
}

// Handle drop
dropZone.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files && files.length > 0) {
        handleFile(files[0]);
    }
}

// Handle traditional input selection
fileInput.addEventListener('change', function(e) {
    if (this.files && this.files.length > 0) {
        handleFile(this.files[0]);
    }
});

async function handleFile(file) {
    if (!file.type.startsWith('audio/')) {
        showError('Please upload a valid audio file (MP3, WAV, etc.)');
        return;
    }

    // Check size limit (e.g. 20MB)
    if (file.size > 20 * 1024 * 1024) {
        showError('File is too large. Maximum size is 20MB.');
        return;
    }

    // Switch UI state
    uploadSection.classList.add('hidden');
    errorState.classList.add('hidden');
    processingState.classList.remove('hidden');

    try {
        const formData = new FormData();
        formData.append('audio', file);

        const response = await fetch('http://localhost:3000/api/transcribe', {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Server responded with an error.');
        }

        displayResult(data.text);
    } catch (error) {
        console.error(error);
        showError(error.message || 'An unexpected error occurred during transcription.');
    }
}

function displayResult(text) {
    processingState.classList.add('hidden');
    resultContent.textContent = text;
    resultSection.classList.remove('hidden');
}

function showError(msg) {
    processingState.classList.add('hidden');
    uploadSection.classList.add('hidden');
    resultSection.classList.add('hidden');
    
    errorMessage.textContent = msg;
    errorState.classList.remove('hidden');
}

function resetUI() {
    fileInput.value = ''; // Clear input
    resultSection.classList.add('hidden');
    errorState.classList.add('hidden');
    processingState.classList.add('hidden');
    uploadSection.classList.remove('hidden');
}

// Interactions
resetBtn.addEventListener('click', resetUI);
retryBtn.addEventListener('click', resetUI);

copyBtn.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(resultContent.textContent);
        
        // Show temp visual feedback
        const originalHtml = copyBtn.innerHTML;
        copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied!`;
        copyBtn.style.color = '#22c55e';
        copyBtn.style.borderColor = '#22c55e';
        
        setTimeout(() => {
            copyBtn.innerHTML = originalHtml;
            copyBtn.style.color = '';
            copyBtn.style.borderColor = '';
        }, 2000);
    } catch(e) {
        console.error('Failed to copy text', e);
    }
});
