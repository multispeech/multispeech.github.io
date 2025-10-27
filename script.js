const BENCHMARK_CONFIG = {
    repo: 'multispeech/multispeech-bench',  
    filePath: 'results/benchmark.csv',    
    branch: 'main'                          
};


let benchmarkData = [];
let filteredData = [];
let sortConfig = { column: null, ascending: true };

document.addEventListener('DOMContentLoaded', function() {
    loadBenchmarkData();
    setupSearchListener();
});

async function loadBenchmarkData() {
    const contentDiv = document.getElementById('benchmarkContent');
    contentDiv.innerHTML = '<div class="card"><div class="loading"><i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: var(--primary);"></i><p style="margin-top: 1rem;">Loading benchmark data...</p></div></div>';
    
    try {
        const url = `https://raw.githubusercontent.com/${BENCHMARK_CONFIG.repo}/${BENCHMARK_CONFIG.branch}/${BENCHMARK_CONFIG.filePath}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
        }
        
        const csvText = await response.text();
        
        Papa.parse(csvText, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: function(results) {
                benchmarkData = results.data;
                filteredData = [...benchmarkData];
                renderBenchmarkTable();
                updateLastUpdated();
            },
            error: function(error) {
                showError('Error parsing CSV: ' + error.message);
            }
        });
    } catch (error) {
        showError('Error loading benchmark data: ' + error.message + '<br><br>Please check:<br>• Repository URL is correct<br>• File path exists<br>• Repository is public');
    }
}

function renderBenchmarkTable() {
    const contentDiv = document.getElementById('benchmarkContent');
    
    if (filteredData.length === 0) {
        contentDiv.innerHTML = '<div class="card"><p class="abstract-text">No results found.</p></div>';
        return;
    }

    const headers = Object.keys(filteredData[0]);
    
    let tableHTML = '<div class="table-container"><table><thead><tr>';
    
    headers.forEach(header => {
        const isSorted = sortConfig.column === header;
        const indicator = isSorted ? (sortConfig.ascending ? '↑' : '↓') : '↕';
        tableHTML += `<th onclick="sortTable('${header}')" class="${isSorted ? 'sorted' : ''}">
            ${header}
            <span class="sort-indicator">${indicator}</span>
        </th>`;
    });
    
    tableHTML += '</tr></thead><tbody>';
    
    filteredData.forEach((row, index) => {
        tableHTML += '<tr>';
        headers.forEach((header, colIndex) => {
            let value = row[header];
            let cellClass = '';
            let cellContent = value;
            
            if (colIndex === 0 && typeof value === 'number') {
                const rankClass = value === 1 ? 'rank-1' : value === 2 ? 'rank-2' : value === 3 ? 'rank-3' : 'rank-other';
                cellContent = `<span class="rank-badge ${rankClass}">#${value}</span>`;
            }
            else if (colIndex === 1) {
                cellClass = 'method-name';
            }
            else if (typeof value === 'number') {
                cellClass = 'metric-value';
                cellContent = value.toFixed(3);
            }
            else if (typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'))) {
                cellContent = `<a href="${value}" class="method-link" target="_blank">Link <i class="fas fa-external-link-alt" style="font-size: 0.8rem;"></i></a>`;
            }
            
            tableHTML += `<td class="${cellClass}">${cellContent !== null && cellContent !== undefined ? cellContent : ''}</td>`;
        });
        tableHTML += '</tr>';
    });
    
    tableHTML += '</tbody></table></div>';
    contentDiv.innerHTML = tableHTML;
}

function sortTable(column) {
    if (sortConfig.column === column) {
        sortConfig.ascending = !sortConfig.ascending;
    } else {
        sortConfig.column = column;
        sortConfig.ascending = true;
    }
    
    filteredData.sort((a, b) => {
        let aVal = a[column];
        let bVal = b[column];
        
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
            return sortConfig.ascending ? aVal - bVal : bVal - aVal;
        }
        
        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();
        
        if (sortConfig.ascending) {
            return aStr.localeCompare(bStr);
        } else {
            return bStr.localeCompare(aStr);
        }
    });
    
    renderBenchmarkTable();
}

function setupSearchListener() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterTable);
    }
}

function filterTable() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    if (!searchTerm) {
        filteredData = [...benchmarkData];
    } else {
        filteredData = benchmarkData.filter(row => {
            return Object.values(row).some(value => {
                return String(value).toLowerCase().includes(searchTerm);
            });
        });
    }
    
    renderBenchmarkTable();
}

function updateLastUpdated() {
    const lastUpdatedDiv = document.getElementById('lastUpdated');
    const now = new Date();
    lastUpdatedDiv.textContent = `Last updated: ${now.toLocaleString()}`;
}

function showError(message) {
    const contentDiv = document.getElementById('benchmarkContent');
    contentDiv.innerHTML = `<div class="card"><div class="error-message"><i class="fas fa-exclamation-triangle"></i> ${message}</div></div>`;
}


window.addEventListener('scroll', () => {
    const scrollIndicator = document.getElementById('scrollIndicator');
    const scrolled = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
    scrollIndicator.style.width = scrolled + '%';
});

function copyBibtex() {
    const bibtexText = document.querySelector('.bibtex-code').textContent;
    navigator.clipboard.writeText(bibtexText).then(() => {
        const btn = document.querySelector('.copy-btn');
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => {
            btn.textContent = originalText;
        }, 2000);
    });
}

document.querySelectorAll('nav a').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
        this.classList.add('active');
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('nav a');

const observerOptions = {
    threshold: 0.3,
    rootMargin: '-100px 0px -66%'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${id}`) {
                    link.classList.add('active');
                }
            });
        }
    });
}, observerOptions);

sections.forEach(section => observer.observe(section));