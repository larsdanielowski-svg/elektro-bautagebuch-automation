// Elektro Bautagebuch - Frontend JavaScript

document.addEventListener('DOMContentLoaded', function() {
  // DOM-Elemente
  const themeToggle = document.getElementById('themeToggle');
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  const fileInput = document.getElementById('fileInput');
  const dropArea = document.getElementById('dropArea');
  const uploadBtn = document.getElementById('uploadBtn');
  const resetBtn = document.getElementById('resetBtn');
  const projectSelect = document.getElementById('projectSelect');
  const newProjectForm = document.getElementById('newProjectForm');
  const createProjectBtn = document.getElementById('createProjectBtn');
  const uploadProgress = document.getElementById('uploadProgress');
  const progressFill = document.querySelector('.progress-fill');
  const progressText = document.querySelector('.progress-text');
  
  // State Management
  let selectedFiles = [];
  let projects = [];
  let journalEntries = [];

  // Initialisierung
  initApp();

  // Theme Toggle
  themeToggle.addEventListener('click', function() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    
    themeToggle.innerHTML = isDarkMode 
      ? '<i class="fas fa-sun"></i><span>Light Mode</span>'
      : '<i class="fas fa-moon"></i><span>Dark Mode</span>';
  });

  // Tab Navigation
  tabs.forEach(tab => {
    tab.addEventListener('click', function() {
      const tabId = this.dataset.tab;
      
      // Aktiven Tab aktualisieren
      tabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      
      // Tab Content anzeigen
      tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === tabId + 'Tab') {
          content.classList.add('active');
        }
      });
      
      // Tab-spezifische Aktionen
      if (tabId === 'bautagebuch') {
        loadJournalEntries();
      } else if (tabId === 'projekte') {
        loadProjects();
      } else if (tabId === 'statistik') {
        loadStatistics();
      }
    });
  });

  // Datei Upload Handling
  fileInput.addEventListener('change', handleFileSelect);
  
  // Drag & Drop
  dropArea.addEventListener('dragover', function(e) {
    e.preventDefault();
    this.style.borderColor = '#4361ee';
    this.style.backgroundColor = 'rgba(67, 97, 238, 0.05)';
  });
  
  dropArea.addEventListener('dragleave', function(e) {
    e.preventDefault();
    this.style.borderColor = '';
    this.style.backgroundColor = '';
  });
  
  dropArea.addEventListener('drop', function(e) {
    e.preventDefault();
    this.style.borderColor = '';
    this.style.backgroundColor = '';
    
    if (e.dataTransfer.files.length) {
      selectedFiles = Array.from(e.dataTransfer.files);
      updateUploadUI();
    }
  });
  
  // Klick auf Upload Area
  dropArea.addEventListener('click', function() {
    fileInput.click();
  });

  // Upload Button
  uploadBtn.addEventListener('click', async function() {
    if (selectedFiles.length === 0) return;
    
    const uploadFormData = new FormData();
    
    // Datei hinzufügen (nur erste Datei für jetzt)
    uploadFormData.append('image', selectedFiles[0]);
    
    // Zusätzliche Daten
    const projectId = projectSelect.value;
    const location = document.getElementById('location').value;
    const notes = document.getElementById('notes').value;
    
    uploadFormData.append('projekt', projectId);
    uploadFormData.append('standort', location);
    uploadFormData.append('bemerkungen', notes);
    
    // Upload starten
    uploadProgress.classList.remove('hidden');
    progressFill.style.width = '0%';
    progressText.textContent = 'Bild wird hochgeladen...';
    uploadBtn.disabled = true;
    
    try {
      // Simuliere Fortschritt
      simulateProgress();
      
      // API Request
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData
      });
      
      const result = await response.json();
      
      if (result.success) {
        progressFill.style.width = '100%';
        progressText.textContent = 'Analyse abgeschlossen!';
        
        // Erfolgsmeldung anzeigen
        showNotification('Bild erfolgreich analysiert!', 'success');
        
        // Automatisch zu Bautagebuch wechseln
        setTimeout(() => {
          document.querySelector('[data-tab="bautagebuch"]').click();
          loadJournalEntries();
          
          // Reset
          resetUploadForm();
        }, 1500);
        
      } else {
        throw new Error(result.error || 'Upload fehlgeschlagen');
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      progressText.textContent = 'Fehler bei der Analyse';
      showNotification(`Fehler: ${error.message}`, 'error');
      uploadBtn.disabled = false;
    }
  });

  // Reset Button
  resetBtn.addEventListener('click', resetUploadForm);

  // Projekt Handling
  projectSelect.addEventListener('change', function() {
    if (this.value === '') {
      newProjectForm.classList.remove('hidden');
    } else {
      newProjectForm.classList.add('hidden');
    }
  });

  // Neues Projekt erstellen
  createProjectBtn.addEventListener('click', async function() {
    const name = document.getElementById('projectName').value;
    const address = document.getElementById('projectAddress').value;
    const description = document.getElementById('projectDesc').value;
    
    if (!name) {
      showNotification('Projektname ist erforderlich', 'warning');
      return;
    }
    
    try {
      const response = await fetch('/api/projekte', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          adresse: address,
          beschreibung: description
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        showNotification('Projekt erstellt!', 'success');
        await loadProjects(); // Projekte neu laden
        resetProjectForm();
        newProjectForm.classList.add('hidden');
      } else {
        throw new Error(result.error);
      }
      
    } catch (error) {
      console.error('Project creation error:', error);
      showNotification(`Fehler: ${error.message}`, 'error');
    }
  });

  // Hilfsfunktionen
  function initApp() {
    loadProjects();
    loadJournalEntries();
    loadStatistics();
  }

  function handleFileSelect(e) {
    selectedFiles = Array.from(e.target.files);
    updateUploadUI();
  }

  function updateUploadUI() {
    if (selectedFiles.length > 0) {
      const fileNames = selectedFiles.map(file => file.name).join(', ');
      dropArea.innerHTML = `
        <i class="fas fa-check-circle fa-3x" style="color: #4ade80;"></i>
        <h3>${selectedFiles.length} Datei(en) ausgewählt</h3>
        <p>${fileNames}</p>
        <small>Klicken zum Ändern</small>
      `;
      uploadBtn.disabled = false;
    } else {
      dropArea.innerHTML = `
        <i class="fas fa-images fa-3x"></i>
        <h3>Dateien hierher ziehen oder klicken zum Auswählen</h3>
        <p>Unterstützte Formate: JPG, PNG, GIF (max. 10MB)</p>
      `;
      uploadBtn.disabled = true;
    }
  }

  function resetUploadForm() {
    selectedFiles = [];
    fileInput.value = '';
    updateUploadUI();
    document.getElementById('location').value = '';
    document.getElementById('notes').value = '';
    uploadProgress.classList.add('hidden');
    uploadBtn.disabled = true;
  }

  function resetProjectForm() {
    document.getElementById('projectName').value = '';
    document.getElementById('projectAddress').value = '';
    document.getElementById('projectDesc').value = '';
  }

  async function loadProjects() {
    try {
      const response = await fetch('/api/projekte');
      projects = await response.json();
      
      // Projekt-Select aktualisieren
      projectSelect.innerHTML = '<option value="">Neues Projekt erstellen...</option>';
      projects.forEach(project => {
        const option = document.createElement('option');
        option.value = project.id;
        option.textContent = project.name;
        projectSelect.appendChild(option);
      });
      
      // Projekt-Liste aktualisieren
      const projectsList = document.getElementById('projectsList');
      if (!projectsList) return;
      
      projectsList.innerHTML = '';
      
      if (projects.length === 0) {
        projectsList.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-project-diagram fa-3x"></i>
            <h3>Noch keine Projekte</h3>
            <p>Erstellen Sie Ihr erstes Projekt, um zu beginnen.</p>
          </div>
        `;
        return;
      }
      
      projects.forEach(project => {
        const projectCard = document.createElement('div');
        projectCard.className = 'project-card';
        
        const projectDate = new Date(project.erstelltAm).toLocaleDateString('de-DE');
        const startDate = project.startDatum ? new Date(project.startDatum).toLocaleDateString('de-DE') : 'nicht festgelegt';
        
        projectCard.innerHTML = `
          <div class="project-header">
            <div class="project-name">${project.name}</div>
            <div class="project-status status-active">Aktiv</div>
          </div>
          <div class="project-details">
            <p><strong>Adresse:</strong> ${project.adresse || 'nicht angegeben'}</p>
            <p><strong>Beschreibung:</strong> ${project.beschreibung || 'keine Beschreibung'}</p>
          </div>
          <div class="project-meta">
            <span>Erstellt: ${projectDate}</span>
            <span>Start: ${startDate}</span>
          </div>
        `;
        
        projectsList.appendChild(projectCard);
      });
      
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  }

  async function loadJournalEntries() {
    try {
      const response = await fetch('/api/eintraege');
      journalEntries = await response.json();
      
      const entriesContainer = document.getElementById('journalEntries');
      if (!entriesContainer) return;
      
      entriesContainer.innerHTML = '';
      
      if (journalEntries.length === 0) {
        entriesContainer.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-book-open fa-3x"></i>
            <h3>Noch keine Einträge</h3>
            <p>Laden Sie Ihr erstes Bild hoch, um das Bautagebuch zu starten.</p>
          </div>
        `;
        return;
      }
      
      // Filter anwenden
      const filterProject = document.getElementById('filterProject')?.value || '';
      const filterStatus = document.getElementById('filterStatus')?.value || '';
      
      let filteredEntries = journalEntries;
      
      if (filterProject) {
        filteredEntries = filteredEntries.filter(entry => entry.projekt === filterProject);
      }
      
      if (filterStatus) {
        filteredEntries = filteredEntries.filter(entry => entry.analyse.status === filterStatus);
      }
      
      // Einträge rendern
      filteredEntries.forEach(entry => {
        const entryDate = new Date(entry.hochgeladenAm).toLocaleDateString('de-DE', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        const entryElement = document.createElement('div');
        entryElement.className = 'journal-entry';
        entryElement.dataset.id = entry.id;
        
        // Status-Farbe
        let statusColor = '#4361ee';
        if (entry.analyse.status === 'fertig') statusColor = '#10b981';
        if (entry.analyse.status === 'begonnen') statusColor = '#f59e0b';
        
        entryElement.style.borderLeftColor = statusColor;
        
        // Erkannte Elemente als Tags
        const tagsHTML = entry.analyse.erkannteElemente?.map(element => 
          `<span class="tag"><i class="fas fa-bolt"></i> ${element}</span>`
        ).join('') || '';
        
        // Sicherheitsrisiken
        const risksHTML = entry.analyse.sicherheitsrisiken?.length > 0 
          ? `<p><strong><i class="fas fa-exclamation-triangle"></i> Sicherheitsrisiken:</strong> ${entry.analyse.sicherheitsrisiken.join(', ')}</p>`
          : '';
        
        // Empfehlungen
        const recommendationsHTML = entry.analyse.empfehlungen?.length > 0
          ? `<p><strong><i class="fas fa-lightbulb"></i> Empfehlungen:</strong> ${entry.analyse.empfehlungen.join(', ')}</p>`
          : '';
        
        // Nächste Schritte
        const nextStepsHTML = entry.analyse.naechsteSchritte?.length > 0
          ? `<p><strong><i class="fas fa-forward"></i> Nächste Schritte:</strong> ${entry.analyse.naechsteSchritte.join(', ')}</p>`
          : '';
        
        entryElement.innerHTML = `
          <div class="entry-header">
            <div class="entry-title">
              <i class="fas fa-image"></i>
              <h3>${entry.analyse.dateiname}</h3>
            </div>
            <div class="entry-meta">
              <span><i class="fas fa-calendar"></i> ${entryDate}</span>
              <span><i class="fas fa-map-marker-alt"></i> ${entry.standort}</span>
              <span><i class="fas fa-project-diagram"></i> ${entry.projekt}</span>
              <span><i class="fas fa-robot"></i> ${entry.verwendetesModel || 'AI Analyse'}</span>
            </div>
          </div>
          <div class="entry-content">
            <div class="entry-image">
              <img src="${entry.bildPfad}" alt="${entry.analyse.dateiname}" loading="lazy">
            </div>
            <div class="entry-analysis">
              <div class="analysis-tags">
                ${tagsHTML}
              </div>
              <div class="progress-display">
                <div class="progress-label">
                  <span>Fortschritt</span>
                  <span>${entry.analyse.fortschrittProzent}%</span>
                </div>
                <div class="progress-bar-small">
                  <div class="progress-fill-small" style="width: ${entry.analyse.fortschrittProzent}%"></div>
                </div>
              </div>
              <p class="entry-description">${entry.analyse.beschreibung}</p>
              ${risksHTML}
              ${recommendationsHTML}
              ${nextStepsHTML}
              <div class="entry-actions">
                <button class="delete-btn" data-id="${entry.id}">
                  <i class="fas fa-trash"></i> Löschen
                </button>
              </div>
            </div>
          </div>
        `;
        
        entriesContainer.appendChild(entryElement);
      });
      
      // Delete Event Listener hinzufügen
      document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
          const entryId = this.dataset.id;
          if (confirm('Möchten Sie diesen Eintrag wirklich löschen?')) {
            try {
              const response = await fetch(`/api/eintraege/${entryId}`, {
                method: 'DELETE'
              });
              
              const result = await response.json();
              
              if (result.success) {
                showNotification('Eintrag gelöscht', 'success');
                loadJournalEntries();
              } else {
                throw new Error(result.error);
              }
              
            } catch (error) {
              console.error('Delete error:', error);
              showNotification(`Fehler: ${error.message}`, 'error');
            }
          }
        });
      });
      
    } catch (error) {
      console.error('Error loading journal entries:', error);
    }
  }

  async function loadStatistics() {
    try {
      const response = await fetch('/api/statistik');
      const stats = await response.json();
      
      // Statistik aktualisieren
      document.getElementById('totalImages').textContent = stats.totalImages;
      document.getElementById('totalProjects').textContent = stats.totalProjects;
      document.getElementById('avgProgress').textContent = stats.avgProgress + '%';
      document.getElementById('lastWeek').textContent = stats.entriesLastWeek;
      
      // Filter-Projekte aktualisieren
      const filterProjectSelect = document.getElementById('filterProject');
      if (filterProjectSelect) {
        filterProjectSelect.innerHTML = '<option value="">Alle Projekte</option>';
        projects.forEach(project => {
          const option = document.createElement('option');
          option.value = project.name;
          option.textContent = project.name;
          filterProjectSelect.appendChild(option);
        });
      }
      
      // Filter Event Listener hinzufügen
      const filterElements = ['filterProject', 'filterStatus'];
      filterElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
          element.addEventListener('change', loadJournalEntries);
        }
      });
      
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  }

  function simulateProgress() {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 10;
      if (progress > 90) progress = 90;
      
      progressFill.style.width = progress + '%';
      progressText.textContent = `Analyse läuft... ${Math.round(progress)}%`;
      
      if (progress >= 90) {
        clearInterval(interval);
      }
    }, 200);
  }

  function showNotification(message, type = 'info') {
    // Entferne bestehende Notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Erstelle neue Notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
      <span>${message}</span>
    `;
    
    // Styles
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#4361ee'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Entferne nach 5 Sekunden
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }

  // CSS für Animationen hinzufügen
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
});