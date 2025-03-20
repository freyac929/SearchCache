// 背景脚本 - 管理插件的核心功能

// 导入快捷键管理脚本
importScripts('commands.js');

// 初始化存储
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['inputHistory', 'retentionPeriod'], function(result) {
    if (!result.inputHistory) {
      chrome.storage.local.set({inputHistory: []});
      console.log('输入历史记录已初始化');
    } else {
      console.log('已有输入历史记录，数量:', result.inputHistory.length);
      
      // 清理过期数据
      cleanupExpiredData(result.retentionPeriod);
    }
    
    // 如果没有设置保存周期，则初始化为1天
    if (result.retentionPeriod === undefined) {
      chrome.storage.local.set({retentionPeriod: '1'});
    }
  });
  console.log('插件已安装/更新，初始化完成');
});

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

// 监听快捷键命令
chrome.commands.onCommand.addListener((command) => {
  console.log('快捷键命令被触发:', command);
  if (command === "_execute_action") {
    console.log('执行_execute_action命令');
    // 打开扩展的弹出窗口 - 使用更可靠的方法
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      console.log('当前活动标签页:', tabs && tabs.length > 0 ? tabs[0].url : '未知');
      
      // 使用chrome.action.setBadgeText来触发用户注意
      chrome.action.setBadgeText({text: "!"}, () => {
        if (chrome.runtime.lastError) {
          console.error('设置徽章文本失败:', chrome.runtime.lastError);
        } else {
          console.log('徽章文本设置成功');
        }
      });
      
      chrome.action.setBadgeBackgroundColor({color: "#FF0000"}, () => {
        if (chrome.runtime.lastError) {
          console.error('设置徽章背景色失败:', chrome.runtime.lastError);
        } else {
          console.log('徽章背景色设置成功');
        }
      });
      
      // 2秒后清除徽章
      setTimeout(() => {
        chrome.action.setBadgeText({text: ""});
        console.log('徽章文本已清除');
      }, 2000);
      
      // 尝试使用多种方法打开弹出窗口
      try {
        console.log('尝试使用chrome.action.openPopup()方法');
        chrome.action.openPopup();
        console.log('chrome.action.openPopup()调用成功');
      } catch (error) {
        console.error('无法使用openPopup方法:', error);
        
        // 备用方法：尝试使用chrome.windows.create创建一个小窗口
        try {
          console.log('尝试使用备用方法打开弹出窗口');
          const popupURL = chrome.runtime.getURL('popup.html');
          console.log('弹出窗口URL:', popupURL);
          
          chrome.windows.create({
            url: popupURL,
            type: 'popup',
            width: 400,
            height: 600
          }, (window) => {
            if (chrome.runtime.lastError) {
              console.error('创建弹出窗口失败:', chrome.runtime.lastError);
            } else {
              console.log('成功创建弹出窗口:', window);
            }
          });
        } catch (backupError) {
          console.error('备用方法也失败了:', backupError);
        }
      }
    });
  }
});

// 添加快捷键初始化日志
console.log('快捷键监听器已设置，等待Alt+S触发');

// 检查快捷键是否已注册
chrome.commands.getAll((commands) => {
  console.log('已注册的命令:', commands);
  const executeActionCommand = commands.find(cmd => cmd.name === '_execute_action');
  if (executeActionCommand) {
    console.log('_execute_action命令已注册，快捷键:', executeActionCommand.shortcut || '未设置');
  } else {
    console.warn('未找到_execute_action命令');
  }
});

// 监听来自内容脚本的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('收到消息:', message, '来自:', sender.tab ? sender.tab.url : '未知来源');
  
  if (message.action === 'saveInput') {
    console.log('处理保存输入请求:', message.data);
    saveInputContent(message.data);
    sendResponse({status: 'success'});
    return true; // 异步响应需要返回true
  } else if (message.action === 'getHistory') {
    console.log('处理获取历史记录请求');
    getInputHistory(sendResponse);
    return true; // 异步响应需要返回true
  } else {
    console.warn('收到未知类型的消息:', message);
    sendResponse({status: 'error', message: '未知的消息类型'});
    return true;
  }
});

// 保存输入内容
function saveInputContent(data) {
  console.log('开始保存输入内容:', data.text);
  
  const inputData = {
    id: Date.now(),
    text: data.text,
    url: data.url,
    title: data.title,
    timestamp: new Date().toISOString(),
    source: data.source || '未知来源'
  };
  
  try {
    chrome.storage.local.get(['inputHistory', 'lastSavedInput'], function(result) {
      const history = result.inputHistory || [];
      const lastSaved = result.lastSavedInput || {};
      console.log('当前历史记录数量:', history.length);
      
      // 检查是否是重复内容 - 比较文本内容和来源网址，增加时间窗口
      const isDuplicate = lastSaved && lastSaved.text === data.text && 
                          lastSaved.url === data.url && 
                          lastSaved.timestamp && Date.now() - lastSaved.timestamp < 8000; // 8秒内的相同内容视为重复
      
      if (isDuplicate) {
        console.log('检测到重复内容，已忽略:', data.text);
        return;
      }
      
      // 更新最后保存的内容记录
      chrome.storage.local.set({
        lastSavedInput: {
          text: data.text,
          url: data.url,
          timestamp: Date.now()
        }
      });
      
      // 检查历史记录中是否已有相同内容
      const existingIndex = history.findIndex(item => 
        item.text === data.text && item.url === data.url
      );
      
      if (existingIndex > 0) {
        // 如果存在相同内容但不在第一位，删除旧记录并添加到开头
        console.log('发现历史记录中有相同内容，更新位置');
        history.splice(existingIndex, 1);
        history.unshift(inputData);
      } else if (existingIndex === 0) {
        // 如果已经在第一位，只更新时间戳和来源
        console.log('更新最近的相同记录');
        history[0] = inputData;
      } else {
        // 添加新记录到开头
        history.unshift(inputData);
      }
      
      // 限制历史记录数量，防止存储过大
      const maxHistoryItems = 500;
      if (history.length > maxHistoryItems) {
        history.splice(maxHistoryItems);
      }
      
      chrome.storage.local.set({inputHistory: history}, function() {
        if (chrome.runtime.lastError) {
          console.error('保存历史记录失败:', chrome.runtime.lastError);
        } else {
          console.log('保存历史记录成功，当前数量:', history.length);
        }
      });
    });
  } catch (error) {
    console.error('保存输入内容时发生错误:', error);
  }
}

// 获取输入历史
function getInputHistory(callback) {
  chrome.storage.local.get(['inputHistory'], function(result) {
    console.log('获取历史记录，数量:', result.inputHistory ? result.inputHistory.length : 0);
    callback({history: result.inputHistory || []});
  });
}