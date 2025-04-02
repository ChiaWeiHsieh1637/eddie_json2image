function extractLinks(data) {
    const resultDiv = document.getElementById('result');
    const showCover = document.getElementById('showCover').checked;
    const showContent = document.getElementById('showContent').checked;
    
    resultDiv.innerHTML = '';

    try {
        if (!data.article || !Array.isArray(data.article)) {
            throw new Error('JSON 格式錯誤：找不到 article 陣列');
        }

        const links = [];

        // 遍歷每個文章
        data.article.forEach((article, index) => {
            // 提取封面圖片
            if (article.img && showCover) {
                links.push({
                    type: 'cover',
                    url: article.img,
                    articleIndex: index
                });
            }

            // 提取內文圖片
            if (article.content && showContent) {
                const imgRegex = /<img[^>]+src="([^"]+)"/g;
                let match;
                while ((match = imgRegex.exec(article.content)) !== null) {
                    links.push({
                        type: 'content',
                        url: match[1],
                        articleIndex: index
                    });
                }
            }
        });

        // 顯示結果
        if (links.length === 0) {
            resultDiv.innerHTML = '<div class="error">未找到任何符合條件的圖片連結</div>';
            return;
        }

        const uniqueLinks = Array.from(new Set(links.map(link => link.url)))
            .map(url => links.find(link => link.url === url));

        uniqueLinks.forEach((link, index) => {
            const linkElement = document.createElement('div');
            linkElement.className = 'link-item';
            
            // 創建基本信息
            const basicInfo = `
                <div class="type-badge ${link.type}">
                    ${link.type === 'cover' ? '封面圖片' : '內文圖片'}
                </div>
                <div><strong>文章索引：</strong>${link.articleIndex + 1}</div>
                <div><strong>連結：</strong><a href="${link.url}" target="_blank">${link.url}</a></div>
            `;

            // 創建圖片預覽區域
            const previewId = `preview-${index}`;
            const previewSection = `
                <div class="image-preview" id="${previewId}">
                    <img src="${link.url}" 
                         alt="圖片預覽" 
                         onerror="this.parentElement.innerHTML='<div class=\'preview-error\'>圖片載入失敗</div>'">
                </div>
            `;

            linkElement.innerHTML = basicInfo + previewSection;
            resultDiv.appendChild(linkElement);
        });

    } catch (error) {
        resultDiv.innerHTML = `<div class="error">錯誤：${error.message}</div>`;
    }
}

// 添加篩選器變更事件
document.getElementById('showCover').addEventListener('change', () => extractLinks(JSON.parse(document.getElementById('jsonInput').value)));
document.getElementById('showContent').addEventListener('change', () => extractLinks(JSON.parse(document.getElementById('jsonInput').value)));

// 添加示例 JSON 到 textarea
document.getElementById('jsonInput').value = JSON.stringify({
    article: [
        {
            img: "/school/oneFile?id=34",
            content: '<img src="https://cc.pressplay.cc/example.jpg">'
        }
    ]
}, null, 2);

// 切換輸入模式
document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', () => {
        // 更新按鈕狀態
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // 顯示對應的輸入區域
        document.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));
        document.getElementById(button.dataset.tab + 'Input').classList.remove('hidden');
    });
});

async function fetchWithTimeout(url, options = {}, timeout = 5000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        if (error.name === 'AbortError') {
            throw new Error('請求超時，請檢查網路連接或 API 響應時間');
        }
        throw error;
    }
}

function getProxyUrl(targetUrl) {
    const useProxy = document.getElementById('useProxy').checked;
    if (!useProxy) return targetUrl;

    const proxyType = document.getElementById('proxyType').value;
    switch (proxyType) {
        case 'cors-anywhere':
            return `https://cors-anywhere.herokuapp.com/${targetUrl}`;
        case 'custom':
            const customProxy = document.getElementById('customProxy').value.trim();
            return customProxy ? `${customProxy}${targetUrl}` : targetUrl;
        default:
            return targetUrl;
    }
}

async function processInput() {
    const button = document.getElementById('processButton');
    const buttonText = button.querySelector('.button-text');
    const loader = button.querySelector('.loader');
    const resultDiv = document.getElementById('result');
    
    try {
        buttonText.classList.add('hidden');
        loader.classList.remove('hidden');
        button.disabled = true;
        
        let jsonData;
        const isApiMode = document.querySelector('.tab-btn[data-tab="api"]').classList.contains('active');
        
        if (isApiMode) {
            const apiUrl = document.getElementById('apiUrl').value.trim();
            
            // URL 格式驗證
            try {
                new URL(apiUrl);
            } catch {
                throw new Error('請輸入有效的 URL 格式');
            }

            // 詳細的錯誤診斷
            try {
                const finalUrl = getProxyUrl(apiUrl);
                const response = await fetchWithTimeout(finalUrl, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    },
                    mode: 'cors' // 明確指定 CORS 模式
                });

                if (!response.ok) {
                    throw new Error(`API 響應錯誤 (${response.status}): ${response.statusText}`);
                }

                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    throw new Error('API 未返回 JSON 格式數據');
                }

                jsonData = await response.json();
                // 處理數據...
                
            } catch (error) {
                let errorMessage = '請求失敗: ';
                
                if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
                    errorMessage += `
                        <ul>
                            <li>請檢查 API 網址是否正確</li>
                            <li>確認 API 服務器是否在線</li>
                            <li>可能存在跨域 (CORS) 限制，建議：
                                <ul>
                                    <li>使用代理服務器</li>
                                    <li>確認 API 是否支持跨域訪問</li>
                                    <li>如果是本地測試，使用本地服務器而不是 file:// 協議</li>
                                </ul>
                            </li>
                        </ul>
                    `;
                } else {
                    errorMessage += error.message;
                }

                throw new Error(errorMessage);
            }
        } else {
            const jsonText = document.getElementById('jsonText').value.trim();
            if (!jsonText) throw new Error('請輸入 JSON 內容');
            jsonData = JSON.parse(jsonText);
        }
        
        // 使用現有的提取邏輯處理數據
        extractLinks(jsonData);
        
    } catch (error) {
        resultDiv.innerHTML = `
            <div class="error-message">
                <strong>錯誤：</strong>
                <div class="error-details">${error.message}</div>
                <div class="debug-info">
                    <strong>調試信息：</strong>
                    <ul>
                        <li>瀏覽器：${navigator.userAgent}</li>
                        <li>時間：${new Date().toLocaleString()}</li>
                    </ul>
                </div>
            </div>
        `;
    } finally {
        buttonText.classList.remove('hidden');
        loader.classList.add('hidden');
        button.disabled = false;
    }
} 