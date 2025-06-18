// JavaScript для функциональности drag&drop и предпросмотра изображений в админке

document.addEventListener('DOMContentLoaded', function() {
    // Инициализация для всех полей загрузки изображений
    initializeImageFields();
    
    // Переинициализация при добавлении новых inline форм
    document.addEventListener('click', function(e) {
        if (e.target && e.target.classList.contains('add-row')) {
            setTimeout(initializeImageFields, 100);
        }
    });
});

function initializeImageFields() {
    const imageFields = document.querySelectorAll('input[type="file"][accept*="image"]');
    
    imageFields.forEach(function(field) {
        if (field.dataset.initialized) return;
        field.dataset.initialized = 'true';
        
        setupImagePreview(field);
        setupDragAndDrop(field);
    });
}

function setupImagePreview(fileInput) {
    const container = fileInput.closest('.field-image, .form-row');
    if (!container) return;
    
    // Создаем контейнер для предпросмотра
    let previewContainer = container.querySelector('.carimage-preview-container');
    if (!previewContainer) {
        previewContainer = document.createElement('div');
        previewContainer.className = 'carimage-preview-container';
        fileInput.parentNode.appendChild(previewContainer);
    }
    
    // Создаем элемент изображения для предпросмотра
    let previewImg = previewContainer.querySelector('.carimage-preview');
    if (!previewImg) {
        previewImg = document.createElement('img');
        previewImg.className = 'carimage-preview';
        previewImg.alt = 'Предпросмотр изображения';
        previewContainer.appendChild(previewImg);
    }
    
    // Показываем существующее изображение при загрузке страницы
    const existingImageLink = container.querySelector('a[href*="/media/"]');
    if (existingImageLink && !previewImg.src) {
        previewImg.src = existingImageLink.href;
        previewImg.classList.add('show');
    }
    
    // Обработчик изменения файла
    fileInput.addEventListener('change', function() {
        handleFileSelect(this, previewImg);
    });
}

function setupDragAndDrop(fileInput) {
    const container = fileInput.closest('.field-image, .form-row');
    if (!container) return;
    
    // Создаем зону drag&drop
    let dropZone = container.querySelector('.carimage-drop-zone');
    if (!dropZone) {
        dropZone = document.createElement('div');
        dropZone.className = 'carimage-drop-zone';
        dropZone.innerHTML = `
            <div class="drop-icon">📁</div>
            <p>Перетащите изображение сюда или <strong>нажмите для выбора</strong></p>
            <p style="font-size: 12px; margin-top: 5px;">Поддерживаются: JPEG, PNG, GIF (до 5MB)</p>
        `;
        
        // Перемещаем input внутрь dropZone
        dropZone.appendChild(fileInput);
        container.appendChild(dropZone);
    }
    
    // Обработчики drag&drop
    dropZone.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.add('dragover');
    });
    
    dropZone.addEventListener('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.remove('dragover');
    });
    
    dropZone.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleDroppedFiles(fileInput, files);
        }
    });
    
    // Клик по зоне для открытия диалога выбора файла
    dropZone.addEventListener('click', function(e) {
        if (e.target !== fileInput) {
            fileInput.click();
        }
    });
}

function handleFileSelect(fileInput, previewImg) {
    const file = fileInput.files[0];
    if (!file) {
        previewImg.classList.remove('show');
        clearFileInfo(fileInput);
        return;
    }
    
    if (!validateFile(file, fileInput)) {
        fileInput.value = '';
        previewImg.classList.remove('show');
        return;
    }
    
    // Показываем предпросмотр
    const reader = new FileReader();
    reader.onload = function(e) {
        previewImg.src = e.target.result;
        previewImg.classList.add('show');
    };
    reader.readAsDataURL(file);
    
    showFileInfo(fileInput, file);
}

function handleDroppedFiles(fileInput, files) {
    if (files.length === 0) return;
    
    const file = files[0]; // Берем только первый файл
    
    if (!validateFile(file, fileInput)) {
        return;
    }
    
    // Создаем новый FileList с выбранным файлом
    const dt = new DataTransfer();
    dt.items.add(file);
    fileInput.files = dt.files;
    
    // Запускаем обработку как при обычном выборе файла
    const event = new Event('change', { bubbles: true });
    fileInput.dispatchEvent(event);
}

function validateFile(file, fileInput) {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    
    clearFileInfo(fileInput);
    
    if (!allowedTypes.includes(file.type)) {
        showError(fileInput, 'Неподдерживаемый тип файла. Разрешены: JPEG, PNG, GIF');
        return false;
    }
    
    if (file.size > maxSize) {
        showError(fileInput, 'Файл слишком большой. Максимальный размер: 5MB');
        return false;
    }
    
    return true;
}

function showFileInfo(fileInput, file) {
    const container = fileInput.closest('.carimage-drop-zone, .form-row');
    if (!container) return;
    
    clearFileInfo(fileInput);
    
    const infoDiv = document.createElement('div');
    infoDiv.className = 'carimage-file-info';
    infoDiv.innerHTML = `
        <strong>Выбран файл:</strong> ${file.name}<br>
        <strong>Размер:</strong> ${formatFileSize(file.size)}<br>
        <strong>Тип:</strong> ${file.type}
    `;
    
    container.appendChild(infoDiv);
}

function showError(fileInput, message) {
    const container = fileInput.closest('.carimage-drop-zone, .form-row');
    if (!container) return;
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'carimage-error';
    errorDiv.textContent = message;
    
    container.appendChild(errorDiv);
}

function clearFileInfo(fileInput) {
    const container = fileInput.closest('.carimage-drop-zone, .form-row');
    if (!container) return;
    
    const existingInfo = container.querySelectorAll('.carimage-file-info, .carimage-error');
    existingInfo.forEach(el => el.remove());
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Для множественной загрузки (если понадобится в будущем)
function setupMultiplePreview(fileInput) {
    fileInput.addEventListener('change', function() {
        const container = this.closest('.form-row');
        if (!container) return;
        
        let previewContainer = container.querySelector('.carimage-multiple-preview');
        if (!previewContainer) {
            previewContainer = document.createElement('div');
            previewContainer.className = 'carimage-multiple-preview';
            container.appendChild(previewContainer);
        }
        
        previewContainer.innerHTML = '';
        
        Array.from(this.files).forEach(function(file) {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.title = file.name;
                    previewContainer.appendChild(img);
                };
                reader.readAsDataURL(file);
            }
        });
    });
} 