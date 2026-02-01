// ========================================
// BetterPhone Survey - JavaScript
// ========================================

// State
let currentStep = 'intro';
const stepOrder = ['intro', 'pain-check', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'email', 'thank-you'];
const totalMainSteps = 10; // Steps 1-10

// ========================================
// Navigation
// ========================================

function getStepElement(stepId) {
  return document.querySelector(`.step[data-step="${stepId}"]`);
}

function showStep(stepId) {
  // Hide all steps
  document.querySelectorAll('.step').forEach(step => {
    step.classList.remove('active');
  });
  
  // Show target step
  const targetStep = getStepElement(stepId);
  if (targetStep) {
    targetStep.classList.add('active');
    currentStep = stepId;
    updateProgress();
  }
}

function nextStep() {
  const currentIndex = stepOrder.indexOf(currentStep);
  if (currentIndex < stepOrder.length - 1) {
    showStep(stepOrder[currentIndex + 1]);
  }
}

function prevStep() {
  const currentIndex = stepOrder.indexOf(currentStep);
  if (currentIndex > 0) {
    // Skip thank-you-email-only when going back
    let prevIndex = currentIndex - 1;
    if (stepOrder[prevIndex] === 'thank-you-email-only') {
      prevIndex--;
    }
    showStep(stepOrder[prevIndex]);
  }
}

// ========================================
// Progress Bar
// ========================================

function updateProgress() {
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');
  
  let progress = 0;
  let text = '';
  
  if (currentStep === 'intro') {
    progress = 0;
    text = 'Getting started...';
  } else if (currentStep === 'pain-check') {
    progress = 5;
    text = 'Quick check';
  } else if (currentStep === 'thank-you-email-only') {
    progress = 100;
    text = 'Complete';
  } else if (currentStep === 'email') {
    progress = 95;
    text = 'Almost done!';
  } else if (currentStep === 'thank-you') {
    progress = 100;
    text = 'Complete!';
  } else {
    const stepNum = parseInt(currentStep);
    if (!isNaN(stepNum)) {
      progress = 10 + (stepNum / totalMainSteps) * 85;
      text = `Step ${stepNum} of ${totalMainSteps}`;
    }
  }
  
  progressFill.style.width = `${progress}%`;
  progressText.textContent = text;
}

// ========================================
// Pain Check Logic
// ========================================

function handlePainCheck() {
  const selected = document.querySelector('input[name="painCheck"]:checked');
  if (!selected) return;
  
  if (selected.value === 'no') {
    // Skip to thank you + email only
    showStep('thank-you-email-only');
  } else {
    // Continue with full survey
    nextStep();
  }
}

// Enable/disable pain check continue button
document.querySelectorAll('input[name="painCheck"]').forEach(input => {
  input.addEventListener('change', () => {
    document.getElementById('painCheckNext').disabled = false;
  });
});

// ========================================
// Step 3: Dynamic Ranking
// ========================================

function goToRanking() {
  // Get checked issues
  const checkedIssues = [];
  document.querySelectorAll('input[name="issues"]:checked').forEach(checkbox => {
    checkedIssues.push(checkbox.value);
  });
  
  // Add "Other" if filled in
  const otherInput = document.getElementById('issueOther');
  if (otherInput.value.trim()) {
    checkedIssues.push(otherInput.value.trim());
  }
  
  // Populate ranking list
  const rankingList = document.getElementById('rankingList');
  rankingList.innerHTML = '';
  
  if (checkedIssues.length === 0) {
    rankingList.innerHTML = '<p class="helper-text">No issues selected. Go back to select at least one issue to rank.</p>';
  } else {
    checkedIssues.forEach((issue, index) => {
      const item = document.createElement('div');
      item.className = 'ranking-item';
      item.draggable = true;
      item.dataset.issue = issue;
      item.innerHTML = `
        <span class="ranking-number">${index + 1}</span>
        <span class="ranking-handle">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </span>
        <span class="ranking-text">${issue}</span>
      `;
      rankingList.appendChild(item);
    });
    
    // Initialize drag and drop
    initDragAndDrop();
  }
  
  nextStep();
}

function initDragAndDrop() {
  const rankingList = document.getElementById('rankingList');
  const items = rankingList.querySelectorAll('.ranking-item');
  
  let draggedItem = null;
  
  items.forEach(item => {
    item.addEventListener('dragstart', (e) => {
      draggedItem = item;
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    
    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      draggedItem = null;
      updateRankingNumbers();
    });
    
    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });
    
    item.addEventListener('drop', (e) => {
      e.preventDefault();
      if (draggedItem && draggedItem !== item) {
        const allItems = [...rankingList.querySelectorAll('.ranking-item')];
        const draggedIndex = allItems.indexOf(draggedItem);
        const targetIndex = allItems.indexOf(item);
        
        if (draggedIndex < targetIndex) {
          item.parentNode.insertBefore(draggedItem, item.nextSibling);
        } else {
          item.parentNode.insertBefore(draggedItem, item);
        }
      }
    });
  });
}

function updateRankingNumbers() {
  const items = document.querySelectorAll('.ranking-item');
  items.forEach((item, index) => {
    item.querySelector('.ranking-number').textContent = index + 1;
  });
}

// ========================================
// Step 7: Benefits Selection Counter
// ========================================

function updateBenefitCounter() {
  const checked = document.querySelectorAll('input[name="benefits"]:checked').length;
  const counter = document.getElementById('benefitCounter');
  
  counter.textContent = `${checked} of 3-5 selected`;
  counter.classList.remove('warning', 'error');
  
  if (checked < 3) {
    counter.classList.add('warning');
  } else if (checked > 5) {
    counter.classList.add('error');
  }
}

document.querySelectorAll('input[name="benefits"]').forEach(input => {
  input.addEventListener('change', updateBenefitCounter);
});

// ========================================
// Email Opt-in Toggle
// ========================================

document.getElementById('emailOptIn').addEventListener('change', function() {
  document.getElementById('emailInputGroup').style.display = this.checked ? 'block' : 'none';
});

document.getElementById('emailOptInOnly').addEventListener('change', function() {
  document.getElementById('emailInputGroupOnly').style.display = this.checked ? 'block' : 'none';
});

// ========================================
// Form Submission
// ========================================

function collectFormData() {
  const formData = {};
  
  // Pain check
  const painCheck = document.querySelector('input[name="painCheck"]:checked');
  formData.painCheck = painCheck ? painCheck.value : null;
  
  // Issues (Step 2)
  formData.issues = [];
  document.querySelectorAll('input[name="issues"]:checked').forEach(cb => {
    formData.issues.push(cb.value);
  });
  const otherIssue = document.getElementById('issueOther').value;
  if (otherIssue) formData.issues.push(otherIssue);
  
  // Ranking (Step 3)
  formData.ranking = [];
  document.querySelectorAll('.ranking-item').forEach(item => {
    formData.ranking.push(item.dataset.issue);
  });
  
  // Benefits (Step 7)
  formData.benefits = [];
  document.querySelectorAll('input[name="benefits"]:checked').forEach(cb => {
    formData.benefits.push(cb.value);
  });
  
  // Text inputs
  formData.clickMotivation = document.getElementById('clickMotivation').value;
  formData.clickResistance = document.getElementById('clickResistance').value;
  formData.anythingElse = document.getElementById('anythingElse').value;
  
  // Demographics
  formData.kidAges = document.getElementById('kidAges').value;
  formData.kidsWithPhones = document.getElementById('kidsWithPhones').value;
  formData.currentDevice = document.getElementById('currentDevice').value;
  formData.deviceDuration = document.getElementById('deviceDuration').value;
  formData.dailyUsage = document.getElementById('dailyUsage').value;
  formData.familyStructure = document.getElementById('familyStructure').value;
  formData.householdIncome = document.getElementById('householdIncome').value;
  
  // Email
  formData.emailOptIn = document.getElementById('emailOptIn').checked;
  formData.email = document.getElementById('email').value;
  
  return formData;
}

function submitSurvey() {
  const formData = collectFormData();
  
  // Log to console for now (would send to server in production)
  console.log('Survey submitted:', formData);
  
  // Show thank you
  showStep('thank-you');
}

function submitEmailOnly() {
  const email = document.getElementById('emailOnly').value;
  const optIn = document.getElementById('emailOptInOnly').checked;
  
  console.log('Email only submission:', { email, optIn });
  
  // Show final thank you message
  alert('Thank you! We\'ll keep you updated.');
}

// ========================================
// Initialize
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  showStep('intro');
});
