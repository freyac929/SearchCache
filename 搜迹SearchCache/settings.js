// 设置页面脚本

document.addEventListener('DOMContentLoaded', function() {
  // 获取DOM元素
  const backBtn = document.getElementById('backBtn');
  const saveBtn = document.getElementById('saveBtn');
  const retentionPeriod = document.getElementById('retentionPeriod');
  const exportBtn = document.getElementById('exportBtn');
  const shortcutLink = document.getElementById('shortcutLink');
  const toast = document.getElementById('toast');
  
  // 加载保存的设置
  loadSettings();
  
  // 返回按钮点击事件
  backBtn.addEventListener('click', function() {
    window.location.href = 'popup.html';
  });
  
  // 保存按钮点击事件
  saveBtn.addEventListener('click', function() {
    saveSettings();
    toast.textContent = '设置已保存';
    showToast();
  });
  
  // 导出记录按钮点击事件
  exportBtn.addEventListener('click', function() {
    exportHistory();
  });
  
  // 快捷键链接处理
  shortcutLink.addEventListener('click', function(e) {
    // chrome:// URLs不能直接在链接中打开，需要特殊处理
    e.preventDefault();
    // 提示用户如何手动设置快捷键
    toast.textContent = '请在打开的扩展页面中找到"搜迹SearchCache"并设置快捷键';
    showToast();
    // 尝试打开Chrome扩展快捷键设置页面
    chrome.tabs.create({url: 'chrome://extensions/shortcuts'});
  });
  
  // 加载设置
  function loadSettings() {
    chrome.storage.local.get(['retentionPeriod'], function(result) {
      if (result.retentionPeriod !== undefined) {
        retentionPeriod.value = result.retentionPeriod;
      }
    });
  }
  
  // 保存设置
  function saveSettings() {
    const settings = {
      retentionPeriod: retentionPeriod.value
    };
    
    chrome.storage.local.set(settings, function() {
      console.log('设置已保存:', settings);
      
      // 清理过期数据
      cleanupExpiredData(settings.retentionPeriod);
    });
  }
  // 删除了第67行多余的右花括号
  
  // 清理过期数据
  function cleanupExpiredData(days) {
    chrome.storage.local.get(['inputHistory'], function(result) {
      if (!result.inputHistory || !result.inputHistory.length) return;
      
      const now = new Date();
      const cutoffDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
      
      const filteredHistory = result.inputHistory.filter(item => {
        const itemDate = new Date(item.timestamp);
        return itemDate >= cutoffDate;
      });
      
      if (filteredHistory.length !== result.inputHistory.length) {
        chrome.storage.local.set({inputHistory: filteredHistory}, function() {
          console.log(`已清理过期数据，删除了 ${result.inputHistory.length - filteredHistory.length} 条记录`);
        });
      }
    });
  }
  
  // 显示保存成功提示
  function showToast() {
    toast.classList.add('visible');
    setTimeout(() => {
      toast.classList.remove('visible');
    }, 2000);
  }
  
  // 导出记录为文本文件
  function exportHistory() {

    chrome.storage.local.get(['inputHistory'], function(result) {
      if (!result.inputHistory || !result.inputHistory.length) {
        toast.textContent = '没有可导出的记录';
        showToast();
        return;
      }
      
      // 格式化记录内容
      let content = '搜迹SearchCache - 搜索记录导出\n';
      content += '导出时间: ' + new Date().toLocaleString() + '\n\n';
      
      result.inputHistory.forEach((item, index) => {
        const date = new Date(item.timestamp).toLocaleString();
        content += `[${date}] ${item.text}\n`;
        if (item.url) {
          content += `来源: ${item.url}\n`;
        }
        content += '\n';
      });
      
      // 创建下载链接
      const blob = new Blob([content], {type: 'text/plain;charset=utf-8'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '搜迹SearchCache_记录_' + new Date().toISOString().slice(0, 10) + '.txt';
      document.body.appendChild(a);
      a.click();
      
      // 清理
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      toast.textContent = '导出成功';
      showToast();
    });
  }
}); // 修复了DOMContentLoaded事件监听器的闭合括号

