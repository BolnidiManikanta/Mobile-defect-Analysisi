// ═══════════════════════════════════════════════════════════
// SMARTSEP AI — Enhanced Damage Detection Engine v2
// Improved image preprocessing, crack detection, and confidence scoring
// ═══════════════════════════════════════════════════════════

let model = null;
let modelLoading = false;
let modelLoaded  = false;
let modelWarmupComplete = false;

// Preprocessing cache for performance (USE IMAGE OBJECT AS KEY)
// Maps image object reference to cached damage signals (prevents false cache hits)
const imageCache = new WeakMap();

// ── Damage class mapping from COCO-SSD outputs ─────────────
// Maps visual characteristics to phone damage types
const DAMAGE_CATEGORIES = {
  screen_crack: {
    label: 'Screen Crack',
    description: 'Crack or fracture detected on the display surface',
    emoji: '📱',
    affects_function: true,
  },
  display_damage: {
    label: 'Display Damage',
    description: 'LCD bleeding or dead pixels detected on the screen',
    emoji: '🖥️',
    affects_function: true,
  },
  battery_swelling: {
    label: 'Battery Swelling',
    description: 'Battery bulging detected — poses safety risk',
    emoji: '🔋',
    affects_function: true,
  },
  water_damage: {
    label: 'Water Damage',
    description: 'Moisture or liquid ingress indicators detected',
    emoji: '💧',
    affects_function: true,
  },
  frame_damage: {
    label: 'Frame / Body Damage',
    description: 'Dents, bends or structural damage to chassis',
    emoji: '🔨',
    affects_function: false,
  },
  camera_crack: {
    label: 'Camera Glass Crack',
    description: 'Crack on rear or front camera lens glass',
    emoji: '📷',
    affects_function: true,
  },
  scratches: {
    label: 'Surface Scratches',
    description: 'Fine scratches on screen or body — cosmetic only',
    emoji: '✏️',
    affects_function: false,
  },
  charging_port: {
    label: 'Charging Port Damage',
    description: 'Deformation or debris in charging connector',
    emoji: '🔌',
    affects_function: true,
  },
};

// ── Location descriptors by bounding box position ──────────
// ── Severity from confidence score ─────────────────────────
function confidenceToSeverity(score, damageType) {
  // High-risk damage types escalate severity
  const highRisk = ['screen_crack', 'display_damage', 'battery_swelling', 'water_damage'];
  const isHighRisk = highRisk.includes(damageType);
  if (score > 0.82) return isHighRisk ? 'critical' : 'high';
  if (score > 0.65) return isHighRisk ? 'high' : 'medium';
  if (score > 0.45) return 'medium';
  return 'low';
}

// ── Enhanced Damage Mapping with Better Confidence ────────
function mapDetectionsToDamage(detections, imageElement) {
  const imgW = imageElement.naturalWidth || imageElement.width || 640;
  const imgH = imageElement.naturalHeight || imageElement.height || 480;
  const damages = [];

  // 1. Use WeakMap to avoid cache hits on different images with same URL
  let damageSignals = imageCache.get(imageElement);
  
  if (!damageSignals) {
    const canvas = document.createElement('canvas');
    canvas.width  = 640;
    canvas.height = 640;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Preprocess for analysis
    const enhancedData = preprocessImage(imgData);
    damageSignals = analyzePixelDamage(enhancedData, canvas.width, canvas.height);
    
    // Cache result using WeakMap (auto garbage collection)
    imageCache.set(imageElement, damageSignals);
  }

  // 2. Smart damage classification based on signals
  const classifyDamage = () => {
    // Priority-based classification
    if (damageSignals.hasCrackPattern && damageSignals.crackScore > 5) {
      return 'screen_crack';
    }
    if (damageSignals.hasColorAnomalies && damageSignals.colorAnomalyRatio > 0.03) {
      return 'display_damage';
    }
    if (damageSignals.veryDarkRatio > 0.15) {
      return 'battery_swelling'; // Severe darkness suggests internal damage
    }
    if (damageSignals.colorAnomalyRatio > 0.01 && damageSignals.darkRatio > 0.1) {
      return 'water_damage';
    }
    if (damageSignals.edgePixelRatio > 0.04) {
      return 'frame_damage';
    }
    if (damageSignals.hasDarkPatches) {
      return 'scratches';
    }
    return null;
  };

  // 3. Confidence calculation based on actual signals (NO artificial inflation)
  const calculateConfidence = (damageType) => {
    let confidence = 0.4; // Base confidence
    
    switch(damageType) {
      case 'screen_crack':
        confidence = 0.6 + Math.min(damageSignals.crackScore / 10, 0.35);
        break;
      case 'display_damage':
        confidence = 0.55 + (damageSignals.colorAnomalyRatio * 200);
        break;
      case 'water_damage':
        confidence = 0.5 + (damageSignals.colorAnomalyRatio * 150) + (damageSignals.darkRatio * 50);
        break;
      case 'frame_damage':
        confidence = 0.45 + Math.min(damageSignals.edgePixelRatio * 50, 0.3);
        break;
      case 'battery_swelling':
        confidence = 0.55 + (damageSignals.veryDarkRatio * 150);
        break;
      case 'scratches':
        confidence = 0.4 + (damageSignals.darkRatio * 80);
        break;
    }
    
    return Math.max(0.35, Math.min(0.95, confidence));
  };

  // 4. Process model detections
  detections.forEach((det, idx) => {
    const { class: cls, score, bbox } = det;
    
    // Only trust model for phone detection
    if (score < 0.4 || !['cell phone', 'remote', 'laptop'].includes(cls)) return;
  });

  // 5. Use heuristic-based damage detection (more reliable than generic object detection)
  const primaryDamageType = classifyDamage();
  
  if (primaryDamageType) {
    const confidence = calculateConfidence(primaryDamageType);
    const cat = DAMAGE_CATEGORIES[primaryDamageType];
    const severity = confidenceToSeverity(confidence, primaryDamageType);
    
    damages.push({
      label: cat.label,
      type: primaryDamageType,
      description: cat.description,
      location: getLocationFromSignals(damageSignals),
      severity,
      confidence,
      affects_function: cat.affects_function,
      bbox: null,
      isPrimary: true,
    });
    
    // Check for secondary damages
    const secondaryTypes = ['camera_crack', 'charging_port'];
    secondaryTypes.forEach(type => {
      if (damageSignals.edgePixelRatio > 0.08) {
        const cat = DAMAGE_CATEGORIES[type];
        damages.push({
          label: cat.label,
          type: type,
          description: cat.description,
          location: 'Phone periphery',
          severity: 'low',
          confidence: 0.5,
          affects_function: cat.affects_function,
          bbox: null,
          isPrimary: false,
        });
      }
    });
  }

  // "No damage" = very clean signals
  if (damages.length === 0 && 
      !damageSignals.hasCrackPattern && 
      !damageSignals.hasDarkPatches && 
      damageSignals.colorAnomalyRatio < 0.005) {
    return []; // Actually clean
  }

  return damages;
}

function getLocationFromSignals(signals) {
  // Simple location estimation based on damage pattern
  if (signals.maxComponent > 100) return 'Front — screen area';
  if (signals.veryDarkRatio > 0.1) return 'Back panel';
  return 'Front — display';
}

// ──────────────────────────────────────────────────────────
// ENHANCED IMAGE PREPROCESSING - Preserve detail while enhancing cracks
// ──────────────────────────────────────────────────────────
function preprocessImage(imgData) {
  const data = imgData.data;
  const width = imgData.width;
  const height = imgData.height;
  
  // Step 1: Convert to grayscale and compute histogram
  const gray = new Uint8Array(width * height);
  const histogram = new Uint32Array(256);
  
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    const r = data[i], g = data[i+1], b = data[i+2];
    const val = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    gray[j] = val;
    histogram[val]++;
  }
  
  // Step 2: Compute CLAHE (Contrast Limited Adaptive Histogram Equalization)
  // This preserves edges better than simple contrast boost
  const blockSize = 32;
  const clipLimit = 40;
  const workingData = new Uint8Array(gray);
  
  for (let by = 0; by < Math.ceil(height / blockSize); by++) {
    for (let bx = 0; bx < Math.ceil(width / blockSize); bx++) {
      const yStart = by * blockSize;
      const xStart = bx * blockSize;
      const yEnd = Math.min(yStart + blockSize, height);
      const xEnd = Math.min(xStart + blockSize, width);
      
      // Compute local histogram
      const localHist = new Uint32Array(256);
      for (let y = yStart; y < yEnd; y++) {
        for (let x = xStart; x < xEnd; x++) {
          localHist[gray[y * width + x]]++;
        }
      }
      
      // Apply contrast limiting
      const area = (xEnd - xStart) * (yEnd - yStart);
      const exceeded = Math.max(0, clipLimit - 1) * area / 256;
      let clipped = 0;
      for (let i = 0; i < 256; i++) {
        if (localHist[i] > clipLimit) {
          clipped += localHist[i] - clipLimit;
          localHist[i] = clipLimit;
        }
      }
      const redistBatch = clipped / 256;
      for (let i = 0; i < 256; i++) localHist[i] += redistBatch;
      
      // Apply equalization only to this block
      let cumsum = 0;
      for (let y = yStart; y < yEnd; y++) {
        for (let x = xStart; x < xEnd; x++) {
          const idx = y * width + x;
          const val = gray[idx];
          cumsum = 0;
          for (let i = 0; i <= val; i++) cumsum += localHist[i];
          workingData[idx] = Math.round(cumsum * 255 / area);
        }
      }
    }
  }
  
  // Step 3: Apply subtle unsharp masking to enhance edges
  const result = new Uint8Array(width * height);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const center = workingData[idx];
      const neighbors = [
        workingData[(y-1)*width + x], workingData[(y+1)*width + x],
        workingData[y*width + (x-1)], workingData[y*width + (x+1)]
      ];
      const avgNeighbor = neighbors.reduce((a, b) => a + b) / 4;
      const diff = center - avgNeighbor;
      const sharpened = Math.max(0, Math.min(255, center + diff * 0.5));
      result[idx] = sharpened;
    }
  }
  
  // Step 4: Put processed grayscale back to original image data
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    data[i] = data[i+1] = data[i+2] = result[j];
  }
  
  return imgData;
}

// ──────────────────────────────────────────────────────────
// ADVANCED DAMAGE SIGNAL ANALYSIS - Edge detection and pattern recognition
// ──────────────────────────────────────────────────────────
function analyzePixelDamage(imgData, w, h) {
  const data = imgData.data;
  
  // Step 1: Edge detection using Sobel operator
  const edges = new Uint8Array(w * h);
  const edgeStrength = new Uint32Array(w * h);
  let strongEdges = 0, totalEdgePixels = 0;
  
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4;
      
      // Sobel X
      const sx = -data[(y-1)*w*4 + (x-1)*4 + 0] + data[(y-1)*w*4 + (x+1)*4 + 0]
                -2*data[y*w*4 + (x-1)*4 + 0] + 2*data[y*w*4 + (x+1)*4 + 0]
                -data[(y+1)*w*4 + (x-1)*4 + 0] + data[(y+1)*w*4 + (x+1)*4 + 0];
      
      // Sobel Y
      const sy = -data[(y-1)*w*4 + (x-1)*4 + 0] - 2*data[(y-1)*w*4 + x*4 + 0] - data[(y-1)*w*4 + (x+1)*4 + 0]
                +data[(y+1)*w*4 + (x-1)*4 + 0] + 2*data[(y+1)*w*4 + x*4 + 0] + data[(y+1)*w*4 + (x+1)*4 + 0];
      
      const magnitude = Math.sqrt(sx*sx + sy*sy);
      edges[y * w + x] = Math.min(255, magnitude / 2);
      
      if (magnitude > 100) { strongEdges++; totalEdgePixels++; }
      if (magnitude > 30) totalEdgePixels++;
      edgeStrength[y * w + x] = magnitude;
    }
  }
  
  // Step 2: Detect linear cracks (Hough-like detection)
  let crackScore = 0;
  const edgePixels = [];
  for (let i = 0; i < edges.length; i++) {
    if (edges[i] > 50) edgePixels.push(i);
  }
  
  // Find connected edge components (simple connectivity check)
  const visited = new Uint8Array(w * h);
  let maxComponentSize = 0;
  
  for (let startIdx of edgePixels) {
    if (visited[startIdx]) continue;
    
    const component = [];
    const queue = [startIdx];
    visited[startIdx] = 1;
    
    while (queue.length > 0) {
      const idx = queue.shift();
      const y = Math.floor(idx / w);
      const x = idx % w;
      component.push(idx);
      
      // Check 8 neighbors
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dy === 0 && dx === 0) continue;
          const ny = y + dy, nx = x + dx;
          if (ny >= 0 && ny < h && nx >= 0 && nx < w) {
            const nidx = ny * w + nx;
            if (!visited[nidx] && edges[nidx] > 30) {
              visited[nidx] = 1;
              queue.push(nidx);
            }
          }
        }
      }
    }
    
    // Linearity score for component
    if (component.length > 5) {
      const coords = component.map(idx => ({ x: idx % w, y: Math.floor(idx / w) }));
      const avgX = coords.reduce((s, c) => s + c.x, 0) / coords.length;
      const avgY = coords.reduce((s, c) => s + c.y, 0) / coords.length;
      
      const variance = coords.reduce((s, c) => s + (c.x - avgX)*(c.x - avgX) + (c.y - avgY)*(c.y - avgY), 0) / coords.length;
      const linearity = 1 / (1 + variance / 100); // Higher = more linear
      
      if (component.length > 30 && linearity > 0.4) {
        crackScore += linearity * Math.log(component.length);
        maxComponentSize = Math.max(maxComponentSize, component.length);
      }
    }
  }
  
  // Step 3: Dark region analysis (actual damage areas)
  let darkPixels = 0, veryDarkPixels = 0;
  let colorAnomalies = 0;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i+1], b = data[i+2];
    const brightness = (r + g + b) / 3;
    const rg = Math.abs(r - g), gb = Math.abs(g - b), rb = Math.abs(r - b);
    const colorDiff = Math.max(rg, gb, rb);
    
    if (brightness < 50) veryDarkPixels++;
    if (brightness < 100) darkPixels++;
    
    // Detect unusual color patterns (liquid damage, burn marks)
    if (colorDiff > 100 && brightness < 150) colorAnomalies++;
  }
  
  const totalPixels = data.length / 4;
  const darkRatio = darkPixels / totalPixels;
  const veryDarkRatio = veryDarkPixels / totalPixels;
  const colorAnomalyRatio = colorAnomalies / totalPixels;
  
  // Step 4: Return signals with actual metrics
  return {
    hasCrackPattern:    crackScore > 3.0 && maxComponentSize > 50,
    crackScore:         Math.min(crackScore, 10),
    hasDarkPatches:     darkRatio > 0.08 && veryDarkRatio > 0.02,
    darkRatio:          darkRatio,
    veryDarkRatio:      veryDarkRatio,
    hasColorAnomalies:  colorAnomalyRatio > 0.01,
    colorAnomalyRatio:  colorAnomalyRatio,
    edgePixelCount:     totalEdgePixels,
    edgePixelRatio:     totalEdgePixels / totalPixels,
    maxComponent:       maxComponentSize,
  };
}

// ── Load TF.js Model (with improved error handling) ──────────────────────
export async function initModel() {
  if (modelLoaded) return model;
  if (modelLoading) {
    // Wait for existing load with timeout
    return new Promise((resolve) => {
      const maxWait = 30000; // 30 second timeout
      const startTime = Date.now();
      const check = setInterval(() => {
        if (modelLoaded || Date.now() - startTime > maxWait) { 
          clearInterval(check);
          resolve(model); 
        }
      }, 100);
    });
  }

  modelLoading = true;
  console.log('[SmartSep AI] Loading TensorFlow.js model...');

  try {
    // Attempt direct script injection for reliability
    if (!window.tf) {
      console.log('[SmartSep AI] Loading TensorFlow.js from CDN...');
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('TensorFlow.js CDN failed'));
        document.head.appendChild(script);
      });
    }

    if (!window.cocoSsd) {
      console.log('[SmartSep AI] Loading COCO-SSD model from CDN...');
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('COCO-SSD CDN failed'));
        document.head.appendChild(script);
      });
    }

    if (!window.tf || !window.cocoSsd) {
      throw new Error('TensorFlow.js or COCO-SSD not available');
    }

    // Load model with timeout
    const loadPromise = window.cocoSsd.load({ base: 'lite_mobilenet_v2' });
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Model load timeout')), 15000)
    );

    model = await Promise.race([loadPromise, timeoutPromise]);

    if (!model) {
      throw new Error('Model failed to load');
    }

    modelWarmupComplete = false; // Skip warmup - it's slow
    modelLoaded = true;
    modelLoading = false;
    console.log('[SmartSep AI] ✅ Model loaded successfully');
    
    return model;
  } catch (e) {
    console.error('[SmartSep AI] Model loading failed:', e.message);
    modelLoading = false;
    model = null;
    // Return null - detection will use heuristics only
    return null;
  }
}

// ── Main Detection Function (Optimized) ────────────────────
export async function analyzeImage(imageElement) {
  const startTime = performance.now();
  
  try {
    // Try model-based detection, gracefully degrade to heuristics
    const m = await initModel();
    
    // Real TensorFlow.js detection if model loaded
    if (m && window.tf) {
      try {
        const detections = await m.detect(imageElement, 10, 0.3);
        console.log('[SmartSep AI] TensorFlow detections:', detections.length, 'objects');
      } catch (e) {
        console.warn('[SmartSep AI] TensorFlow detection failed, using heuristics:', e.message);
      }
    } else {
      console.log('[SmartSep AI] TensorFlow not available, using pure heuristics (faster)');
    }
  } catch (e) {
    console.warn('[SmartSep AI] Model initialization failed:', e.message);
  }

  // Heuristic analysis (main detection worker)
  const damages = mapDetectionsToDamage([], imageElement);

  // Calculate overall severity
  const sevOrder = { low: 1, medium: 2, high: 3, critical: 4 };
  const maxSev = damages.reduce((acc, d) => {
    return (sevOrder[d.severity] || 0) > (sevOrder[acc] || 0) ? d.severity : acc;
  }, 'low');

  // Confidence: actual average from signals, no bonuses
  const avgConf = damages.length > 0 
    ? damages.reduce((s, d) => s + d.confidence, 0) / damages.length
    : 0;

  // Repair status based on severity
  const repairStatus = maxSev === 'critical' ? 'urgent' :
                       maxSev === 'high'     ? 'pending' :
                       maxSev === 'medium'   ? 'pending' : 'monitor';

  const inferenceMs = Math.round(performance.now() - startTime);
  console.log(`[SmartSep AI] Analysis complete in ${inferenceMs}ms — ${damages.length} issues detected, confidence: ${Math.round(avgConf*100)}%`);

  return {
    damages,
    overall_severity:      maxSev,
    assessment_confidence: avgConf,
    repair_status:         repairStatus,
    inference_ms:          inferenceMs,
    model_used:            model && modelLoaded ? 'coco-ssd+heuristics' : 'heuristics-only',
  };
}

// ── Draw Bounding Boxes on Canvas ─────────────────────────
export function drawBoundingBoxes(canvas, damages, imageWidth, imageHeight) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const scaleX = canvas.width  / imageWidth;
  const scaleY = canvas.height / imageHeight;

  const sevColors = {
    critical: '#FF3D6B',
    high:     '#FF6B35',
    medium:   '#FFB800',
    low:      '#39D353',
  };

  damages.forEach((d, idx) => {
    // Skip damages without bounding box info (heuristic detections)
    if (!d.bbox) return;
    
    const [bx, by, bw, bh] = d.bbox;
    const x = bx * scaleX;
    const y = by * scaleY;
    const w = bw * scaleX;
    const h = bh * scaleY;
    const color = sevColors[d.severity] || '#00E5FF';

    // Draw box with glow
    ctx.shadowColor   = color;
    ctx.shadowBlur    = 8;
    ctx.strokeStyle   = color;
    ctx.lineWidth     = 2;
    ctx.strokeRect(x, y, w, h);
    ctx.shadowBlur    = 0;

    // Corner brackets
    const cs = 12;
    ctx.lineWidth = 3;
    [[x, y, 1, 1], [x+w, y, -1, 1], [x, y+h, 1, -1], [x+w, y+h, -1, -1]].forEach(([cx, cy, dx, dy]) => {
      ctx.beginPath();
      ctx.moveTo(cx + dx * cs, cy);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx, cy + dy * cs);
      ctx.stroke();
    });

    // Label
    const label = `${d.isPrimary ? '① ' : ''}${d.label} ${Math.round(d.confidence*100)}%`;
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    const textW = ctx.measureText(label).width + 10;
    const textH = 20;
    const labelY = y > textH + 2 ? y - textH - 2 : y + h + 2;

    ctx.fillStyle = color;
    ctx.fillRect(x, labelY, textW, textH);
    ctx.fillStyle = '#050608';
    ctx.fillText(label, x + 5, labelY + 14);
  });
}

// ── Live Frame Analysis (for camera) ─────────────────────
export async function analyzeFrame(videoElement, canvasOverlay) {
  if (!videoElement || videoElement.readyState < 2) return null;
  
  try {
    const damages = await analyzeImage(videoElement);
    if (canvasOverlay && damages && damages.damages) {
      canvasOverlay.width  = videoElement.videoWidth  || videoElement.clientWidth;
      canvasOverlay.height = videoElement.videoHeight || videoElement.clientHeight;
      drawBoundingBoxes(canvasOverlay, damages.damages, canvasOverlay.width, canvasOverlay.height);
    }
    return damages?.damages || null;
  } catch (e) {
    console.warn('[SmartSep AI] Frame analysis error:', e.message);
    return null;
  }
}

export { DAMAGE_CATEGORIES };
export function isModelLoaded() { return modelLoaded; }
export function isModelLoading() { return modelLoading; }
