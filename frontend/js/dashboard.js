document.addEventListener('DOMContentLoaded', async () => {
    // Fetch models and handle selection
    try {
        const modelSelectEl = document.getElementById('modelSelect');
        const modelsRes = await fetch(`${API_URL}/models`, { headers: getAuthHeaders() });
        if (modelsRes.ok) {
            const models = await modelsRes.json();
            modelSelectEl.innerHTML = '';
            
            models.forEach(mod => {
                const opt = document.createElement('option');
                opt.value = mod.id;
                opt.innerText = `${mod.name} (${mod.provider})`;
                modelSelectEl.appendChild(opt);
            });

            // Read from local storage
            const savedModel = localStorage.getItem('selectedModel');
            if (savedModel && models.some(m => m.id === savedModel)) {
                modelSelectEl.value = savedModel;
            } else {
                localStorage.setItem('selectedModel', modelSelectEl.value);
            }
        }

        modelSelectEl.addEventListener('change', () => {
            localStorage.setItem('selectedModel', modelSelectEl.value);
        });
    } catch (err) {
        console.error('Error loading models:', err);
    }

    // Fetch user profile and stats
    try {
        const profileRes = await fetch(`${API_URL}/profile`, { headers: getAuthHeaders() });
        if (profileRes.ok) {
            const profile = await profileRes.json();
            document.getElementById('userNameDisplay').innerText = profile.username;
        }

        const statsRes = await fetch(`${API_URL}/dashboard/stats`, { headers: getAuthHeaders() });
        if (statsRes.ok) {
            const stats = await statsRes.json();
            document.getElementById('stat-resume-score').innerText = stats.resume_score;
            document.getElementById('stat-jobs-matched').innerText = stats.jobs_matched;
            document.getElementById('stat-salary').innerText = stats.salary_estimate;
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }

    // Sidebar navigation
    const links = document.querySelectorAll('.sidebar-link[data-target]');
    const sections = document.querySelectorAll('.tool-section');

    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            links.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            const targetId = link.getAttribute('data-target');
            sections.forEach(sec => {
                if (sec.id === targetId) {
                    sec.classList.add('active');
                } else {
                    sec.classList.remove('active');
                }
            });
        });
    });



    // Helper to display results
    function showResult(elementId, data) {
        const el = document.getElementById(elementId);
        el.style.display = 'block';
        if (typeof data === 'object') {
            el.innerText = JSON.stringify(data, null, 2);
        } else {
            el.innerText = data;
        }
    }

    // Helper to properly format PDF with wrapped lines and multi-page support
    function downloadPDF(text, filename = "Cover_Letter.pdf") {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const margin = 15;
        const pageWidth = doc.internal.pageSize.getWidth();
        const maxWidth = pageWidth - (margin * 2);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        
        const paragraphs = text.split('\n');
        let cursorY = 20;
        const pageHeight = doc.internal.pageSize.getHeight();

        paragraphs.forEach(p => {
            if (p.trim().length === 0) {
                cursorY += 6; 
                return;
            }
            
            const lines = doc.splitTextToSize(p, maxWidth);
            lines.forEach(line => {
                if (cursorY > pageHeight - 20) {
                    doc.addPage();
                    cursorY = 20;
                }
                doc.text(line, margin, cursorY);
                cursorY += 6.5; 
            });
        });

        doc.save(filename);
    }

    // --- Dashboard Live Stats Logic ---
    async function refreshDashboard() {
        try {
            const res = await fetch(`${API_URL}/dashboard/stats`, {
                headers: getAuthHeaders()
            });
            if (res.ok) {
                const data = await res.json();
                
                // Animate numbers
                animateCounter('stat-resume-score', data.resume_score || 0);
                animateCounter('stat-jobs-matched', data.jobs_matched || 0);
                
                // Update text fields
                document.getElementById('stat-salary').innerText = data.salary_estimate || "Calculating...";
                document.getElementById('stat-best-role').innerText = data.best_role || "Pending";
                document.getElementById('stat-updated-time').innerText = data.updated_at || "Just now";
            }
        } catch (e) {
            console.error("Failed to fetch dashboard stats", e);
        }
    }

    async function resetDashboard() {
        try {
            await fetch(`${API_URL}/dashboard/reset`, {
                method: 'POST',
                headers: getAuthHeaders()
            });
            refreshDashboard();
        } catch (e) {
            console.error("Failed to reset dashboard", e);
        }
    }

    function animateCounter(elementId, targetValue) {
        const el = document.getElementById(elementId);
        if (!el) return;
        const startValue = parseInt(el.innerText) || 0;
        const duration = 1000;
        const startTime = performance.now();

        function step(currentTime) {
            const progress = Math.min((currentTime - startTime) / duration, 1);
            const currentVal = Math.floor(progress * (targetValue - startValue) + startValue);
            el.innerText = currentVal;
            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                el.innerText = targetValue;
            }
        }
        requestAnimationFrame(step);
    }
    
    // Initial fetch on load
    refreshDashboard();

    // AI Tools Event Listeners
    
    function setupDragDrop(prefix) {
        const box = document.getElementById(`${prefix}-drag-drop-box`);
        const input = document.getElementById(`${prefix}-file-input`);
        const info = document.getElementById(`${prefix}-file-info`);
        const nameDisp = document.getElementById(`${prefix}-file-name`);
        const clearBtn = document.getElementById(`${prefix}-clear-file`);
        
        let fileObj = null;

        if(!box) return () => null;

        box.addEventListener('click', () => input.click());
        input.addEventListener('change', (e) => handleFile(e.target.files[0]));

        ['dragenter', 'dragover'].forEach(ev => {
            box.addEventListener(ev, (e) => {
                e.preventDefault();
                box.style.background = "rgba(37, 99, 235, 0.12)";
            });
        });

        ['dragleave', 'drop'].forEach(ev => {
            box.addEventListener(ev, (e) => {
                e.preventDefault();
                box.style.background = "rgba(255, 255, 255, 0.02)";
            });
        });

        box.addEventListener('drop', (e) => {
            if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
        });

        function handleFile(f) {
            if (!f) return;
            const ext = f.name.split('.').pop().toLowerCase();
            if (ext !== 'pdf' && ext !== 'docx') return alert("Only PDF and DOCX files are allowed");
            if (f.size > 5 * 1024 * 1024) return alert("Maximum file size is 5MB");
            fileObj = f;
            nameDisp.innerText = `${f.name} (${(f.size / 1024).toFixed(1)} KB)`;
            box.style.display = "none";
            info.style.display = "flex";
            resetDashboard();
        }

        clearBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            fileObj = null;
            input.value = "";
            info.style.display = "none";
            box.style.display = "block";
        });

        return {
            getFile: () => fileObj,
            clear: () => clearBtn.click()
        };
    }

    const rewriteUpload = setupDragDrop('rewrite');

    // 2. Resume Rewrite
    let lastRewrittenResume = "";
    document.getElementById('btn-rewrite').addEventListener('click', async () => {
        const file = rewriteUpload.getFile();
        const text = document.getElementById('rewrite-text').value.trim();
        const role = document.getElementById('rewrite-role').value.trim();
        const style = document.getElementById('rewrite-style').value;
        const jd = document.getElementById('rewrite-jd').value.trim();
        
        if (!file && !text) return alert("Please upload a resume file or paste text");
        if (!role) return alert("Please specify a Target Role");

        const btn = document.getElementById('btn-rewrite');
        const loading = document.getElementById('rewrite-loading');
        const resultContainer = document.getElementById('rewrite-result-container');
        const outputBox = document.getElementById('rewrite-output');
        
        btn.disabled = true;
        loading.style.display = 'flex';
        resultContainer.style.display = 'none';

        try {
            const formData = new FormData();
            if (file) formData.append('resume_file', file);
            if (text) formData.append('resume_text', text);
            formData.append('role', role);
            formData.append('rewrite_style', style);
            if (jd) formData.append('job_description', jd);

            const res = await fetch(`${API_URL}/resume/rewrite`, {
                method: 'POST',
                headers: {
                    'X-Model-Name': localStorage.getItem('selectedModel') || 'llama3-70b-8192'
                },
                body: formData
            });
            const data = await res.json();
            
            if (res.ok && data.status === 'success') {
                lastRewrittenResume = data.rewritten_resume;
                outputBox.innerText = lastRewrittenResume;
                resultContainer.style.display = 'block';
                refreshDashboard();
            } else {
                alert(data.detail || "Error rewriting resume");
            }
        } catch (e) { alert("Error rewriting"); }
        
        btn.disabled = false;
        loading.style.display = 'none';
    });

    document.getElementById('btn-rewrite-clear').addEventListener('click', () => {
        rewriteUpload.clear();
        document.getElementById('rewrite-text').value = '';
        document.getElementById('rewrite-role').value = '';
        document.getElementById('rewrite-jd').value = '';
        document.getElementById('rewrite-result-container').style.display = 'none';
    });

    document.getElementById('btn-rewrite-copy').addEventListener('click', () => {
        if (!lastRewrittenResume) return;
        navigator.clipboard.writeText(lastRewrittenResume).then(() => {
            const btn = document.getElementById('btn-rewrite-copy');
            btn.innerHTML = `<i class="fa-solid fa-circle-check"></i> Copied!`;
            setTimeout(() => { btn.innerHTML = `<i class="fa-regular fa-copy"></i> Copy`; }, 2000);
        });
    });

    document.getElementById('btn-rewrite-txt').addEventListener('click', () => {
        if (!lastRewrittenResume) return;
        const blob = new Blob([lastRewrittenResume], { type: "text/plain" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "Rewritten_Resume.txt";
        a.click();
    });

    document.getElementById('btn-rewrite-pdf').addEventListener('click', () => {
        if (!lastRewrittenResume) return;
        downloadPDF(lastRewrittenResume, "Rewritten_Resume.pdf");
    });

    // 3. Advanced Cover Letter Module

    // Mode Switching
    const modeUploadBtn = document.getElementById('btn-mode-upload');
    const modeManualBtn = document.getElementById('btn-mode-manual');
    const uploadModeContent = document.getElementById('cl-upload-mode-content');
    const manualModeContent = document.getElementById('cl-manual-mode-content');

    modeUploadBtn.addEventListener('click', () => {
        modeUploadBtn.className = "btn btn-primary";
        modeManualBtn.className = "btn btn-outline";
        uploadModeContent.style.display = "block";
        manualModeContent.style.display = "none";
    });

    modeManualBtn.addEventListener('click', () => {
        modeUploadBtn.className = "btn btn-outline";
        modeManualBtn.className = "btn btn-primary";
        uploadModeContent.style.display = "none";
        manualModeContent.style.display = "block";
    });

    // File Upload handling
    const dragDropBox = document.getElementById('cl-drag-drop-box');
    const fileInput = document.getElementById('cl-file-input');
    const fileInfo = document.getElementById('cl-file-info');
    const fileNameDisplay = document.getElementById('cl-file-name');
    const clearFileBtn = document.getElementById('cl-clear-file');
    let selectedFile = null;

    dragDropBox.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelection(e.target.files[0]);
        }
    });

    // Drag & Drop event listeners
    ['dragenter', 'dragover'].forEach(eventName => {
        dragDropBox.addEventListener(eventName, (e) => {
            e.preventDefault();
            dragDropBox.style.background = "rgba(37, 99, 235, 0.12)";
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dragDropBox.addEventListener(eventName, (e) => {
            e.preventDefault();
            dragDropBox.style.background = "rgba(255, 255, 255, 0.02)";
        }, false);
    });

    dragDropBox.addEventListener('drop', (e) => {
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelection(e.dataTransfer.files[0]);
        }
    });

    function handleFileSelection(file) {
        const ext = file.name.split('.').pop().toLowerCase();
        if (ext !== 'pdf' && ext !== 'docx') {
            return alert("Only PDF and DOCX files are allowed");
        }
        if (file.size > 5 * 1024 * 1024) {
            return alert("Maximum file size is 5MB");
        }
        selectedFile = file;
        fileNameDisplay.innerText = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
        dragDropBox.style.display = "none";
        fileInfo.style.display = "flex";
    }

    clearFileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        selectedFile = null;
        fileInput.value = "";
        fileInfo.style.display = "none";
        dragDropBox.style.display = "block";
    });

    // Trigger Resume Upload + Cover Letter Generation
    const btnClUpload = document.getElementById('btn-cl-upload');
    const uploadLoading = document.getElementById('cl-upload-loading');
    const uploadResult = document.getElementById('cl-upload-result');
    const uploadOutput = document.getElementById('cl-upload-output');

    let generatedCoverLetter = "";

    btnClUpload.addEventListener('click', async () => {
        if (!selectedFile) {
            return alert("Please upload a resume file");
        }
        const role = document.getElementById('cl-target-role').value.trim();
        const company = document.getElementById('cl-company-name').value.trim();
        const jobDesc = document.getElementById('cl-jd').value.trim();

        if (!role) return alert("Please specify the target role");
        if (!company) return alert("Please specify the company name");

        btnClUpload.disabled = true;
        uploadLoading.style.display = "flex";
        uploadResult.style.display = "none";
        uploadOutput.innerText = "";

        try {
            const formData = new FormData();
            formData.append('resume_file', selectedFile);
            formData.append('role', role);
            formData.append('company', company);
            if (jobDesc) {
                formData.append('job_description', jobDesc);
            }

            const res = await fetch(`${API_URL}/cover-letter/upload-generate`, {
                method: 'POST',
                headers: {
                    'X-Model-Name': localStorage.getItem('selectedModel') || 'llama3-70b-8192'
                },
                body: formData
            });

            const data = await res.json();
            if (res.ok && data.success) {
                generatedCoverLetter = data.cover_letter;
                uploadOutput.innerText = generatedCoverLetter;
                uploadResult.style.display = "block";
            } else {
                alert(data.detail || "Error generating cover letter");
            }
        } catch (err) {
            console.error(err);
            alert("Error connecting to server while generating cover letter");
        } finally {
            btnClUpload.disabled = false;
            uploadLoading.style.display = "none";
        }
    });

    // Copy to clipboard
    document.getElementById('btn-cl-copy').addEventListener('click', () => {
        if (!generatedCoverLetter) return;
        navigator.clipboard.writeText(generatedCoverLetter).then(() => {
            const copyBtn = document.getElementById('btn-cl-copy');
            copyBtn.innerHTML = `<i class="fa-solid fa-circle-check"></i> Copied!`;
            setTimeout(() => {
                copyBtn.innerHTML = `<i class="fa-regular fa-copy"></i> Copy`;
            }, 2000);
        });
    });

    // Download PDF
    document.getElementById('btn-cl-pdf').addEventListener('click', () => {
        if (!generatedCoverLetter) return;
        downloadPDF(generatedCoverLetter, "Cover_Letter.pdf");
    });

    // Manual details fallback listener
    document.getElementById('btn-cl').addEventListener('click', async () => {
        const payload = {
            name: document.getElementById('cl-name').value,
            role: document.getElementById('cl-role').value,
            company: document.getElementById('cl-company').value,
            experience: document.getElementById('cl-exp').value,
            skills: document.getElementById('cl-skills').value,
            personalization: document.getElementById('cl-personalization').value
        };
        
        document.getElementById('btn-cl').innerText = "Generating...";
        try {
            const res = await fetch(`${API_URL}/cover-letter/generate`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            showResult('cl-result', data.cover_letter);
            refreshDashboard();
        } catch (e) { alert("Error generating cover letter"); }
        document.getElementById('btn-cl').innerText = "Generate Cover Letter";
    });

    // 4. Interview Prep
    document.getElementById('btn-int').addEventListener('click', async () => {
        const role = document.getElementById('int-role').value;
        document.getElementById('btn-int').innerText = "Generating...";
        try {
            const res = await fetch(`${API_URL}/interview/questions`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ role })
            });
            const data = await res.json();
            showResult('int-result', data.interview_prep);
        } catch (e) { alert("Error generating interview prep"); }
        document.getElementById('btn-int').innerText = "Generate Questions";
    });

    // 5. Career Roadmap
    document.getElementById('btn-rm').addEventListener('click', async () => {
        const payload = {
            current_role: document.getElementById('rm-current').value,
            target_role: document.getElementById('rm-target').value
        };
        document.getElementById('btn-rm').innerText = "Generating...";
        try {
            const res = await fetch(`${API_URL}/roadmap/generate`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            showResult('rm-result', data.roadmap);
        } catch (e) { alert("Error generating roadmap"); }
        document.getElementById('btn-rm').innerText = "Generate Roadmap";
    });

    // 6. Salary Predictor
    document.getElementById('btn-sal').addEventListener('click', async () => {
        const payload = {
            role: document.getElementById('sal-role').value,
            experience_years: parseInt(document.getElementById('sal-exp').value || "0"),
            country: document.getElementById('sal-country').value,
            city: document.getElementById('sal-city').value,
            skills: document.getElementById('sal-skills').value
        };
        document.getElementById('btn-sal').innerText = "Predicting...";
        try {
            const res = await fetch(`${API_URL}/salary/predict`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            showResult('sal-result', data.salary_estimate);
            refreshDashboard();
        } catch (e) { alert("Error predicting salary"); }
        document.getElementById('btn-sal').innerText = "Predict Salary";
    });

    // 7. Job Recommendations
    document.getElementById('btn-job').addEventListener('click', async () => {
        const payload = {
            skills: document.getElementById('job-skills').value,
            experience: document.getElementById('job-exp').value,
            preferred_role: document.getElementById('job-pref').value
        };
        document.getElementById('btn-job').innerText = "Searching...";
        try {
            const res = await fetch(`${API_URL}/jobs/recommend`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            showResult('job-result', data.recommendations);
        } catch (e) { alert("Error finding jobs"); }
        document.getElementById('btn-job').innerText = "Get Recommendations";
    });

    // --- Multi-Job Analyzer Logic ---
    const multiUpload = setupDragDrop('multi');
    let multiJobs = [];
    
    function renderMultiJobs() {
        const container = document.getElementById('jobs-list');
        if (multiJobs.length === 0) {
            container.innerHTML = '<div style="color: var(--text-muted); font-size: 0.9rem; font-style: italic;">No target jobs added yet. Select a popular role or add custom.</div>';
            return;
        }
        
        container.innerHTML = multiJobs.map((job, idx) => `
            <div class="job-item">
                <div class="job-item-fields">
                    <input type="text" class="form-control" style="padding: 0.5rem 0.75rem;" placeholder="Job Title (e.g. MLOps Engineer)" value="${job.title}" onchange="updateMultiJob(${idx}, 'title', this.value)">
                    <textarea class="form-control" style="padding: 0.5rem 0.75rem;" rows="2" placeholder="Job Description (Optional)" onchange="updateMultiJob(${idx}, 'job_description', this.value)">${job.job_description}</textarea>
                </div>
                <div class="job-item-actions">
                    <button class="btn btn-outline" style="color: #ef4444; border-color: rgba(239, 68, 68, 0.2); padding: 0.4rem 0.7rem; font-size: 1rem; border-radius: 6px;" onclick="removeMultiJob(${idx})"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        `).join('');
    }

    window.updateMultiJob = (idx, field, val) => {
        multiJobs[idx][field] = val;
    };

    window.removeMultiJob = (idx) => {
        multiJobs.splice(idx, 1);
        renderMultiJobs();
    };

    document.querySelectorAll('.pop-role-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const role = e.target.getAttribute('data-role');
            multiJobs.push({ title: role, job_description: '' });
            renderMultiJobs();
        });
    });

    document.getElementById('btn-add-custom-job').addEventListener('click', () => {
        multiJobs.push({ title: '', job_description: '' });
        renderMultiJobs();
    });

    // Initialize empty state
    renderMultiJobs();

    document.getElementById('btn-analyze-multi').addEventListener('click', async () => {
        const file = multiUpload.getFile();
        const text = document.getElementById('multi-text').value.trim();
        
        if (!file && !text) return alert("Please upload a resume file or paste text");
        if (multiJobs.length === 0) return alert("Please add at least one target job");

        const btn = document.getElementById('btn-analyze-multi');
        const loading = document.getElementById('multi-loading');
        const resultBox = document.getElementById('multi-result');

        btn.disabled = true;
        loading.style.display = 'flex';
        resultBox.style.display = 'none';

        try {
            const formData = new FormData();
            if (file) formData.append('resume_file', file);
            if (text) formData.append('resume_text', text);
            formData.append('jobs_json', JSON.stringify(multiJobs));

            const res = await fetch(`${API_URL}/resume/analyze-multi`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'X-Model-Name': localStorage.getItem('selectedModel') || 'llama3-70b-8192'
                },
                body: formData
            });
            const responseData = await res.json();
            
            if (responseData.data && responseData.data.raw_response) {
                console.error("AI Output:", responseData.data.raw_response);
                alert("The AI generated an invalid response format. Please try analyzing again.");
                btn.disabled = false;
                loading.style.display = 'none';
                return;
            }

            const data = responseData.data || {};

            let tableRows = (data.results || []).map(r => {
                let badgeClass = 'poor';
                if(r.status === 'Strong Match') badgeClass = 'strong';
                else if(r.status === 'Good Match') badgeClass = 'good';
                else if(r.status === 'Improve') badgeClass = 'improve';

                return `
                <tr>
                    <td style="font-weight: 600; color: var(--text-main);">${r.role}</td>
                    <td><div style="font-weight: 700; color: #38bdf8; font-size: 1.1rem;">${r.ats_score || 0}</div></td>
                    <td><div style="font-weight: 700; color: #4ade80; font-size: 1.1rem;">${r.match_score || 0}</div></td>
                    <td>
                        <div class="chip-container" style="gap: 0.25rem;">
                            ${(r.missing_keywords || []).slice(0, 3).map(k => `<span class="chip missing" style="padding: 0.2rem 0.5rem; font-size: 0.75rem;">${k}</span>`).join('')}
                            ${(r.missing_keywords && r.missing_keywords.length > 3) ? `<span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">+${r.missing_keywords.length - 3}</span>` : ''}
                        </div>
                    </td>
                    <td><span class="status-badge ${badgeClass}">${r.status}</span></td>
                </tr>
                `;
            }).join('');

            let bestRolesHtml = (data.best_roles || []).map((r, i) => {
                const medals = ['🥇', '🥈', '🥉'];
                const medal = i < 3 ? medals[i] : '🏅';
                return `<li class="rank-item"><span class="rank-medal">${medal}</span><span class="rank-title">${r}</span></li>`;
            }).join('');

            const missingKeywords = (data.common_missing_keywords || []).join(', ');

            let outputHtml = `
            <div class="section-card" style="padding: 0; overflow: hidden;">
                <div style="padding: 1.5rem 1.5rem 0.5rem 1.5rem;">
                    <h4 style="font-weight: 700; font-size: 1.2rem; margin: 0; color: var(--text-main);">Multi-Job Comparison Dashboard</h4>
                </div>
                <div style="overflow-x: auto;">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Job Role</th>
                                <th>ATS Score</th>
                                <th>Match</th>
                                <th>Key Missing</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="ats-dashboard-grid" style="grid-template-columns: 1fr 1fr; margin-top: 1.5rem;">
                <div class="section-card" style="margin-bottom: 0;">
                    <div class="section-title">
                        <span>🏆 Best Roles For You</span>
                    </div>
                    <ul class="rank-list">
                        ${bestRolesHtml}
                    </ul>
                </div>

                <div class="section-card missing-keywords" style="margin-bottom: 0;">
                    <div class="section-title" style="margin-bottom: 0.75rem;">
                        <span>🔥 Common Missing Skills</span>
                        <button id="btn-copy-common" class="btn btn-outline" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;"><i class="fa-regular fa-copy"></i> Copy All</button>
                    </div>
                    <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">These are missing across multiple target roles.</p>
                    <div class="chip-container">
                        ${(data.common_missing_keywords || []).map(k => `<span class="chip missing" onclick="navigator.clipboard.writeText('${k}'); alert('Copied: ${k}')">${k}</span>`).join('')}
                    </div>
                </div>
            </div>

            <div class="section-card" style="margin-top: 1.5rem;">
                <div class="section-title">
                    <span>💡 Universal Improvement Suggestions</span>
                </div>
                <ul class="suggestions-list">
                    ${(data.overall_suggestions || []).map(s => `<li>${s}</li>`).join('')}
                </ul>
            </div>

            <div class="cta-container">
                <button id="btn-push-multi-rewrite" class="btn btn-primary" style="font-size: 1.1rem; padding: 1rem 2rem;"><i class="fa-solid fa-wand-magic-sparkles"></i> Create Universal Resume Version</button>
            </div>
            `;
            
            resultBox.innerHTML = outputHtml;
            resultBox.style.display = 'block';
            refreshDashboard();

            document.getElementById('btn-copy-common')?.addEventListener('click', () => {
                navigator.clipboard.writeText(missingKeywords).then(() => {
                    const btn = document.getElementById('btn-copy-common');
                    btn.innerHTML = `<i class="fa-solid fa-check"></i> Copied!`;
                    setTimeout(() => { btn.innerHTML = `<i class="fa-regular fa-copy"></i> Copy All`; }, 2000);
                });
            });

            document.getElementById('btn-push-multi-rewrite')?.addEventListener('click', () => {
                const rewriteLink = document.querySelector('.sidebar-link[data-target="resume-rewrite"]');
                if(rewriteLink) rewriteLink.click();
                
                document.getElementById('rewrite-role').value = (data.best_roles || [])[0] || "Universal Match";
                
                let textToRewrite = document.getElementById('multi-text').value;
                if (!textToRewrite && multiUpload.getFile()) {
                    textToRewrite = "Please manually paste your resume text here:\n\n";
                }
                textToRewrite += `\n\n--- ADD THESE UNIVERSAL KEYWORDS ---\n${missingKeywords}`;
                document.getElementById('rewrite-text').value = textToRewrite;

                const jobTitles = multiJobs.map(j => j.title).filter(Boolean).join(", ");
                document.getElementById('rewrite-jd').value = "Rewrite to be a strong fit across multiple roles including: " + jobTitles;
                document.getElementById('rewrite-text').focus();
            });

        } catch (e) {
            console.error(e);
            alert("Error running multi-job analysis");
        }
        btn.disabled = false;
        loading.style.display = 'none';
    });
});
