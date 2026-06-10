import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Layers, 
  Search, 
  Globe, 
  Upload, 
  RefreshCw, 
  Sparkles,
  Link as LinkIcon,
  CheckCircle,
  FileCheck,
  FileImage,
  ExternalLink
} from 'lucide-react';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('compare');

  // Compare Tab State
  const [compareFiles, setCompareFiles] = useState({ img1: null, img2: null });
  const [comparePreviews, setComparePreviews] = useState({ img1: null, img2: null });
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareResult, setCompareResult] = useState(null);
  const [compareError, setCompareError] = useState(null);

  // Search Tab State
  const [searchFile, setSearchFile] = useState(null);
  const [searchPreview, setSearchPreview] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [searchError, setSearchError] = useState(null);

  // Web Scan Tab State
  const [webFile, setWebFile] = useState(null);
  const [webPreview, setWebPreview] = useState(null);
  const [webLoading, setWebLoading] = useState(false);
  const [webResults, setWebResults] = useState(null);
  const [webError, setWebError] = useState(null);

  // --- Handlers for Image Uploads ---
  const handleFileChange = (e, targetKey, setFiles, setPreviews) => {
    const file = e.target.files[0];
    if (file) {
      if (targetKey) {
        setFiles(prev => ({ ...prev, [targetKey]: file }));
        setPreviews(prev => ({ ...prev, [targetKey]: URL.createObjectURL(file) }));
      } else {
        setFiles(file);
        setPreviews(URL.createObjectURL(file));
      }
    }
  };

  const removeFile = (targetKey, setFiles, setPreviews) => {
    if (targetKey) {
      setFiles(prev => ({ ...prev, [targetKey]: null }));
      setPreviews(prev => ({ ...prev, [targetKey]: null }));
    } else {
      setFiles(null);
      setPreviews(null);
    }
  };

  // --- Actions ---
  const runSimilarityComparison = async () => {
    if (!compareFiles.img1 || !compareFiles.img2) return;
    setCompareLoading(true);
    setCompareError(null);
    setCompareResult(null);

    const formData = new FormData();
    formData.append('images', compareFiles.img1);
    formData.append('images', compareFiles.img2);

    try {
      const response = await fetch('/api/compare', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Comparison failed. Ensure ML CLIP backend service is running.');
      }

      const data = await response.json();
      setCompareResult(data);
    } catch (err) {
      setCompareError(err.message || 'An error occurred during comparison.');
    } finally {
      setCompareLoading(false);
    }
  };

  const runLocalSearch = async () => {
    if (!searchFile) return;
    setSearchLoading(true);
    setSearchError(null);
    setSearchResults(null);

    const formData = new FormData();
    formData.append('image', searchFile);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Search failed. Ensure ML CLIP backend service is running.');
      }

      const data = await response.json();
      setSearchResults(data.matches || []);
    } catch (err) {
      setSearchError(err.message || 'An error occurred during local search.');
    } finally {
      setSearchLoading(false);
    }
  };

  const runWebScan = async () => {
    if (!webFile) return;
    setWebLoading(true);
    setWebError(null);
    setWebResults(null);

    const formData = new FormData();
    formData.append('image', webFile);

    try {
      const response = await fetch('/api/external-search', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Web Scan failed. Ensure external API keys (Gemini, SerpApi) are active.');
      }

      const data = await response.json();
      setWebResults(data);
    } catch (err) {
      setWebError(err.message || 'An error occurred during external web scanning.');
    } finally {
      setWebLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="logo-section">
          <ShieldAlert className="logo-icon" />
          <span className="logo-text">AegisGuard</span>
        </div>

        <nav className="nav-links">
          <button 
            className={`nav-item ${activeTab === 'compare' ? 'active' : ''}`}
            onClick={() => setActiveTab('compare')}
          >
            <Layers className="nav-item-icon" />
            Similarity Check
          </button>
          <button 
            className={`nav-item ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            <Search className="nav-item-icon" />
            Catalog Matcher
          </button>
          <button 
            className={`nav-item ${activeTab === 'web' ? 'active' : ''}`}
            onClick={() => setActiveTab('web')}
          >
            <Globe className="nav-item-icon" />
            Web Piracy Scanner
          </button>
        </nav>

        <div className="sidebar-footer">
          <p>AegisGuard v1.0.0</p>
          <p style={{ color: 'var(--primary)', fontWeight: '600', marginTop: '4px' }}>Securing digital creations</p>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="main-content">
        
        {/* Header section */}
        {activeTab === 'compare' && (
          <header>
            <span className="title-badge">
              <Layers size={12} /> Image Core Comparison
            </span>
            <h1>Image Similarity</h1>
            <p>Compute fine-grained cosine similarity between two digital assets using deep learning CLIP representations.</p>
          </header>
        )}

        {activeTab === 'search' && (
          <header>
            <span className="title-badge">
              <Search size={12} /> Local Catalog Search
            </span>
            <h1>Catalog Matcher</h1>
            <p>Search your internal database catalog to locate duplicates, modifications, or original asset files instantly.</p>
          </header>
        )}

        {activeTab === 'web' && (
          <header>
            <span className="title-badge">
              <Globe size={12} /> External Piracy Sweep
            </span>
            <h1>Web Piracy Scanner</h1>
            <p>Scan Google Images, check model details with Gemini API, and match external face coordinates to map piracy alerts.</p>
          </header>
        )}

        {/* ---------------- FEATURE 1: SIMILARITY CHECK ---------------- */}
        {activeTab === 'compare' && (
          <div className="feature-section">
            <div className="glass-panel control-panel">
              <div className="panel-title">
                <FileCheck size={20} color="var(--primary)" /> Select Two Images to Compare
              </div>
              <div className="upload-grid">
                {/* Upload 1 */}
                <div className="dropzone">
                  {comparePreviews.img1 ? (
                    <>
                      <img src={comparePreviews.img1} alt="Image 1" className="preview-image" />
                      <button className="remove-btn" onClick={() => removeFile('img1', setCompareFiles, setComparePreviews)}>×</button>
                    </>
                  ) : (
                    <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Upload className="dropzone-icon" />
                      <span className="dropzone-title">Upload Reference Asset</span>
                      <span className="dropzone-desc">JPEG, PNG up to 10MB</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        style={{ display: 'none' }} 
                        onChange={(e) => handleFileChange(e, 'img1', setCompareFiles, setComparePreviews)}
                      />
                    </label>
                  )}
                </div>

                {/* Upload 2 */}
                <div className="dropzone">
                  {comparePreviews.img2 ? (
                    <>
                      <img src={comparePreviews.img2} alt="Image 2" className="preview-image" />
                      <button className="remove-btn" onClick={() => removeFile('img2', setCompareFiles, setComparePreviews)}>×</button>
                    </>
                  ) : (
                    <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Upload className="dropzone-icon" />
                      <span className="dropzone-title">Upload Suspected Asset</span>
                      <span className="dropzone-desc">JPEG, PNG up to 10MB</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        style={{ display: 'none' }} 
                        onChange={(e) => handleFileChange(e, 'img2', setCompareFiles, setComparePreviews)}
                      />
                    </label>
                  )}
                </div>
              </div>

              <button 
                className="action-btn" 
                disabled={!compareFiles.img1 || !compareFiles.img2 || compareLoading}
                onClick={runSimilarityComparison}
              >
                {compareLoading ? <RefreshCw className="spinner" size={18} /> : <Sparkles size={18} />}
                {compareLoading ? 'Evaluating Representation Metrics...' : 'Execute Vector Comparison'}
              </button>

              {compareError && <div className="error-message">{compareError}</div>}
            </div>

            {/* Comparison Results */}
            {compareResult && (
              <div className="glass-panel results-panel">
                <div className="panel-title">
                  <CheckCircle size={20} color="var(--success)" /> Analysis Completed
                </div>
                <div className="compare-result-box">
                  <div className="similarity-circle">
                    <span className="similarity-circle-val">{compareResult.similarity}</span>
                    <span className="similarity-circle-label">Similarity</span>
                  </div>
                  
                  <div>
                    <span className={`piracy-tag ${compareResult.piracyLevel.toLowerCase()}`}>
                      Piracy Status: {compareResult.piracyLevel}
                    </span>
                  </div>

                  <p className="piracy-explanation">
                    {parseFloat(compareResult.similarity) > 90 
                      ? "Warning: These assets are highly identical. Strong likelihood of direct replication, minor overlaying, or direct format conversion." 
                      : parseFloat(compareResult.similarity) > 70 
                        ? "Notice: Moderate correlation detected. The composition, subjects, or environment styles closely match the original artwork." 
                        : "Safe: Minor vector overlaps. The contents differ significantly and show low elements of duplication or plagiarism."}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---------------- FEATURE 2: LOCAL CATALOG SEARCH ---------------- */}
        {activeTab === 'search' && (
          <div className="feature-section">
            <div className="glass-panel control-panel">
              <div className="panel-title">
                <FileImage size={20} color="var(--primary)" /> Scan Local Repository catalog
              </div>
              <div className="dropzone" style={{ minHeight: '260px' }}>
                {searchPreview ? (
                  <>
                    <img src={searchPreview} alt="Search Preview" className="preview-image" />
                    <button className="remove-btn" onClick={() => removeFile(null, setSearchFile, setSearchPreview)}>×</button>
                  </>
                ) : (
                  <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Upload className="dropzone-icon" />
                    <span className="dropzone-title">Drop Target Asset Image</span>
                    <span className="dropzone-desc">Find closest visual match in your collection</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      style={{ display: 'none' }} 
                      onChange={(e) => handleFileChange(e, null, setSearchFile, setSearchPreview)}
                    />
                  </label>
                )}
              </div>

              <button 
                className="action-btn" 
                disabled={!searchFile || searchLoading}
                onClick={runLocalSearch}
                style={{ marginTop: '1.5rem' }}
              >
                {searchLoading ? <RefreshCw className="spinner" size={18} /> : <Search size={18} />}
                {searchLoading ? 'Searching Vector Indexes...' : 'Scan Repository Index'}
              </button>

              {searchError && <div className="error-message">{searchError}</div>}
            </div>

            {/* Matches Grid */}
            {searchResults && (
              <div className="glass-panel results-panel">
                <div className="panel-title">
                  <CheckCircle size={20} color="var(--success)" /> Matching Catalog Items ({searchResults.length})
                </div>
                {searchResults.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No matches located in database indices.</p>
                ) : (
                  <div className="matches-grid">
                    {searchResults.map((match, idx) => (
                      <div className="match-card" key={idx}>
                        <div className="match-img-container">
                          <img src={match.imageUrl} alt={match.image} className="match-img" />
                          <div className="match-score-badge">{match.similarity}%</div>
                        </div>
                        <div className="match-info">
                          <div className="match-title">{match.image}</div>
                          <div className="match-desc">
                            Status: {parseFloat(match.similarity) > 85 ? 'Critical Duplicate' : 'Potential Reuse'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ---------------- FEATURE 3: WEB SCANNER ---------------- */}
        {activeTab === 'web' && (
          <div className="feature-section">
            <div className="glass-panel control-panel">
              <div className="panel-title">
                <Globe size={20} color="var(--primary)" /> Web-Scale Leakage Scanner
              </div>
              <div className="dropzone" style={{ minHeight: '260px' }}>
                {webPreview ? (
                  <>
                    <img src={webPreview} alt="Web Preview" className="preview-image" />
                    <button className="remove-btn" onClick={() => removeFile(null, setWebFile, setWebPreview)}>×</button>
                  </>
                ) : (
                  <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Upload className="dropzone-icon" />
                    <span className="dropzone-title">Upload Leaked Asset Target</span>
                    <span className="dropzone-desc">Scan search engines, detect faces, verify with Gemini AI</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      style={{ display: 'none' }} 
                      onChange={(e) => handleFileChange(e, null, setWebFile, setWebPreview)}
                    />
                  </label>
                )}
              </div>

              <button 
                className="action-btn" 
                disabled={!webFile || webLoading}
                onClick={runWebScan}
                style={{ marginTop: '1.5rem' }}
              >
                {webLoading ? <RefreshCw className="spinner" size={18} /> : <Globe size={18} />}
                {webLoading ? 'Executing Multi-Model Web Sweeper...' : 'Start Global Scan'}
              </button>

              {webError && <div className="error-message">{webError}</div>}
            </div>

            {/* Web scan results */}
            {webResults && (
              <div className="glass-panel results-panel">
                <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldAlert size={20} color="var(--warning)" /> Web Scan Report
                  </div>
                  <span className="title-badge" style={{ margin: 0 }}>
                    Detected Entity: {webResults.detected_entity}
                  </span>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    Gemini AI formulated queries to probe public image indexes:
                  </p>
                  <div className="meta-chips">
                    {webResults.queries_used.map((q, i) => (
                      <span key={i} className="meta-chip highlight">{q}</span>
                    ))}
                  </div>
                </div>

                <h3 style={{ fontSize: '1rem', marginBottom: '1rem', fontWeight: '700' }}>Matched Online Sources</h3>

                {(!webResults.matches || webResults.matches.length === 0) ? (
                  <p style={{ color: 'var(--text-muted)' }}>No matches found on the open web. Asset appears secure.</p>
                ) : (
                  <div className="matches-grid">
                    {webResults.matches.map((match, idx) => (
                      <div className="match-card" key={idx}>
                        <div className="match-img-container">
                          <img src={match.url} alt="External source" className="match-img" />
                          <div className="match-score-badge">{match.similarity}% Match</div>
                        </div>
                        <div className="match-info">
                          <div className="match-title" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <LinkIcon size={12} />
                            <a href={match.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                              View Source Link <ExternalLink size={10} style={{ marginLeft: 2 }} />
                            </a>
                          </div>
                          <div className="match-desc" style={{ marginTop: '0.25rem' }}>
                            Risk Level: <strong style={{ color: match.piracy.includes('HIGH') ? 'var(--danger)' : 'var(--warning)' }}>{match.piracy}</strong>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}

export default App;
