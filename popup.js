// 弹出窗口脚本 - 处理历史记录展示和交互

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
  // 获取DOM元素
  const historyList = document.getElementById('historyList');
  const emptyState = document.getElementById('emptyState');
  const searchBox = document.getElementById('searchBox');
  const clearBtn = document.getElementById('clearBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const copyToast = document.getElementById('copyToast');
  
  // 搜索词
  let searchTerm = '';
  let allHistory = [];
  
  // 加载历史记录
  loadHistory();
  
  // 搜索框输入事件
  searchBox.addEventListener('input', function() {
    searchTerm = this.value.toLowerCase();
    renderHistory();
  });
  
  // 移除过滤按钮点击事件处理
  
  // 清空按钮点击事件
  clearBtn.addEventListener('click', function() {
    if (confirm('确定要清空所有记录吗？')) {
      chrome.storage.local.set({inputHistory: []}, function() {
        allHistory = [];
        renderHistory();
      });
    }
  });
  
  // 设置按钮点击事件
  settingsBtn.addEventListener('click', function() {
    window.location.href = 'settings.html';
  });
  
  // 加载历史记录
  function loadHistory() {
    chrome.runtime.sendMessage({action: 'getHistory'}, function(response) {
      if (response && response.history) {
        allHistory = response.history;
        renderHistory();
      }
    });
  }
  
  // 渲染历史记录
  function renderHistory() {
    // 清空列表
    historyList.innerHTML = '';
    
    // 过滤历史记录
    let filteredHistory = allHistory.filter(item => {
      // 根据搜索词过滤
      const searchMatch = !searchTerm || item.text.toLowerCase().includes(searchTerm);
      return searchMatch;
    });
    
    // 显示空状态或历史记录
    if (filteredHistory.length === 0) {
      emptyState.style.display = 'block';
      historyList.style.display = 'none';
    } else {
      emptyState.style.display = 'none';
      historyList.style.display = 'block';
      
      // 渲染每条历史记录
      filteredHistory.forEach(item => {
        const li = document.createElement('li');
        li.className = 'history-item';
        li.dataset.text = item.text; // 存储文本用于复制
        
        // 格式化时间
        const date = new Date(item.timestamp);
        const formattedDate = formatDate(date);
        
        // 处理长文本，如果超过3行则截断
        const lines = item.text.split('\n');
        let displayText = '';
        let isLongText = false;
        
        if (lines.length > 3) {
          // 只显示前3行
          displayText = lines.slice(0, 3).join('\n');
          isLongText = true;
        } else if (item.text.length > 150) {
          // 如果没有换行但文本很长，也进行截断
          displayText = item.text.substring(0, 150);
          isLongText = true;
        } else {
          displayText = item.text;
        }
        
        // 设置HTML内容 - 内容和时间排列在一行
        li.innerHTML = `
          <div class="item-row">
            <div class="item-text">${escapeHtml(displayText)}${isLongText ? '<span class="text-ellipsis">...</span>' : ''}</div>
            <span class="item-time">${formattedDate}</span>
          </div>
          ${isLongText ? `<button class="show-more-btn" aria-label="显示更多内容">显示更多</button>` : ''}
        `;
        
        // 如果有长文本，添加显示更多按钮的点击事件
        if (isLongText) {
          const showMoreBtn = li.querySelector('.show-more-btn');
          showMoreBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // 阻止冒泡，避免触发复制
            const textElement = li.querySelector('.item-text');
            const ellipsis = li.querySelector('.text-ellipsis');
            
            if (this.textContent === '显示更多') {
              textElement.textContent = item.text;
              this.textContent = '收起';
              if (ellipsis) ellipsis.style.display = 'none';
            } else {
              textElement.textContent = displayText;
              this.textContent = '显示更多';
              if (ellipsis) ellipsis.style.display = 'inline';
            }
          });
        }

        
        // 点击复制文本
        li.addEventListener('click', function() {
          const text = this.dataset.text;
          copyToClipboard(text);
          showCopyToast();
        });
        
        historyList.appendChild(li);
      });
    }
  }
  
  // 格式化日期
  function formatDate(date) {
    const now = new Date();
    const diff = now - date;
    
    // 一分钟内 - 显示秒数
    if (diff < 60 * 1000) {
      const seconds = Math.floor(diff / 1000);
      return seconds + '秒前';
    }
    // 一小时内
    if (diff < 60 * 60 * 1000) {
      return Math.floor(diff / (60 * 1000)) + '分钟前';
    }
    // 一天内
    if (diff < 24 * 60 * 60 * 1000) {
      return Math.floor(diff / (60 * 60 * 1000)) + '小时前';
    }
    // 一周内
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      return Math.floor(diff / (24 * 60 * 60 * 1000)) + '天前';
    }
    
    // 其他情况显示完整日期
    return `${date.getFullYear()}-${padZero(date.getMonth() + 1)}-${padZero(date.getDate())} ${padZero(date.getHours())}:${padZero(date.getMinutes())}`;
  }
  
  // 数字补零
  function padZero(num) {
    return num < 10 ? '0' + num : num;
  }
  
  // 复制到剪贴板
  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).catch(err => {
      console.error('复制失败:', err);
    });
  }
  
  // 显示复制成功提示 - 使用更平滑的动画效果
  function showCopyToast() {
    copyToast.classList.add('visible');
    setTimeout(() => {
      copyToast.classList.remove('visible');
    }, 2000);
  }
  
  // HTML转义，防止XSS
  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});