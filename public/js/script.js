document.addEventListener('DOMContentLoaded', function() {
    // Mobile navigation menu toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            navLinks.classList.toggle('show');
            
            // Animate hamburger to X
            const spans = this.querySelectorAll('span');
            if (navLinks.classList.contains('show')) {
                spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });
    }

    // Load page-specific content
    const currentPage = window.location.pathname;
    
    if (currentPage.includes('questions.html')) {
        loadQuestions();
        
        // Set up filter event listener
        const applyFilter = document.getElementById('apply-filter');
        if (applyFilter) {
            applyFilter.addEventListener('click', function() {
                const yearFilter = document.getElementById('year-filter').value;
                const examFilter = document.getElementById('exam-filter').value;
                const difficultyFilter = document.getElementById('difficulty-filter').value;
                
                loadQuestions(yearFilter, examFilter, difficultyFilter);
            });
        }
    }
    
    if (currentPage.includes('topics.html')) {
        loadTopics();
        
        // Set up filter event listener
        const applyTopicFilter = document.getElementById('apply-topic-filter');
        if (applyTopicFilter) {
            applyTopicFilter.addEventListener('click', function() {
                const subjectFilter = document.getElementById('subject-filter').value;
                const priorityFilter = document.getElementById('priority-filter').value;
                
                loadTopics(subjectFilter, priorityFilter);
            });
        }
        
        // Set up search functionality
        const topicSearch = document.getElementById('topic-search');
        const searchBtn = document.querySelector('.search-btn');
        if (searchBtn && topicSearch) {
            searchBtn.addEventListener('click', function() {
                const searchTerm = topicSearch.value.trim();
                if (searchTerm) {
                    loadTopics(null, null, searchTerm);
                }
            });
            
            topicSearch.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    searchBtn.click();
                }
            });
        }
    }
    
    if (currentPage.includes('resources.html')) {
        loadResources();
    }
    
    if (currentPage.includes('timemanagement.html')) {
        loadTimeManagementData();
    }

    // Resource tab switching
    const resourceTabs = document.querySelectorAll('.resource-tab');
    
    if (resourceTabs.length > 0) {
        resourceTabs.forEach(tab => {
            tab.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Remove active class from all tabs
                resourceTabs.forEach(t => t.classList.remove('active'));
                
                // Add active class to clicked tab
                this.classList.add('active');
                
                // Get the target section id from href
                const targetId = this.getAttribute('href');
                
                // Hide all resource sections
                document.querySelectorAll('.resource-section').forEach(section => {
                    section.style.display = 'none';
                });
                
                // Show the target section
                document.querySelector(targetId).style.display = 'block';
            });
        });
    }

    // Show/hide solutions in questions page
    const solutionButtons = document.querySelectorAll('.show-solution');
    
    if (solutionButtons.length > 0) {
        solutionButtons.forEach(button => {
            button.addEventListener('click', function() {
                const card = this.closest('.question-card');
                const solution = card.querySelector('.solution');
                
                if (solution.style.display === 'none' || solution.style.display === '') {
                    solution.style.display = 'block';
                    this.textContent = 'Hide Solution';
                } else {
                    solution.style.display = 'none';
                    this.textContent = 'Show Solution';
                }
            });
        });
    }

    // Study plan tab switching
    const planTabs = document.querySelectorAll('.plan-tab');
    
    if (planTabs.length > 0) {
        planTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                // Remove active class from all tabs
                planTabs.forEach(t => t.classList.remove('active'));
                
                // Add active class to clicked tab
                this.classList.add('active');
                
                // Get the plan id
                const planId = this.getAttribute('data-plan');
                
                // Hide all plan contents
                document.querySelectorAll('.plan-content').forEach(content => {
                    content.style.display = 'none';
                });
                
                // Show the selected plan content
                document.getElementById(planId + '-plan').style.display = 'block';
            });
        });
    }

    // Function to load questions
    function loadQuestions(yearFilter = 'all', examFilter = 'all', difficultyFilter = 'all') {
        fetch('/api/questions')
            .then(response => response.json())
            .then(questions => {
                // Filter questions based on criteria
                const filteredQuestions = questions.filter(question => {
                    return (yearFilter === 'all' || question.year === yearFilter) && 
                           (examFilter === 'all' || question.examType.toLowerCase() === examFilter.toLowerCase()) &&
                           (difficultyFilter === 'all' || question.difficulty === difficultyFilter);
                });
                
                // Render questions
                const questionGrid = document.querySelector('.question-grid');
                if (questionGrid) {
                    questionGrid.innerHTML = '';
                    
                    if (filteredQuestions.length === 0) {
                        questionGrid.innerHTML = '<p class="no-results">No questions match your filters. Try different criteria.</p>';
                    } else {
                        filteredQuestions.forEach(question => {
                            const questionCard = `
                                <div class="question-card">
                                    <div class="question-meta">
                                        <span>${question.year} • ${question.examType} Exam</span>
                                        <span class="difficulty ${question.difficulty}">${question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}</span>
                                    </div>
                                    <h4 class="question-title">${question.title}</h4>
                                    <p class="question-preview">${question.preview}</p>
                                    <div class="solution" style="display: none;">
                                        ${question.solution}
                                    </div>
                                    <div class="question-actions">
                                        <button class="question-button show-solution">Show Solution</button>
                                        <button class="question-button">Similar Questions</button>
                                    </div>
                                </div>
                            `;
                            
                            questionGrid.innerHTML += questionCard;
                        });
                        
                        // Add solution button event listeners
                        addSolutionButtonListeners();
                    }
                }
            })
            .catch(error => {
                console.error('Error loading questions:', error);
                const questionGrid = document.querySelector('.question-grid');
                if (questionGrid) {
                    questionGrid.innerHTML = '<p class="error-message">Failed to load questions. Please try again later.</p>';
                }
            });
    }

    // Function to load topics
    function loadTopics(subjectFilter = 'all', priorityFilter = 'all', searchTerm = '') {
        fetch('/api/topics')
            .then(response => response.json())
            .then(topics => {
                // Filter topics based on criteria
                const filteredTopics = topics.filter(topic => {
                    const matchesSubject = subjectFilter === 'all' || topic.subject === subjectFilter;
                    const matchesPriority = priorityFilter === 'all' || topic.importanceLevel === priorityFilter;
                    const matchesSearch = !searchTerm || 
                                         topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                         topic.overview.toLowerCase().includes(searchTerm.toLowerCase());
                    
                    return matchesSubject && matchesPriority && matchesSearch;
                });
                
                // Render topics
                const topicsGrid = document.querySelector('.topics-grid');
                if (topicsGrid) {
                    topicsGrid.innerHTML = '';
                    
                    if (filteredTopics.length === 0) {
                        topicsGrid.innerHTML = '<p class="no-results">No topics match your criteria. Try different filters.</p>';
                    } else {
                        filteredTopics.forEach(topic => {
                            // Build key concepts HTML
                            let conceptsHTML = '<ul>';
                            topic.keyConcepts.forEach(concept => {
                                conceptsHTML += `<li><strong>${concept.name}:</strong> ${concept.description}</li>`;
                            });
                            conceptsHTML += '</ul>';
                            
                            // Build related resources HTML
                            let resourcesHTML = '<div class="resource-links">';
                            topic.relatedResources.forEach(resource => {
                                let icon = '';
                                switch(resource.type) {
                                    case 'video': icon = 'video'; break;
                                    case 'question': icon = 'question-circle'; break;
                                    case 'note': icon = 'sticky-note'; break;
                                    case 'ebook': icon = 'book'; break;
                                    default: icon = 'link';
                                }
                                
                                resourcesHTML += `
                                    <a href="${resource.link}" class="resource-link" target="_blank" rel="noopener noreferrer">
                                        <i class="fas fa-${icon}"></i>
                                        <span>${resource.title}</span>
                                    </a>
                                `;
                            });
                            resourcesHTML += '</div>';
                            
                            // Build topic card
                            const topicCard = `
                                <div class="topic-guide">
                                    <h2 class="topic-title">${topic.title}</h2>
                                    <div class="topic-importance">
                                        ${topic.isAiRecommended ? '<span class="ai-recommended">AI Recommended</span>' : ''}
                                        <span class="importance-level ${topic.importanceLevel}">${topic.importanceLevel.charAt(0).toUpperCase() + topic.importanceLevel.slice(1)} Priority</span>
                                    </div>
                                    
                                    <div class="topic-overview">
                                        <h3>Overview</h3>
                                        <p>${topic.overview}</p>
                                    </div>
                                    
                                    <div class="key-concepts">
                                        <h3>Key Concepts</h3>
                                        ${conceptsHTML}
                                    </div>
                                    
                                    <div class="exam-tips">
                                        <h3>Exam Tips</h3>
                                        <p>${topic.examTips}</p>
                                    </div>
                                    
                                    <div class="related-resources">
                                        <h3>Related Resources</h3>
                                        ${resourcesHTML}
                                    </div>
                                </div>
                            `;
                            
                            topicsGrid.innerHTML += topicCard;
                        });
                    }
                }
            })
            .catch(error => {
                console.error('Error loading topics:', error);
                const topicsGrid = document.querySelector('.topics-grid');
                if (topicsGrid) {
                    topicsGrid.innerHTML = '<p class="error-message">Failed to load topics. Please try again later.</p>';
                }
            });
    }

    // Toast notification system
    function showToast(message, type = 'success') {
        // Remove any existing toasts
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            document.body.removeChild(existingToast);
        }
        
        // Create new toast
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // Show the toast
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // Hide after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }

    // Function to load resources
    function loadResources() {
        // Show loading spinner
        const resourceSections = document.querySelectorAll('.resource-section');
        resourceSections.forEach(section => {
            const grid = section.querySelector('.videos-grid, .notes-grid, .ebooks-grid');
            if (grid) {
                grid.innerHTML = `
                    <div class="loading-container">
                        <div class="loading-spinner"></div>
                        <p class="loading-text">Loading resources...</p>
                    </div>
                `;
            }
        });

        fetch('/api/resources')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(resources => {
                console.log("Resources loaded successfully:", resources);
                
                // Load videos
                const videosGrid = document.querySelector('.videos-grid');
                if (videosGrid && resources.videos && Array.isArray(resources.videos)) {
                    videosGrid.innerHTML = '';
                    if (resources.videos.length === 0) {
                        videosGrid.innerHTML = '<p>No videos available at the moment.</p>';
                    } else {
                        resources.videos.forEach(video => {
                            const videoCard = `
                                <div class="video-card">
                                    <div class="video-thumbnail">
                                        <img src="${video.thumbnail}" alt="${video.title}" onerror="this.src='images/placeholder-video.jpg'">
                                        <div class="video-duration">${video.duration}</div>
                                    </div>
                                    <h3>${video.title}</h3>
                                    <p class="video-instructor">${video.instructor}</p>
                                    <a href="${video.url}" class="btn btn-outline" target="_blank" rel="noopener noreferrer">Watch Now</a>
                                </div>
                            `;
                            videosGrid.innerHTML += videoCard;
                        });
                    }
                }
                
                // Load notes
                const notesGrid = document.querySelector('.notes-grid');
                if (notesGrid && resources.notes && Array.isArray(resources.notes)) {
                    notesGrid.innerHTML = '';
                    if (resources.notes.length === 0) {
                        notesGrid.innerHTML = '<p>No notes available at the moment.</p>';
                    } else {
                        resources.notes.forEach(note => {
                            const noteCard = `
                                <div class="note-card">
                                    <div class="note-icon">
                                        <i class="fas fa-file-pdf"></i>
                                    </div>
                                    <div class="note-content">
                                        <h3>${note.title}</h3>
                                        <p class="note-info">${note.pages} pages • Updated ${note.lastUpdated}</p>
                                        <p class="note-description">${note.description}</p>
                                        <div class="note-actions">
                                            <a href="${note.previewUrl}" class="btn btn-small" target="_blank" rel="noopener noreferrer">Preview</a>
                                            <a href="${note.downloadUrl}" class="btn btn-small btn-primary" target="_blank" rel="noopener noreferrer">Download</a>
                                        </div>
                                    </div>
                                </div>
                            `;
                            notesGrid.innerHTML += noteCard;
                        });
                    }
                }
                
                // Load ebooks
                const ebooksGrid = document.querySelector('.ebooks-grid');
                if (ebooksGrid && resources.ebooks && Array.isArray(resources.ebooks)) {
                    ebooksGrid.innerHTML = '';
                    if (resources.ebooks.length === 0) {
                        ebooksGrid.innerHTML = '<p>No e-books available at the moment.</p>';
                    } else {
                        resources.ebooks.forEach(ebook => {
                            const ebookCard = `
                                <div class="ebook-card">
                                    <div class="ebook-cover">
                                        <img src="${ebook.cover}" alt="${ebook.title}" onerror="this.src='images/placeholder-ebook.jpg'">
                                    </div>
                                    <h3>${ebook.title}</h3>
                                    <p class="ebook-author">By ${ebook.authors}</p>
                                    <p class="ebook-description">${ebook.description}</p>
                                    <a href="${ebook.readUrl}" class="btn btn-outline" target="_blank" rel="noopener noreferrer">Read Online</a>
                                </div>
                            `;
                            ebooksGrid.innerHTML += ebookCard;
                        });
                    }
                }
            })
            .catch(error => {
                console.error('Error loading resources:', error);
                
                // Show error message with toast
                showToast('Failed to load resources. Please try again.', 'error');
                
                // Show error message in the UI
                const errorMessage = `<p class="error-message">Couldn't load resources. Please try again.</p>`;
                document.querySelectorAll('.videos-grid, .notes-grid, .ebooks-grid').forEach(grid => {
                    grid.innerHTML = errorMessage;
                });
                
                // Add a retry button
                const resourceSections = document.querySelectorAll('.resource-section');
                resourceSections.forEach(section => {
                    const retryBtn = document.createElement('button');
                    retryBtn.className = 'btn btn-primary';
                    retryBtn.textContent = 'Retry Loading';
                    retryBtn.style.display = 'block';
                    retryBtn.style.margin = '20px auto';
                    retryBtn.addEventListener('click', loadResources);
                    section.appendChild(retryBtn);
                });
            });
    }

    // Function to load time management data
    function loadTimeManagementData() {
        fetch('/api/timemanagement')
            .then(response => response.json())
            .then(data => {
                // Load stats
                const introStats = document.querySelector('.intro-stats');
                if (introStats && data.stats) {
                    introStats.innerHTML = '';
                    data.stats.forEach(stat => {
                        const statItem = `
                            <div class="stat-item">
                                <div class="stat-number">${stat.value}</div>
                                <div class="stat-text">${stat.description}</div>
                            </div>
                        `;
                        introStats.innerHTML += statItem;
                    });
                }
                
                // Load time allocation
                const timeBlocks = document.querySelector('.time-blocks');
                if (timeBlocks && data.timeAllocation) {
                    timeBlocks.innerHTML = '';
                    data.timeAllocation.forEach(item => {
                        const timeBlock = `
                            <div class="time-block">
                                <div class="time-subject">
                                    <span class="subject-color ${item.colorClass}"></span>
                                    <span>${item.subject}</span>
                                </div>
                                <div class="time-hours">${item.hours}h</div>
                                <div class="priority-level">${item.priority}</div>
                            </div>
                        `;
                        timeBlocks.innerHTML += timeBlock;
                    });
                }
                
                // Load chart
                const placeholderChart = document.querySelector('.placeholder-chart');
                if (placeholderChart && data.timeAllocation) {
                    placeholderChart.innerHTML = '';
                    data.timeAllocation.forEach(item => {
                        placeholderChart.innerHTML += `<div class="chart-segment ${item.colorClass}" style="width: ${item.chartPercentage}%"></div>`;
                    });
                }
                
                // Load study plans
                if (data.studyPlans) {
                    // 4-week plan
                    const fourWeekPlan = document.getElementById('4-week-plan');
                    if (fourWeekPlan && data.studyPlans.fourWeek) {
                        const planDesc = fourWeekPlan.querySelector('.plan-description p');
                        if (planDesc) {
                            planDesc.textContent = data.studyPlans.fourWeek.description;
                        }
                        
                        const weeklyPlan = fourWeekPlan.querySelector('.weekly-plan');
                        if (weeklyPlan) {
                            weeklyPlan.innerHTML = '';
                            data.studyPlans.fourWeek.weeks.forEach(week => {
                                let activitiesHTML = '<ul class="plan-activities">';
                                week.activities.forEach(activity => {
                                    activitiesHTML += `<li><strong>${activity.days}:</strong> ${activity.task}</li>`;
                                });
                                activitiesHTML += '</ul>';
                                
                                const weekHTML = `
                                    <div class="week">
                                        <h3>${week.title}</h3>
                                        ${activitiesHTML}
                                    </div>
                                `;
                                weeklyPlan.innerHTML += weekHTML;
                            });
                        }
                    }
                    
                    // 2-week plan
                    const twoWeekPlan = document.getElementById('2-week-plan');
                    if (twoWeekPlan && data.studyPlans.twoWeek) {
                        const planDesc = twoWeekPlan.querySelector('.plan-description p');
                        if (planDesc) {
                            planDesc.textContent = data.studyPlans.twoWeek.description;
                        }
                        
                        const weeklyPlan = twoWeekPlan.querySelector('.weekly-plan');
                        if (weeklyPlan) {
                            weeklyPlan.innerHTML = '';
                            data.studyPlans.twoWeek.weeks.forEach(week => {
                                let activitiesHTML = '<ul class="plan-activities">';
                                week.activities.forEach(activity => {
                                    activitiesHTML += `<li><strong>${activity.days}:</strong> ${activity.task}</li>`;
                                });
                                activitiesHTML += '</ul>';
                                
                                const weekHTML = `
                                    <div class="week">
                                        <h3>${week.title}</h3>
                                        ${activitiesHTML}
                                    </div>
                                `;
                                weeklyPlan.innerHTML += weekHTML;
                            });
                        }
                    }
                    
                    // 1-week plan
                    const oneWeekPlan = document.getElementById('1-week-plan');
                    if (oneWeekPlan && data.studyPlans.oneWeek) {
                        const planDesc = oneWeekPlan.querySelector('.plan-description p');
                        if (planDesc) {
                            planDesc.textContent = data.studyPlans.oneWeek.description;
                        }
                        
                        const weeklyPlan = oneWeekPlan.querySelector('.weekly-plan');
                        if (weeklyPlan) {
                            weeklyPlan.innerHTML = '';
                            data.studyPlans.oneWeek.weeks.forEach(week => {
                                let activitiesHTML = '<ul class="plan-activities">';
                                week.activities.forEach(activity => {
                                    activitiesHTML += `<li><strong>${activity.days}:</strong> ${activity.task}</li>`;
                                });
                                activitiesHTML += '</ul>';
                                
                                const weekHTML = `
                                    <div class="week">
                                        <h3>${week.title}</h3>
                                        ${activitiesHTML}
                                    </div>
                                `;
                                weeklyPlan.innerHTML += weekHTML;
                            });
                        }
                    }
                }
                
                // Load study tips
                const tipsGrid = document.querySelector('.tips-grid');
                if (tipsGrid && data.studyTips) {
                    tipsGrid.innerHTML = '';
                    data.studyTips.forEach(tip => {
                        const tipCard = `
                            <div class="tip-card">
                                <div class="tip-icon"><i class="fas fa-${tip.icon}"></i></div>
                                <h3>${tip.title}</h3>
                                <p>${tip.description}</p>
                            </div>
                        `;
                        tipsGrid.innerHTML += tipCard;
                    });
                }
            })
            .catch(error => {
                console.error('Error loading time management data:', error);
                document.querySelector('.time-management-intro').innerHTML = '<p class="error-message">Failed to load time management data. Please try again later.</p>';
            });
    }

    // Helper function to add solution button listeners
    function addSolutionButtonListeners() {
        const solutionButtons = document.querySelectorAll('.show-solution');
        if (solutionButtons.length > 0) {
            solutionButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const card = this.closest('.question-card');
                    const solution = card.querySelector('.solution');
                    
                    if (solution.style.display === 'none' || solution.style.display === '') {
                        solution.style.display = 'block';
                        this.textContent = 'Hide Solution';
                    } else {
                        solution.style.display = 'none';
                        this.textContent = 'Show Solution';
                    }
                });
            });
        }
    }
});
