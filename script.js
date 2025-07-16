(function() {
            document.addEventListener('contextmenu', function(e) {
                e.preventDefault();
            });

            document.addEventListener('keydown', function(e) {
                if (e.keyCode === 123 || 
                    (e.ctrlKey && e.shiftKey && e.keyCode === 73) || 
                    (e.ctrlKey && e.shiftKey && e.keyCode === 74) || 
                    (e.ctrlKey && e.keyCode === 85)) {
                    e.preventDefault();
                }
            });
        })();

        // Global variables
        let uploadedImages = [];
        let processedCount = 0;
        let currentTool = 'compression';
        let cropData = null;
        let originalImage = null;
        let selectedFormat = 'jpg';

        // Navigation
        function showTool(tool) {
            currentTool = tool;
            
            document.querySelectorAll('.tool-section').forEach(section => {
                section.classList.remove('active');
            });
            
            document.getElementById(tool).classList.add('active');
            
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Close dropdown if open
            document.getElementById('dropdown-content').classList.remove('show');
            
            // Find and activate the correct nav item
            const navItems = document.querySelectorAll('.nav-item');
            navItems.forEach(item => {
                if (item.textContent.includes(getToolName(tool))) {
                    item.classList.add('active');
                }
            });
        }

        function getToolName(tool) {
            const names = {
                'compression': 'Compression',
                'crop': 'Crop',
                'converter': 'Convert',
                'palette': 'Palette',
                'qr': 'QR Code',
                'resize': 'Resize',
                'text2image': 'Text2Image',
                'base64': 'Base64'
            };
            return names[tool] || tool;
        }

        function toggleDropdown() {
            const dropdown = document.getElementById('dropdown-content');
            dropdown.classList.toggle('show');
        }

        function toggleMobileMenu() {
            const menu = document.getElementById('mobileMenu');
            menu.classList.toggle('hidden');
        }

        // Close dropdown when clicking outside
        window.onclick = function(event) {
            if (!event.target.matches('.dropdown button')) {
                const dropdowns = document.getElementsByClassName('dropdown-content');
                for (let i = 0; i < dropdowns.length; i++) {
                    const openDropdown = dropdowns[i];
                    if (openDropdown.classList.contains('show')) {
                        openDropdown.classList.remove('show');
                    }
                }
            }
        }

        // Image Compression Tool
        document.getElementById('compressionInput').addEventListener('change', function(e) {
            const files = Array.from(e.target.files).slice(0, 6);
            uploadedImages = [];
            
            files.forEach((file, index) => {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const imageData = {
                        id: Date.now() + index,
                        file: file,
                        preview: e.target.result,
                        originalSize: file.size,
                        processed: false,
                        compressed: null,
                        quality: 80
                    };
                    uploadedImages.push(imageData);
                    
                    if (uploadedImages.length === files.length) {
                        renderCompressionGrid();
                        updateCompressionStats();
                    }
                };
                reader.readAsDataURL(file);
            });
        });

        function renderCompressionGrid() {
            const grid = document.getElementById('compressionGrid');
            grid.innerHTML = '';
            
            uploadedImages.forEach(image => {
                const card = document.createElement('div');
                card.className = 'tool-card rounded-lg p-4';
                card.innerHTML = `
                    <div class="relative">
                        <img src="${image.preview}" alt="Image" class="w-full h-48 object-cover rounded-lg mb-4">
                        <button onclick="removeImage(${image.id})" class="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="text-gray-700 text-sm mb-2">
                        Size: ${formatFileSize(image.originalSize)}
                        ${image.processed ? `→ ${formatFileSize(image.compressed.size)} (${Math.round((1 - image.compressed.size / image.originalSize) * 100)}% saved)` : ''}
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-700 mb-2">Quality: <span class="quality-value">${image.quality}</span>%</label>
                        <input type="range" min="10" max="100" value="${image.quality}" class="w-full" onchange="updateQuality(${image.id}, this.value)">
                    </div>
                    <div class="flex gap-2">
                        <button onclick="compressImage(${image.id})" class="btn-primary hover:bg-blue-700 flex-1 text-white py-2 rounded-lg text-sm transition-colors">
                            <i class="fas fa-compress-alt mr-1"></i>Compress
                        </button>
                        <button onclick="downloadImage(${image.id})" class="btn-success hover:bg-green-700 flex-1 text-white py-2 rounded-lg text-sm transition-colors ${!image.processed ? 'opacity-50 cursor-not-allowed' : ''}" ${!image.processed ? 'disabled' : ''}>
                            <i class="fas fa-download mr-1"></i>Download
                        </button>
                    </div>
                `;
                grid.appendChild(card);
            });
        }

        function updateQuality(id, quality) {
            const image = uploadedImages.find(img => img.id === id);
            if (image) {
                image.quality = parseInt(quality);
                document.querySelector(`[onchange="updateQuality(${id}, this.value)"]`).parentElement.querySelector('.quality-value').textContent = quality;
            }
        }

        function compressImage(id) {
            const image = uploadedImages.find(img => img.id === id);
            if (!image) return;
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = function() {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                canvas.toBlob(function(blob) {
                    image.compressed = blob;
                    image.processed = true;
                    processedCount++;
                    renderCompressionGrid();
                    updateCompressionStats();
                }, 'image/jpeg', image.quality / 100);
            };
            
            img.src = image.preview;
        }

        function downloadImage(id) {
            const image = uploadedImages.find(img => img.id === id);
            if (!image || !image.processed) return;
            
            const url = URL.createObjectURL(image.compressed);
            const a = document.createElement('a');
            a.href = url;
            a.download = `compressed-${image.file.name}`;
            a.click();
            URL.revokeObjectURL(url);
        }

        function removeImage(id) {
            uploadedImages = uploadedImages.filter(img => img.id !== id);
            renderCompressionGrid();
            updateCompressionStats();
        }

        function updateCompressionStats() {
            document.getElementById('totalFiles').textContent = uploadedImages.length;
            document.getElementById('processedFiles').textContent = uploadedImages.filter(img => img.processed).length;
            
            const totalOriginal = uploadedImages.reduce((sum, img) => sum + img.originalSize, 0);
            const totalCompressed = uploadedImages.filter(img => img.processed).reduce((sum, img) => sum + img.compressed.size, 0);
            const savedPercentage = totalOriginal > 0 ? Math.round((1 - totalCompressed / totalOriginal) * 100) : 0;
            document.getElementById('totalSaved').textContent = savedPercentage + '%';
            
            document.getElementById('compressAllBtn').disabled = uploadedImages.length === 0;
            document.getElementById('downloadAllBtn').disabled = uploadedImages.filter(img => img.processed).length === 0;
            document.getElementById('clearAllBtn').disabled = uploadedImages.length === 0;
        }

        // Batch operations
        document.getElementById('compressAllBtn').addEventListener('click', function() {
            let processed = 0;
            const total = uploadedImages.filter(img => !img.processed).length;
            
            if (total > 0) {
                document.getElementById('compressionProgress').classList.remove('hidden');
                
                uploadedImages.forEach(image => {
                    if (!image.processed) {
                        setTimeout(() => {
                            compressImage(image.id);
                            processed++;
                            const progress = (processed / total) * 100;
                            document.getElementById('progressFill').style.width = progress + '%';
                            document.getElementById('progressText').textContent = Math.round(progress) + '%';
                            
                            if (processed === total) {
                                setTimeout(() => {
                                    document.getElementById('compressionProgress').classList.add('hidden');
                                }, 1000);
                            }
                        }, processed * 200);
                    }
                });
            }
        });

        document.getElementById('downloadAllBtn').addEventListener('click', function() {
            uploadedImages.filter(img => img.processed).forEach(image => {
                downloadImage(image.id);
            });
        });

        document.getElementById('clearAllBtn').addEventListener('click', function() {
            uploadedImages = [];
            processedCount = 0;
            renderCompressionGrid();
            updateCompressionStats();
            document.getElementById('compressionInput').value = '';
        });

        // Image Crop Tool
        document.getElementById('cropInput').addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    originalImage = img;
                    setupCropCanvas(img);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });

        function setupCropCanvas(img) {
            const canvas = document.getElementById('cropCanvas');
            const ctx = canvas.getContext('2d');
            
            const maxWidth = 600;
            const maxHeight = 400;
            let { width, height } = img;
            
            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width *= ratio;
                height *= ratio;
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            document.getElementById('cropCanvasContainer').classList.remove('hidden');
            document.getElementById('cropBtn').disabled = false;
            document.getElementById('resetCropBtn').disabled = false;
            
            cropData = {
                x: width * 0.1,
                y: height * 0.1,
                width: width * 0.8,
                height: height * 0.8,
                canvasWidth: width,
                canvasHeight: height
            };
            
            drawCropArea();
            setupCropInteraction();
        }

        function drawCropArea() {
            const canvas = document.getElementById('cropCanvas');
            const ctx = canvas.getContext('2d');
            
            ctx.drawImage(originalImage, 0, 0, cropData.canvasWidth, cropData.canvasHeight);
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.clearRect(cropData.x, cropData.y, cropData.width, cropData.height);
            ctx.drawImage(originalImage, 
                cropData.x * (originalImage.width / cropData.canvasWidth),
                cropData.y * (originalImage.height / cropData.canvasHeight),
                cropData.width * (originalImage.width / cropData.canvasWidth),
                cropData.height * (originalImage.height / cropData.canvasHeight),
                cropData.x, cropData.y, cropData.width, cropData.height);
            
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2;
            ctx.strokeRect(cropData.x, cropData.y, cropData.width, cropData.height);
            
            document.getElementById('widthSlider').value = cropData.width;
            document.getElementById('heightSlider').value = cropData.height;
            document.getElementById('cropWidth').textContent = Math.round(cropData.width);
            document.getElementById('cropHeight').textContent = Math.round(cropData.height);
        }

        function setupCropInteraction() {
            const canvas = document.getElementById('cropCanvas');
            let isDragging = false;
            let startX, startY;
            
            canvas.addEventListener('mousedown', function(e) {
                const rect = canvas.getBoundingClientRect();
                startX = e.clientX - rect.left;
                startY = e.clientY - rect.top;
                
                if (startX >= cropData.x && startX <= cropData.x + cropData.width &&
                    startY >= cropData.y && startY <= cropData.y + cropData.height) {
                    isDragging = true;
                }
            });
            
            canvas.addEventListener('mousemove', function(e) {
                if (!isDragging) return;
                
                const rect = canvas.getBoundingClientRect();
                const currentX = e.clientX - rect.left;
                const currentY = e.clientY - rect.top;
                
                const deltaX = currentX - startX;
                const deltaY = currentY - startY;
                
                cropData.x = Math.max(0, Math.min(cropData.canvasWidth - cropData.width, cropData.x + deltaX));
                cropData.y = Math.max(0, Math.min(cropData.canvasHeight - cropData.height, cropData.y + deltaY));
                
                startX = currentX;
                startY = currentY;
                
                drawCropArea();
            });
            
            canvas.addEventListener('mouseup', function() {
                isDragging = false;
            });
        }

        // Crop controls
        document.getElementById('widthSlider').addEventListener('input', function() {
            cropData.width = Math.min(parseInt(this.value), cropData.canvasWidth - cropData.x);
            drawCropArea();
        });

        document.getElementById('heightSlider').addEventListener('input', function() {
            cropData.height = Math.min(parseInt(this.value), cropData.canvasHeight - cropData.y);
            drawCropArea();
        });

        document.getElementById('aspectRatio').addEventListener('change', function() {
            const ratio = this.value;
            if (ratio !== 'free') {
                const [w, h] = ratio.split(':').map(Number);
                const aspectRatio = w / h;
                cropData.height = cropData.width / aspectRatio;
                drawCropArea();
            }
        });

        document.getElementById('cropBtn').addEventListener('click', function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = cropData.width * (originalImage.width / cropData.canvasWidth);
            canvas.height = cropData.height * (originalImage.height / cropData.canvasHeight);
            
            ctx.drawImage(originalImage,
                cropData.x * (originalImage.width / cropData.canvasWidth),
                cropData.y * (originalImage.height / cropData.canvasHeight),
                canvas.width, canvas.height,
                0, 0, canvas.width, canvas.height);
            
            canvas.toBlob(function(blob) {
                const url = URL.createObjectURL(blob);
                const link = document.getElementById('downloadCropBtn');
                link.onclick = function() {
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'cropped-image.png';
                    a.click();
                };
                link.disabled = false;
            });
        });

        document.getElementById('resetCropBtn').addEventListener('click', function() {
            if (originalImage) {
                setupCropCanvas(originalImage);
            }
        });

        // Format Converter - Improved
        document.getElementById('converterInput').addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    document.getElementById('convertBtn').disabled = false;
                    document.getElementById('convertBtn').onclick = function() {
                        convertImage(img, file.name, file.size);
                    };
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });

        // Format selection
        document.querySelectorAll('.format-option').forEach(option => {
            option.addEventListener('click', function() {
                document.querySelectorAll('.format-option').forEach(opt => opt.classList.remove('selected'));
                this.classList.add('selected');
                selectedFormat = this.dataset.format;
                
                // Show/hide quality slider based on format
                const qualityContainer = document.getElementById('qualityContainer');
                if (selectedFormat === 'png' || selectedFormat === 'gif') {
                    qualityContainer.style.display = 'none';
                } else {
                    qualityContainer.style.display = 'block';
                }
            });
        });

        // Quality slider
        document.getElementById('qualitySlider').addEventListener('input', function() {
            const quality = this.value;
            document.getElementById('convertQuality').textContent = quality;
            
            const indicator = document.getElementById('qualityIndicator');
            const label = document.getElementById('qualityLabel');
            
            indicator.className = 'quality-indicator ';
            if (quality >= 80) {
                indicator.classList.add('quality-high');
                label.textContent = 'High Quality';
            } else if (quality >= 50) {
                indicator.classList.add('quality-medium');
                label.textContent = 'Medium Quality';
            } else {
                indicator.classList.add('quality-low');
                label.textContent = 'Low Quality';
            }
        });

        // Resize option
        document.getElementById('resizeOption').addEventListener('change', function() {
            const customContainer = document.getElementById('customSizeContainer');
            if (this.value === 'custom') {
                customContainer.classList.remove('hidden');
            } else {
                customContainer.classList.add('hidden');
            }
        });

        function convertImage(img, filename, originalSize) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const format = selectedFormat;
            const quality = document.getElementById('qualitySlider').value / 100;
            const resizeOption = document.getElementById('resizeOption').value;
            
            let width = img.width;
            let height = img.height;
            
            // Apply resize
            if (resizeOption !== 'none') {
                if (resizeOption === 'custom') {
                    const maxWidth = parseInt(document.getElementById('maxWidth').value);
                    if (maxWidth && width > maxWidth) {
                        const ratio = maxWidth / width;
                        width = maxWidth;
                        height = height * ratio;
                    }
                } else {
                    const scale = parseInt(resizeOption) / 100;
                    width *= scale;
                    height *= scale;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            const mimeType = format === 'jpg' ? 'image/jpeg' : `image/${format}`;
            
            canvas.toBlob(function(blob) {
                const url = URL.createObjectURL(blob);
                const preview = document.getElementById('convertPreview');
                preview.innerHTML = `<img src="${url}" alt="Converted" class="image-preview">`;
                
                // Show conversion stats
                const stats = document.getElementById('conversionStats');
                const compressionRatio = ((1 - blob.size / originalSize) * 100).toFixed(1);
                stats.innerHTML = `
                    <div>Original Size: ${formatFileSize(originalSize)}</div>
                    <div>Converted Size: ${formatFileSize(blob.size)}</div>
                    <div>Compression: ${compressionRatio}%</div>
                    <div>Dimensions: ${width}x${height}px</div>
                    <div>Format: ${format.toUpperCase()}</div>
                `;
                
                document.getElementById('convertInfo').classList.remove('hidden');
                document.getElementById('convertActions').classList.remove('hidden');
                
                document.getElementById('downloadConvertBtn').onclick = function() {
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `converted-${filename.split('.')[0]}.${format}`;
                    a.click();
                };
            }, mimeType, quality);
        }

        // Color Palette Extractor
        document.getElementById('paletteInput').addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = document.getElementById('paletteImage');
                img.src = e.target.result;
                document.getElementById('paletteImagePreview').classList.remove('hidden');
                document.getElementById('extractColorsBtn').disabled = false;
            };
            reader.readAsDataURL(file);
        });

        document.getElementById('colorCountSlider').addEventListener('input', function() {
            document.getElementById('colorCount').textContent = this.value;
        });

        document.getElementById('extractColorsBtn').addEventListener('click', function() {
            const img = document.getElementById('paletteImage');
            const colorCount = parseInt(document.getElementById('colorCountSlider').value);
            extractColors(img, colorCount);
        });

        function extractColors(img, count) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pixels = imageData.data;
            
            const colors = [];
            for (let i = 0; i < pixels.length; i += 4) {
                const r = pixels[i];
                const g = pixels[i + 1];
                const b = pixels[i + 2];
                const a = pixels[i + 3];
                
                if (a > 0) {
                    colors.push([r, g, b]);
                }
            }
            
            const dominantColors = getDominantColors(colors, count);
            displayColorPalette(dominantColors);
        }

        function getDominantColors(colors, count) {
            const colorCounts = {};
            
            colors.forEach(color => {
                const key = `${Math.floor(color[0] / 10) * 10}-${Math.floor(color[1] / 10) * 10}-${Math.floor(color[2] / 10) * 10}`;
                colorCounts[key] = (colorCounts[key] || 0) + 1;
            });
            
            const sortedColors = Object.entries(colorCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, count)
                .map(([key]) => {
                    const [r, g, b] = key.split('-').map(Number);
                    return [r, g, b];
                });
            
            return sortedColors;
        }

        function displayColorPalette(colors) {
            const grid = document.getElementById('colorGrid');
            const details = document.getElementById('colorDetails');
            
            grid.innerHTML = '';
            details.innerHTML = '';
            
            colors.forEach((color, index) => {
                const [r, g, b] = color;
                const hex = rgbToHex(r, g, b);
                
                const colorBox = document.createElement('div');
                colorBox.className = 'color-box';
                colorBox.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
                colorBox.onclick = function() {
                    navigator.clipboard.writeText(hex);
                    alert(`Color ${hex} copied to clipboard!`);
                };
                grid.appendChild(colorBox);
                
                const colorDetail = document.createElement('div');
                colorDetail.className = 'flex justify-between items-center p-2 bg-gray-100 rounded';
                colorDetail.innerHTML = `
                    <span class="font-mono text-sm">${hex}</span>
                    <span class="text-sm text-gray-600">rgb(${r}, ${g}, ${b})</span>
                `;
                details.appendChild(colorDetail);
            });
            
            document.getElementById('colorPalette').classList.remove('hidden');
        }

        function rgbToHex(r, g, b) {
            return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        }

        // QR Code Generator - Fixed
        document.getElementById('qrContent').addEventListener('input', function() {
            document.getElementById('generateQRBtn').disabled = this.value.trim() === '';
        });

        document.getElementById('generateQRBtn').addEventListener('click', function() {
            const content = document.getElementById('qrContent').value;
            const size = parseInt(document.getElementById('qrSize').value);
            const errorLevel = document.getElementById('qrErrorLevel').value;
            const color = document.getElementById('qrColor').value;
            const background = document.getElementById('qrBackground').value;
            
            generateQRCode(content, size, errorLevel, color, background);
        });

        function generateQRCode(content, size, errorLevel, color, background) {
            const canvas = document.createElement('canvas');
            
            // Enhanced QR code generation with proper error handling
            try {
                QRCode.toCanvas(canvas, content, {
                    width: size,
                    height: size,
                    errorCorrectionLevel: errorLevel,
                    color: {
                        dark: color,
                        light: background
                    },
                    margin: 2
                }, function(error) {
                    if (error) {
                        console.error('QR Code generation error:', error);
                        alert('Error generating QR code. Please try again.');
                        return;
                    }
                    
                    const preview = document.getElementById('qrPreview');
                    preview.innerHTML = '';
                    preview.appendChild(canvas);
                    
                    document.getElementById('qrActions').classList.remove('hidden');
                    document.getElementById('downloadQRBtn').onclick = function() {
                        canvas.toBlob(function(blob) {
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'qrcode.png';
                            a.click();
                            URL.revokeObjectURL(url);
                        });
                    };
                });
            } catch (error) {
                console.error('QR Code error:', error);
                alert('Error generating QR code. Please check your input.');
            }
        }

        // Image Resizer
        document.getElementById('resizeInput').addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    document.getElementById('resizeWidth').value = img.width;
                    document.getElementById('resizeHeight').value = img.height;
                    document.getElementById('resizeBtn').disabled = false;
                    document.getElementById('resizeBtn').onclick = function() {
                        resizeImage(img, file.name);
                    };
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });

        document.getElementById('presetSizes').addEventListener('change', function() {
            if (this.value) {
                const [width, height] = this.value.split('x').map(Number);
                document.getElementById('resizeWidth').value = width;
                document.getElementById('resizeHeight').value = height;
            }
        });

        document.getElementById('resizeWidth').addEventListener('input', function() {
            if (document.getElementById('maintainAspect').checked) {
                const img = new Image();
                img.onload = function() {
                    const aspectRatio = img.width / img.height;
                    const newWidth = parseInt(document.getElementById('resizeWidth').value);
                    document.getElementById('resizeHeight').value = Math.round(newWidth / aspectRatio);
                };
                const file = document.getElementById('resizeInput').files[0];
                if (file) {
                    img.src = URL.createObjectURL(file);
                }
            }
        });

        function resizeImage(img, filename) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const newWidth = parseInt(document.getElementById('resizeWidth').value);
            const newHeight = parseInt(document.getElementById('resizeHeight').value);
            
            canvas.width = newWidth;
            canvas.height = newHeight;
            ctx.drawImage(img, 0, 0, newWidth, newHeight);
            
            canvas.toBlob(function(blob) {
                const url = URL.createObjectURL(blob);
                const preview = document.getElementById('resizePreview');
                preview.innerHTML = `<img src="${url}" alt="Resized" class="image-preview">`;
                
                document.getElementById('resizeInfo').classList.remove('hidden');
                document.getElementById('resizeInfo').innerHTML = `
                    Original: ${img.width}x${img.height} | 
                    Resized: ${newWidth}x${newHeight} | 
                    Size: ${formatFileSize(blob.size)}
                `;
                
                document.getElementById('resizeActions').classList.remove('hidden');
                document.getElementById('downloadResizeBtn').onclick = function() {
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `resized-${filename}`;
                    a.click();
                };
            });
        }

        // Text to Image
        document.getElementById('textContent').addEventListener('input', function() {
            document.getElementById('generateTextBtn').disabled = this.value.trim() === '';
        });

        document.getElementById('generateTextBtn').addEventListener('click', function() {
            const text = document.getElementById('textContent').value;
            const fontSize = parseInt(document.getElementById('fontSize').value);
            const fontFamily = document.getElementById('fontFamily').value;
            const textColor = document.getElementById('textColor').value;
            const bgColor = document.getElementById('bgColor').value;
            const textAlign = document.getElementById('textAlign').value;
            
            generateTextImage(text, fontSize, fontFamily, textColor, bgColor, textAlign);
        });

        function generateTextImage(text, fontSize, fontFamily, textColor, bgColor, textAlign) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            ctx.font = `${fontSize}px ${fontFamily}`;
            const textMetrics = ctx.measureText(text);
            const textWidth = textMetrics.width;
            const textHeight = fontSize;
            
            canvas.width = Math.max(textWidth + 40, 300);
            canvas.height = Math.max(textHeight + 40, 100);
            
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = textColor;
            ctx.font = `${fontSize}px ${fontFamily}`;
            ctx.textBaseline = 'middle';
            
            let x;
            switch (textAlign) {
                case 'center':
                    x = canvas.width / 2;
                    ctx.textAlign = 'center';
                    break;
                case 'right':
                    x = canvas.width - 20;
                    ctx.textAlign = 'right';
                    break;
                default:
                    x = 20;
                    ctx.textAlign = 'left';
            }
            
            ctx.fillText(text, x, canvas.height / 2);
            
            canvas.toBlob(function(blob) {
                const url = URL.createObjectURL(blob);
                const preview = document.getElementById('textImagePreview');
                preview.innerHTML = `<img src="${url}" alt="Text Image" class="image-preview">`;
                
                document.getElementById('textImageActions').classList.remove('hidden');
                document.getElementById('downloadTextBtn').onclick = function() {
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'text-image.png';
                    a.click();
                };
            });
        }

        // Base64 Encoder/Decoder
        document.getElementById('base64Input').addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                const base64 = e.target.result;
                document.getElementById('base64Output').value = base64;
                document.getElementById('copyBase64Btn').disabled = false;
            };
            reader.readAsDataURL(file);
        });

        document.getElementById('copyBase64Btn').addEventListener('click', function() {
            const textarea = document.getElementById('base64Output');
            textarea.select();
            document.execCommand('copy');
            alert('Base64 copied to clipboard!');
        });

        document.getElementById('base64Input2').addEventListener('input', function() {
            document.getElementById('decodeBase64Btn').disabled = this.value.trim() === '';
        });

        document.getElementById('decodeBase64Btn').addEventListener('click', function() {
            const base64 = document.getElementById('base64Input2').value;
            
            try {
                const img = new Image();
                img.onload = function() {
                    const preview = document.getElementById('base64ImagePreview');
                    preview.innerHTML = `<img src="${base64}" alt="Decoded" class="image-preview">`;
                    
                    document.getElementById('base64ImageActions').classList.remove('hidden');
                    document.getElementById('downloadBase64Btn').onclick = function() {
                        const a = document.createElement('a');
                        a.href = base64;
                        a.download = 'decoded-image.png';
                        a.click();
                    };
                };
                img.onerror = function() {
                    alert('Invalid Base64 image data');
                };
                img.src = base64;
            } catch (error) {
                alert('Error decoding Base64: ' + error.message);
            }
        });

        // Utility functions
        function formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }

        // Initialize
        updateCompressionStats();
