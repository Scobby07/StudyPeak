document.addEventListener('DOMContentLoaded', function() {
    // Admin tab switching
    const adminTabs = document.querySelectorAll('.admin-tab');
    const adminPanels = document.querySelectorAll('.admin-panel');
    
    adminTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            adminTabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Hide all panels
            adminPanels.forEach(panel => {
                panel.style.display = 'none';
            });
            
            // Show the selected panel
            const panelId = this.getAttribute('data-content') + '-panel';
            document.getElementById(panelId).style.display = 'block';
        });
    });
    
    // Load data for admin panels
    loadQuestionsData();
    loadTopicsData();
    loadResourcesData();
    loadTimeManagementData();
    
    // Questions Management
    const addQuestionBtn = document.getElementById('add-question');
    const questionForm = document.getElementById('question-form');
    const questionEditor = document.getElementById('question-editor');
    const cancelQuestionBtn = document.getElementById('cancel-question');
    
    if (addQuestionBtn) {
        addQuestionBtn.addEventListener('click', function() {
            // Reset form fields for a new question
            questionEditor.reset();
            document.getElementById('question-id').value = '';
            questionForm.style.display = 'block';
        });
    }
    
    if (cancelQuestionBtn) {
        cancelQuestionBtn.addEventListener('click', function() {
            questionForm.style.display = 'none';
        });
    }
    
    if (questionEditor) {
        questionEditor.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const questionId = document.getElementById('question-id').value;
            const isEditing = questionId !== '';
            
            const questionData = {
                year: document.getElementById('question-year').value,
                examType: document.getElementById('question-exam-type').value,
                difficulty: document.getElementById('question-difficulty').value,
                title: document.getElementById('question-title').value,
                preview: document.getElementById('question-preview').value,
                solution: document.getElementById('question-solution').value
            };
            
            if (isEditing) {
                questionData.id = questionId;
                updateQuestion(questionData);
            } else {
                saveNewQuestion(questionData);
            }
        });
    }
    
    // Topics Management
    const addTopicBtn = document.getElementById('add-topic');
    const topicForm = document.getElementById('topic-form');
    const topicEditor = document.getElementById('topic-editor');
    const cancelTopicBtn = document.getElementById('cancel-topic');
    const addConceptBtn = document.getElementById('add-concept');
    const conceptContainer = document.getElementById('concept-container');
    
    if (addTopicBtn) {
        addTopicBtn.addEventListener('click', function() {
            // Reset form fields for a new topic
            topicEditor.reset();
            document.getElementById('topic-id').value = '';
            
            // Start with one empty concept
            conceptContainer.innerHTML = `
                <div class="concept-item">
                    <input type="text" class="concept-name" placeholder="Concept Name" required>
                    <input type="text" class="concept-desc" placeholder="Description" required>
                    <button type="button" class="btn-remove-concept"><i class="fas fa-times"></i></button>
                </div>
            `;
            addConceptRemoveListeners();
            
            topicForm.style.display = 'block';
        });
    }
    
    if (cancelTopicBtn) {
        cancelTopicBtn.addEventListener('click', function() {
            topicForm.style.display = 'none';
        });
    }
    
    if (addConceptBtn) {
        addConceptBtn.addEventListener('click', function() {
            const newConcept = document.createElement('div');
            newConcept.className = 'concept-item';
            newConcept.innerHTML = `
                <input type="text" class="concept-name" placeholder="Concept Name" required>
                <input type="text" class="concept-desc" placeholder="Description" required>
                <button type="button" class="btn-remove-concept"><i class="fas fa-times"></i></button>
            `;
            conceptContainer.appendChild(newConcept);
            addConceptRemoveListeners();
        });
    }
    
    function addConceptRemoveListeners() {
        document.querySelectorAll('.btn-remove-concept').forEach(btn => {
            btn.addEventListener('click', function() {
                // Don't remove if it's the only concept item
                if (document.querySelectorAll('.concept-item').length > 1) {
                    this.closest('.concept-item').remove();
                }
            });
        });
    }
    
    if (topicEditor) {
        topicEditor.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const topicId = document.getElementById('topic-id').value;
            const isEditing = topicId !== '';
            
            // Gather concept data
            const concepts = [];
            document.querySelectorAll('.concept-item').forEach(item => {
                const name = item.querySelector('.concept-name').value;
                const description = item.querySelector('.concept-desc').value;
                if (name && description) {
                    concepts.push({ name, description });
                }
            });
            
            const topicData = {
                title: document.getElementById('topic-title').value,
                subject: document.getElementById('topic-subject').value,
                importanceLevel: document.getElementById('topic-importance').value,
                isAiRecommended: document.getElementById('topic-ai-recommended').checked,
                overview: document.getElementById('topic-overview').value,
                keyConcepts: concepts,
                examTips: document.getElementById('topic-exam-tips').value,
                relatedResources: [] // Would be handled in a more complex form
            };
            
            if (isEditing) {
                topicData.id = topicId;
                updateTopic(topicData);
            } else {
                saveNewTopic(topicData);
            }
        });
    }
    
    function addTopicActionListeners() {
        // Edit button listeners
        document.querySelectorAll('#topics-table .edit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const topicId = this.getAttribute('data-id');
                editTopic(topicId);
            });
        });
        
        // Delete button listeners
        document.querySelectorAll('#topics-table .delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const topicId = this.getAttribute('data-id');
                if (confirm('Are you sure you want to delete this topic?')) {
                    deleteTopic(topicId);
                }
            });
        });
    }
    
    function editTopic(id) {
        fetch(`/api/topics/${id}`)
            .then(response => response.json())
            .then(topic => {
                document.getElementById('topic-id').value = topic.id;
                document.getElementById('topic-title').value = topic.title;
                document.getElementById('topic-subject').value = topic.subject;
                document.getElementById('topic-importance').value = topic.importanceLevel;
                document.getElementById('topic-ai-recommended').checked = topic.isAiRecommended;
                document.getElementById('topic-overview').value = topic.overview;
                document.getElementById('topic-exam-tips').value = topic.examTips;
                
                // Load concepts
                conceptContainer.innerHTML = '';
                topic.keyConcepts.forEach(concept => {
                    const conceptItem = document.createElement('div');
                    conceptItem.className = 'concept-item';
                    conceptItem.innerHTML = `
                        <input type="text" class="concept-name" placeholder="Concept Name" required value="${concept.name}">
                        <input type="text" class="concept-desc" placeholder="Description" required value="${concept.description}">
                        <button type="button" class="btn-remove-concept"><i class="fas fa-times"></i></button>
                    `;
                    conceptContainer.appendChild(conceptItem);
                });
                addConceptRemoveListeners();
                
                topicForm.style.display = 'block';
            })
            .catch(error => {
                console.error('Error loading topic details:', error);
                alert('Error loading topic details. Please try again.');
            });
    }
    
    function saveNewTopic(topicData) {
        fetch('/api/topics', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(topicData)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to save topic');
                }
                return response.json();
            })
            .then(() => {
                alert('Topic saved successfully!');
                topicForm.style.display = 'none';
                loadTopicsData(); // Reload topics data
            })
            .catch(error => {
                console.error('Error saving topic:', error);
                alert('Error saving topic. Please try again.');
            });
    }
    
    function updateTopic(topicData) {
        fetch(`/api/topics/${topicData.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(topicData)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to update topic');
                }
                return response.json();
            })
            .then(() => {
                alert('Topic updated successfully!');
                topicForm.style.display = 'none';
                loadTopicsData(); // Reload topics data
            })
            .catch(error => {
                console.error('Error updating topic:', error);
                alert('Error updating topic. Please try again.');
            });
    }
    
    function deleteTopic(id) {
        fetch(`/api/topics/${id}`, {
            method: 'DELETE'
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to delete topic');
                }
                return response.json();
            })
            .then(() => {
                alert('Topic deleted successfully!');
                loadTopicsData(); // Reload topics data
            })
            .catch(error => {
                console.error('Error deleting topic:', error);
                alert('Error deleting topic. Please try again.');
            });
    }
    
    // Resources Management
    const addVideoBtn = document.getElementById('add-video');
    const videoForm = document.getElementById('video-form');
    const videoEditor = document.getElementById('video-editor');
    const cancelVideoBtn = document.getElementById('cancel-video');

    const addNoteBtn = document.getElementById('add-note');
    const noteForm = document.getElementById('note-form');
    const noteEditor = document.getElementById('note-editor');
    const cancelNoteBtn = document.getElementById('cancel-note');

    const addEbookBtn = document.getElementById('add-ebook');
    const ebookForm = document.getElementById('ebook-form');
    const ebookEditor = document.getElementById('ebook-editor');
    const cancelEbookBtn = document.getElementById('cancel-ebook');

    // Video resource handlers
    if (addVideoBtn) {
        addVideoBtn.addEventListener('click', function() {
            videoEditor.reset();
            document.getElementById('video-id').value = '';
            videoForm.style.display = 'block';
        });
    }

    if (cancelVideoBtn) {
        cancelVideoBtn.addEventListener('click', function() {
            videoForm.style.display = 'none';
        });
    }

    if (videoEditor) {
        videoEditor.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const videoId = document.getElementById('video-id').value;
            const isEditing = videoId !== '';
            
            const videoData = {
                type: 'video',
                title: document.getElementById('video-title').value,
                instructor: document.getElementById('video-instructor').value,
                thumbnail: document.getElementById('video-thumbnail').value,
                duration: document.getElementById('video-duration').value,
                url: document.getElementById('video-url').value
            };
            
            if (isEditing) {
                videoData.id = videoId;
                updateResource('video', videoData);
            } else {
                saveNewResource(videoData);
            }
        });
    }

    // Note resource handlers
    if (addNoteBtn) {
        addNoteBtn.addEventListener('click', function() {
            noteEditor.reset();
            document.getElementById('note-id').value = '';
            noteForm.style.display = 'block';
        });
    }

    if (cancelNoteBtn) {
        cancelNoteBtn.addEventListener('click', function() {
            noteForm.style.display = 'none';
        });
    }

    if (noteEditor) {
        noteEditor.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const noteId = document.getElementById('note-id').value;
            const isEditing = noteId !== '';
            
            const noteData = {
                type: 'note',
                title: document.getElementById('note-title').value,
                pages: parseInt(document.getElementById('note-pages').value),
                lastUpdated: document.getElementById('note-updated').value,
                description: document.getElementById('note-description').value,
                previewUrl: document.getElementById('note-preview-url').value,
                downloadUrl: document.getElementById('note-download-url').value
            };
            
            if (isEditing) {
                noteData.id = noteId;
                updateResource('note', noteData);
            } else {
                saveNewResource(noteData);
            }
        });
    }

    // E-Book resource handlers
    if (addEbookBtn) {
        addEbookBtn.addEventListener('click', function() {
            ebookEditor.reset();
            document.getElementById('ebook-id').value = '';
            ebookForm.style.display = 'block';
        });
    }

    if (cancelEbookBtn) {
        cancelEbookBtn.addEventListener('click', function() {
            ebookForm.style.display = 'none';
        });
    }

    if (ebookEditor) {
        ebookEditor.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const ebookId = document.getElementById('ebook-id').value;
            const isEditing = ebookId !== '';
            
            const ebookData = {
                type: 'ebook',
                title: document.getElementById('ebook-title').value,
                authors: document.getElementById('ebook-authors').value,
                cover: document.getElementById('ebook-cover').value,
                description: document.getElementById('ebook-description').value,
                readUrl: document.getElementById('ebook-read-url').value
            };
            
            if (isEditing) {
                ebookData.id = ebookId;
                updateResource('ebook', ebookData);
            } else {
                saveNewResource(ebookData);
            }
        });
    }

    // Resource CRUD functions
    function saveNewResource(resourceData) {
        fetch('/api/resources', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(resourceData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to save ${resourceData.type}`);
            }
            return response.json();
        })
        .then(() => {
            alert(`${resourceData.type.charAt(0).toUpperCase() + resourceData.type.slice(1)} saved successfully!`);
            
            // Hide the respective form
            if (resourceData.type === 'video') videoForm.style.display = 'none';
            else if (resourceData.type === 'note') noteForm.style.display = 'none';
            else if (resourceData.type === 'ebook') ebookForm.style.display = 'none';
            
            // Reload resources data
            loadResourcesData();
        })
        .catch(error => {
            console.error(`Error saving ${resourceData.type}:`, error);
            alert(`Error saving ${resourceData.type}. Please try again.`);
        });
    }

    function updateResource(type, resourceData) {
        fetch(`/api/resources/${type}/${resourceData.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(resourceData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to update ${type}`);
            }
            return response.json();
        })
        .then(() => {
            alert(`${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully!`);
            
            // Hide the respective form
            if (type === 'video') videoForm.style.display = 'none';
            else if (type === 'note') noteForm.style.display = 'none';
            else if (type === 'ebook') ebookForm.style.display = 'none';
            
            // Reload resources data
            loadResourcesData();
        })
        .catch(error => {
            console.error(`Error updating ${type}:`, error);
            alert(`Error updating ${type}. Please try again.`);
        });
    }

    function deleteResource(type, id) {
        fetch(`/api/resources/${type}/${id}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to delete ${type}`);
            }
            return response.json();
        })
        .then(() => {
            alert(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully!`);
            loadResourcesData();
        })
        .catch(error => {
            console.error(`Error deleting ${type}:`, error);
            alert(`Error deleting ${type}. Please try again.`);
        });
    }

    function editResource(type, id) {
        fetch('/api/resources')
        .then(response => response.json())
        .then(resources => {
            let resource;
            
            if (type === 'video') {
                resource = resources.videos.find(v => v.id === id);
                if (resource) {
                    document.getElementById('video-id').value = resource.id;
                    document.getElementById('video-title').value = resource.title;
                    document.getElementById('video-instructor').value = resource.instructor;
                    document.getElementById('video-thumbnail').value = resource.thumbnail;
                    document.getElementById('video-duration').value = resource.duration;
                    document.getElementById('video-url').value = resource.url;
                    videoForm.style.display = 'block';
                }
            } else if (type === 'note') {
                resource = resources.notes.find(n => n.id === id);
                if (resource) {
                    document.getElementById('note-id').value = resource.id;
                    document.getElementById('note-title').value = resource.title;
                    document.getElementById('note-pages').value = resource.pages;
                    document.getElementById('note-updated').value = resource.lastUpdated;
                    document.getElementById('note-description').value = resource.description;
                    document.getElementById('note-preview-url').value = resource.previewUrl;
                    document.getElementById('note-download-url').value = resource.downloadUrl;
                    noteForm.style.display = 'block';
                }
            } else if (type === 'ebook') {
                resource = resources.ebooks.find(e => e.id === id);
                if (resource) {
                    document.getElementById('ebook-id').value = resource.id;
                    document.getElementById('ebook-title').value = resource.title;
                    document.getElementById('ebook-authors').value = resource.authors;
                    document.getElementById('ebook-cover').value = resource.cover;
                    document.getElementById('ebook-description').value = resource.description;
                    document.getElementById('ebook-read-url').value = resource.readUrl;
                    ebookForm.style.display = 'block';
                }
            }
            
            if (!resource) {
                throw new Error(`${type} not found`);
            }
        })
        .catch(error => {
            console.error(`Error loading ${type} details:`, error);
            alert(`Error loading ${type} details. Please try again.`);
        });
    }

    // Update function to load all resource types
    function loadResourcesData() {
        // Load videos
        const videosTable = document.getElementById('videos-table');
        const videosLoading = document.getElementById('videos-loading');
        
        // Load notes
        const notesTable = document.getElementById('notes-table');
        const notesLoading = document.getElementById('notes-loading');
        
        // Load ebooks
        const ebooksTable = document.getElementById('ebooks-table');
        const ebooksLoading = document.getElementById('ebooks-loading');
        
        // Show loading indicators
        if (videosLoading) videosLoading.style.display = 'block';
        if (notesLoading) notesLoading.style.display = 'block';
        if (ebooksLoading) ebooksLoading.style.display = 'block';
        
        fetch('/api/resources')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(resources => {
                // Clear loading indicators
                if (videosLoading) videosLoading.style.display = 'none';
                if (notesLoading) notesLoading.style.display = 'none';
                if (ebooksLoading) ebooksLoading.style.display = 'none';
                
                // Process videos
                if (videosTable && resources.videos && Array.isArray(resources.videos)) {
                    const tbody = videosTable.querySelector('tbody');
                    tbody.innerHTML = '';
                    
                    resources.videos.forEach(video => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${video.title}</td>
                            <td>${video.instructor}</td>
                            <td>${video.duration}</td>
                            <td>
                                <button class="action-btn edit-btn" data-id="${video.id}" data-type="video"><i class="fas fa-edit"></i></button>
                                <button class="action-btn delete-btn" data-id="${video.id}" data-type="video"><i class="fas fa-trash-alt"></i></button>
                            </td>
                        `;
                        tbody.appendChild(row);
                    });
                    
                    // Add listeners for edit/delete buttons
                    addResourceActionListeners('video');
                }
                
                // Process notes
                if (notesTable && resources.notes && Array.isArray(resources.notes)) {
                    const tbody = notesTable.querySelector('tbody');
                    tbody.innerHTML = '';
                    
                    resources.notes.forEach(note => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${note.title}</td>
                            <td>${note.pages}</td>
                            <td>${note.lastUpdated}</td>
                            <td>
                                <button class="action-btn edit-btn" data-id="${note.id}" data-type="note"><i class="fas fa-edit"></i></button>
                                <button class="action-btn delete-btn" data-id="${note.id}" data-type="note"><i class="fas fa-trash-alt"></i></button>
                            </td>
                        `;
                        tbody.appendChild(row);
                    });
                    
                    // Add listeners for edit/delete buttons
                    addResourceActionListeners('note');
                }
                
                // Process ebooks
                if (ebooksTable && resources.ebooks && Array.isArray(resources.ebooks)) {
                    const tbody = ebooksTable.querySelector('tbody');
                    tbody.innerHTML = '';
                    
                    resources.ebooks.forEach(ebook => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${ebook.title}</td>
                            <td>${ebook.authors}</td>
                            <td>
                                <button class="action-btn edit-btn" data-id="${ebook.id}" data-type="ebook"><i class="fas fa-edit"></i></button>
                                <button class="action-btn delete-btn" data-id="${ebook.id}" data-type="ebook"><i class="fas fa-trash-alt"></i></button>
                            </td>
                        `;
                        tbody.appendChild(row);
                    });
                    
                    // Add listeners for edit/delete buttons
                    addResourceActionListeners('ebook');
                }
            })
            .catch(error => {
                console.error('Error loading resources:', error);
                if (videosLoading) videosLoading.textContent = 'Error loading resources. Please try again.';
                if (notesLoading) notesLoading.textContent = 'Error loading resources. Please try again.';
                if (ebooksLoading) ebooksLoading.textContent = 'Error loading resources. Please try again.';
            });
    }

    function addResourceActionListeners(type) {
        const tableId = `${type}s-table`; // videos-table, notes-table, ebooks-table
        
        // Edit button listeners
        document.querySelectorAll(`#${tableId} .edit-btn`).forEach(btn => {
            btn.addEventListener('click', function() {
                const resourceId = this.getAttribute('data-id');
                const resourceType = this.getAttribute('data-type');
                editResource(resourceType, resourceId);
            });
        });
        
        // Delete button listeners
        document.querySelectorAll(`#${tableId} .delete-btn`).forEach(btn => {
            btn.addEventListener('click', function() {
                const resourceId = this.getAttribute('data-id');
                const resourceType = this.getAttribute('data-type');
                if (confirm(`Are you sure you want to delete this ${resourceType}?`)) {
                    deleteResource(resourceType, resourceId);
                }
            });
        });
    }

    // Time Management Data Management
    const saveTimeDataBtn = document.getElementById('save-time-data');
    const addStatBtn = document.getElementById('add-stat');
    const statsEditor = document.getElementById('stats-editor');
    const addTimeItemBtn = document.getElementById('add-time-item');
    const timeAllocationEditor = document.getElementById('time-allocation-editor');
    
    if (addStatBtn) {
        addStatBtn.addEventListener('click', function() {
            const newStat = document.createElement('div');
            newStat.className = 'stat-item-editor';
            newStat.innerHTML = `
                <input type="text" class="stat-value" placeholder="Value (e.g. 83%)">
                <input type="text" class="stat-desc" placeholder="Description">
                <button class="remove-stat"><i class="fas fa-times"></i></button>
            `;
            statsEditor.appendChild(newStat);
            addStatRemoveListeners();
        });
    }
    
    function addStatRemoveListeners() {
        document.querySelectorAll('.remove-stat').forEach(btn => {
            btn.addEventListener('click', function() {
                // Don't remove if it's the only stat item
                if (document.querySelectorAll('.stat-item-editor').length > 1) {
                    this.closest('.stat-item-editor').remove();
                }
            });
        });
    }
    
    if (addTimeItemBtn) {
        addTimeItemBtn.addEventListener('click', function() {
            const newTimeItem = document.createElement('div');
            newTimeItem.className = 'time-item-editor';
            newTimeItem.innerHTML = `
                <input type="text" class="subject-name" placeholder="Subject">
                <select class="color-class">
                    <option value="ai-blue">Blue (AI)</option>
                    <option value="db-green">Green (Database)</option>
                    <option value="algo-purple">Purple (Algorithms)</option>
                    <option value="design-orange">Orange (Design)</option>
                    <option value="network-teal">Teal (Network)</option>
                    <option value="security-red">Red (Security)</option>
                </select>
                <input type="number" class="hours" placeholder="Hours" min="1">
                <select class="priority">
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                </select>
                <button class="remove-time-item"><i class="fas fa-times"></i></button>
            `;
            timeAllocationEditor.appendChild(newTimeItem);
            addTimeItemRemoveListeners();
        });
    }
    
    function addTimeItemRemoveListeners() {
        document.querySelectorAll('.remove-time-item').forEach(btn => {
            btn.addEventListener('click', function() {
                // Don't remove if it's the only time item
                if (document.querySelectorAll('.time-item-editor').length > 1) {
                    this.closest('.time-item-editor').remove();
                }
            });
        });
    }
    
    if (saveTimeDataBtn) {
        saveTimeDataBtn.addEventListener('click', function() {
            // Gather stats data
            const stats = [];
            document.querySelectorAll('.stat-item-editor').forEach(item => {
                const value = item.querySelector('.stat-value').value;
                const description = item.querySelector('.stat-desc').value;
                if (value && description) {
                    stats.push({ value, description });
                }
            });
            
            // Gather time allocation data
            const timeAllocation = [];
            document.querySelectorAll('.time-item-editor').forEach((item, index) => {
                const subject = item.querySelector('.subject-name').value;
                const colorClass = item.querySelector('.color-class').value;
                const hours = parseInt(item.querySelector('.hours').value);
                const priority = item.querySelector('.priority').value;
                
                if (subject && hours) {
                    timeAllocation.push({
                        id: (index + 1).toString(),
                        subject,
                        colorClass,
                        hours,
                        priority,
                        chartPercentage: 0 // Will be calculated on the server
                    });
                }
            });
            
            const timeData = {
                stats,
                timeAllocation
            };
            
            saveTimeManagementData(timeData);
        });
    }
    
    // Data loading functions
    function loadQuestionsData() {
        const questionsTable = document.getElementById('questions-table');
        const questionsLoading = document.getElementById('questions-loading');
        const noQuestions = document.getElementById('no-questions');
        
        if (questionsTable && questionsLoading) {
            fetch('/api/questions')
                .then(response => response.json())
                .then(questions => {
                    questionsLoading.style.display = 'none';
                    
                    if (questions.length === 0) {
                        if (noQuestions) noQuestions.style.display = 'block';
                        return;
                    }
                    
                    const tbody = questionsTable.querySelector('tbody');
                    tbody.innerHTML = '';
                    
                    questions.forEach(question => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${question.year}</td>
                            <td>${question.examType}</td>
                            <td>
                                <span class="difficulty ${question.difficulty}">${question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}</span>
                            </td>
                            <td>${question.title.substring(0, 50)}${question.title.length > 50 ? '...' : ''}</td>
                            <td>
                                <button class="action-btn edit-btn" data-id="${question.id}"><i class="fas fa-edit"></i></button>
                                <button class="action-btn delete-btn" data-id="${question.id}"><i class="fas fa-trash-alt"></i></button>
                            </td>
                        `;
                        tbody.appendChild(row);
                    });
                    
                    // Add event listeners for edit/delete buttons
                    addQuestionActionListeners();
                })
                .catch(error => {
                    console.error('Error loading questions:', error);
                    questionsLoading.textContent = 'Error loading questions. Please try again.';
                });
        }
    }
    
    function addQuestionActionListeners() {
        // Edit button listeners
        document.querySelectorAll('#questions-table .edit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const questionId = this.getAttribute('data-id');
                editQuestion(questionId);
            });
        });
        
        // Delete button listeners
        document.querySelectorAll('#questions-table .delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const questionId = this.getAttribute('data-id');
                if (confirm('Are you sure you want to delete this question?')) {
                    deleteQuestion(questionId);
                }
            });
        });
    }
    
    function editQuestion(id) {
        fetch(`/api/questions/${id}`)
            .then(response => response.json())
            .then(question => {
                document.getElementById('question-id').value = question.id;
                document.getElementById('question-year').value = question.year;
                document.getElementById('question-exam-type').value = question.examType;
                document.getElementById('question-difficulty').value = question.difficulty;
                document.getElementById('question-title').value = question.title;
                document.getElementById('question-preview').value = question.preview;
                document.getElementById('question-solution').value = question.solution;
                
                questionForm.style.display = 'block';
            })
            .catch(error => {
                console.error('Error loading question details:', error);
                alert('Error loading question details. Please try again.');
            });
    }
    
    function saveNewQuestion(questionData) {
        fetch('/api/questions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(questionData)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to save question');
                }
                return response.json();
            })
            .then(() => {
                alert('Question saved successfully!');
                questionForm.style.display = 'none';
                loadQuestionsData(); // Reload questions data
            })
            .catch(error => {
                console.error('Error saving question:', error);
                alert('Error saving question. Please try again.');
            });
    }
    
    function updateQuestion(questionData) {
        fetch(`/api/questions/${questionData.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(questionData)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to update question');
                }
                return response.json();
            })
            .then(() => {
                alert('Question updated successfully!');
                questionForm.style.display = 'none';
                loadQuestionsData(); // Reload questions data
            })
            .catch(error => {
                console.error('Error updating question:', error);
                alert('Error updating question. Please try again.');
            });
    }
    
    function deleteQuestion(id) {
        fetch(`/api/questions/${id}`, {
            method: 'DELETE'
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to delete question');
                }
                return response.json();
            })
            .then(() => {
                alert('Question deleted successfully!');
                loadQuestionsData(); // Reload questions data
            })
            .catch(error => {
                console.error('Error deleting question:', error);
                alert('Error deleting question. Please try again.');
            });
    }
    
    function loadTopicsData() {
        const topicsTable = document.getElementById('topics-table');
        const topicsLoading = document.getElementById('topics-loading');
        const noTopics = document.getElementById('no-topics');
        
        if (topicsTable && topicsLoading) {
            fetch('/api/topics')
                .then(response => response.json())
                .then(topics => {
                    topicsLoading.style.display = 'none';
                    
                    if (topics.length === 0) {
                        if (noTopics) noTopics.style.display = 'block';
                        return;
                    }
                    
                    const tbody = topicsTable.querySelector('tbody');
                    tbody.innerHTML = '';
                    
                    topics.forEach(topic => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${topic.title}</td>
                            <td>${topic.subject}</td>
                            <td>${topic.importanceLevel.charAt(0).toUpperCase() + topic.importanceLevel.slice(1)}</td>
                            <td>${topic.isAiRecommended ? 'Yes' : 'No'}</td>
                            <td>
                                <button class="action-btn edit-btn" data-id="${topic.id}"><i class="fas fa-edit"></i></button>
                                <button class="action-btn delete-btn" data-id="${topic.id}"><i class="fas fa-trash-alt"></i></button>
                            </td>
                        `;
                        tbody.appendChild(row);
                    });
                    
                    // Add event listeners for edit/delete buttons
                    addTopicActionListeners();
                })
                .catch(error => {
                    console.error('Error loading topics:', error);
                    topicsLoading.textContent = 'Error loading topics. Please try again.';
                });
        }
    }
    
    function loadTimeManagementData() {
        fetch('/api/timemanagement')
            .then(response => response.json())
            .then(data => {
                // Load stats
                if (data.stats && statsEditor) {
                    statsEditor.innerHTML = '';
                    data.stats.forEach(stat => {
                        const statItem = document.createElement('div');
                        statItem.className = 'stat-item-editor';
                        statItem.innerHTML = `
                            <input type="text" class="stat-value" placeholder="Value (e.g. 83%)" value="${stat.value}">
                            <input type="text" class="stat-desc" placeholder="Description" value="${stat.description}">
                            <button class="remove-stat"><i class="fas fa-times"></i></button>
                        `;
                        statsEditor.appendChild(statItem);
                    });
                    addStatRemoveListeners();
                }
                
                // Load time allocation
                if (data.timeAllocation && timeAllocationEditor) {
                    timeAllocationEditor.innerHTML = '';
                    data.timeAllocation.forEach(item => {
                        const timeItem = document.createElement('div');
                        timeItem.className = 'time-item-editor';
                        timeItem.innerHTML = `
                            <input type="text" class="subject-name" placeholder="Subject" value="${item.subject}">
                            <select class="color-class">
                                <option value="ai-blue" ${item.colorClass === 'ai-blue' ? 'selected' : ''}>Blue (AI)</option>
                                <option value="db-green" ${item.colorClass === 'db-green' ? 'selected' : ''}>Green (Database)</option>
                                <option value="algo-purple" ${item.colorClass === 'algo-purple' ? 'selected' : ''}>Purple (Algorithms)</option>
                                <option value="design-orange" ${item.colorClass === 'design-orange' ? 'selected' : ''}>Orange (Design)</option>
                                <option value="network-teal" ${item.colorClass === 'network-teal' ? 'selected' : ''}>Teal (Network)</option>
                                <option value="security-red" ${item.colorClass === 'security-red' ? 'selected' : ''}>Red (Security)</option>
                            </select>
                            <input type="number" class="hours" placeholder="Hours" min="1" value="${item.hours}">
                            <select class="priority">
                                <option value="High" ${item.priority === 'High' ? 'selected' : ''}>High</option>
                                <option value="Medium" ${item.priority === 'Medium' ? 'selected' : ''}>Medium</option>
                                <option value="Low" ${item.priority === 'Low' ? 'selected' : ''}>Low</option>
                            </select>
                            <button class="remove-time-item"><i class="fas fa-times"></i></button>
                        `;
                        timeAllocationEditor.appendChild(timeItem);
                    });
                    addTimeItemRemoveListeners();
                }
            })
            .catch(error => {
                console.error('Error loading time management data:', error);
                alert('Error loading time management data. Please try again.');
            });
    }
    
    function saveTimeManagementData(timeData) {
        fetch('/api/timemanagement', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(timeData)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to save time management data');
                }
                return response.json();
            })
            .then(() => {
                alert('Time management data saved successfully!');
            })
            .catch(error => {
                console.error('Error saving time management data:', error);
                alert('Error saving time management data. Please try again.');
            });
    }

    // Initialize event listeners for remove buttons
    addStatRemoveListeners();
    addTimeItemRemoveListeners();
    addConceptRemoveListeners();
});
